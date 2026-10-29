import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { apiGet, apiPatch } from "../../services/api";
import { formatBRL } from "../../logic/auctionRules";
import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { NotificationModal } from "../domain/NotificationModal";

interface ApiNotification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

interface ApiNotificationsResponse {
  items: ApiNotification[];
  unreadCount: number;
  totalCount?: number;
}

const indicatorFor = (type: string) => {
  switch (type) {
    case "BID_OUTBID":
      return "bg-semantic-warning";
    case "AUCTION_WON":
      return "bg-semantic-success";
    case "LOT_CANCELED":
      return "bg-semantic-error";
    default:
      return "bg-text-secondary";
  }
};

const titleFor = (type: string) => {
  switch (type) {
    case "BID_OUTBID":
      return "Você foi superado";
    case "AUCTION_WON":
      return "Você arrematou um lote";
    case "LOT_CANCELED":
      return "Lote cancelado";
    default:
      return "Notificação";
  }
};

const amountOf = (payload: Record<string, unknown>): number | null =>
  typeof payload.amountCents === "number"
    ? payload.amountCents
    : typeof payload.releasedCents === "number"
      ? payload.releasedCents
      : null;

export const NotificationBell: React.FC = () => {
  const { currentUser, currentRoute } = useApp();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [opened, setOpened] = useState<ApiNotification | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) {
      setItems([]);
      setUnreadCount(0);
      setTotalCount(0);
      return;
    }

    try {
      setLoading(true);
      const response =
        await apiGet<ApiNotificationsResponse>("/me/notifications");

      setItems(response.items);
      setUnreadCount(response.unreadCount);
      setTotalCount(response.totalCount ?? response.items.length);
    } catch (error) {
      console.error("Não foi possível carregar as notificações:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void load();
  }, [load, currentRoute]);

  // Eventos realtime apenas sinalizam que algo mudou;
  // a API continua sendo a fonte de verdade.
  useEffect(() => {
    const handleChange = () => {
      void load();
    };

    window.addEventListener("lance:notifications-changed", handleChange);

    return () => {
      window.removeEventListener("lance:notifications-changed", handleChange);
    };
  }, [load]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpen = () => {
    void load();
    setOpen((previous) => !previous);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiPatch("/me/notifications/read", {});

      const readAt = new Date().toISOString();

      setUnreadCount(0);
      setItems((previous) => previous.map((item) => ({ ...item, readAt })));
    } catch (error) {
      console.error(
        "Não foi possível marcar as notificações como lidas:",
        error,
      );
    }
  };

  const handleItemClick = (item: ApiNotification) => {
    setOpen(false);
    setOpened(item);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg
          text-text-primary/80 hover:text-brand-primary hover:bg-surface-base
          transition-colors cursor-pointer
          ${open ? "bg-surface-base text-brand-primary" : ""}`}
        aria-label={`Notificações${
          unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""
        }`}
        aria-expanded={open}
      >
        <Bell className="w-4.25 h-4.25" strokeWidth={1.7} />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-1.75 h-1.75 rounded-full bg-semantic-warning ring-2 ring-white" />
        )}

        {unreadCount > 0 && (
          <span className="sr-only">{unreadCount} notificações não lidas</span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white border border-border-subtle
            rounded-xl shadow-lg overflow-hidden z-50 origin-top-right
            animate-[dropdown-enter_180ms_cubic-bezier(0.16,1,0.3,1)_both]
            motion-reduce:animate-none"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-base">
            <div>
              <p className="text-xs font-semibold text-brand-primary">
                Notificações
              </p>

              {items.length > 0 && (
                <p className="mt-0.5 text-[10px] text-text-secondary">
                  {items.length}
                  {totalCount > items.length ? ` de ${totalCount}` : ""}{" "}
                  {totalCount === 1 ? "notificação" : "notificações"}
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-text-secondary hover:text-brand-primary
                  flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.7} />
                Marcar como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-text-secondary">
                Carregando notificações...
              </p>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs font-medium text-text-primary">
                  Tudo em dia
                </p>
                <p className="mt-1 text-[11px] text-text-secondary">
                  Nenhuma notificação por aqui.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const amount = amountOf(item.payload);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left px-4 py-3 border-b border-surface-base
    last:border-0 hover:bg-surface-base transition-colors
    cursor-pointer ${item.readAt ? "opacity-65" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary">
                          {titleFor(item.type)}
                        </p>

                        <p className="mt-1 text-[11px] text-text-secondary leading-relaxed">
                          {amount !== null ? `${formatBRL(amount)} · ` : ""}
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!item.readAt && (
                          <span className="text-[9px] font-medium text-brand-primary">
                            NOVA
                          </span>
                        )}

                        <span
                          className={`w-2.5 h-2.5 rounded-full ${indicatorFor(item.type)}`}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {opened && (
          <NotificationModal
            type={opened.type}
            payload={opened.payload}
            createdAt={opened.createdAt}
            onClose={() => setOpened(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
