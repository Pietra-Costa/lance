import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../../context/AppContext";
import { formatBRL, formatDateTimeBR } from "../../logic/auctionRules";
import { ItemImage } from "./ItemImage";
import { AlertTriangle, X, ArrowRight, Clock } from "lucide-react";
import { motion } from "motion/react";

/**
 * Modal aberto ao clicar em uma notificação.
 *
 * Mostra o contexto completo do evento: lote, valor, data
 * e ação sugerida. Os dados vêm do payload da notificação.
 */

interface NotificationPayload {
  lotId?: unknown;
  amountCents?: unknown;
  releasedCents?: unknown;
  outbidAt?: unknown;
  settlementId?: unknown;
}

export interface NotificationModalProps {
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  onClose: () => void;
}

const TITLES: Record<string, string> = {
  BID_OUTBID: "Você foi superado",
  AUCTION_WON: "Você arrematou um lote",
  LOT_CANCELED: "Lote cancelado",
};

export const NotificationModal: React.FC<NotificationModalProps> = ({
  type,
  payload,
  createdAt,
  onClose,
}) => {
  const { lots, navigateTo } = useApp();

  const data = payload as NotificationPayload;
  const lotId = typeof data.lotId === "string" ? data.lotId : null;
  const lot = lotId ? lots.find((item) => item.id === lotId) : undefined;

  const amountCents =
    typeof data.amountCents === "number"
      ? data.amountCents
      : typeof data.releasedCents === "number"
        ? data.releasedCents
        : null;

  const isCanceled = type === "LOT_CANCELED";
  const isWin = type === "AUCTION_WON";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleGoToLot = () => {
    if (lotId) {
      navigateTo(`/lotes/${lotId}`);
      onClose();
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex max-h-[min(90dvh,800px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={TITLES[type] ?? "Notificação"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={`flex shrink-0 items-center justify-between px-5 py-3.5 text-white ${
            isCanceled
              ? "bg-semantic-error"
              : isWin
                ? "bg-semantic-success"
                : "bg-semantic-warning"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs font-semibold">
              {TITLES[type] ?? "Notificação"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar notificação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto p-5">
          {lot ? (
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border-subtle">
                <ItemImage
                  src={lot.itemSnapshot.primaryImageUrl}
                  alt={lot.title}
                  seed={lot.id}
                  className="h-full w-full object-cover"
                  showLabel={false}
                />
              </div>

              <div className="min-w-0">
                <span className="block font-mono text-[10px] font-bold text-brand-primary">
                  {lot.code}
                </span>

                <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-text-primary">
                  {lot.title}
                </h3>

                <span className="text-[10px] text-text-secondary">
                  {lot.status === "LIVE"
                    ? "Ao vivo"
                    : lot.status === "SCHEDULED"
                      ? "Agendado"
                      : lot.status === "ENDED"
                        ? "Encerrado"
                        : "Cancelado"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-secondary">
              O lote desta notificação não está mais disponível na vitrine.
            </p>
          )}

          <p className="text-xs leading-relaxed text-text-primary">
            {isCanceled
              ? "Este lote foi cancelado pelo leiloeiro. O saldo que estava reservado no seu lance foi devolvido ao disponível."
              : isWin
                ? "Você arrematou este lote. O comprovante de liquidação simulada já está disponível em Meus Arremates."
                : "Outro licitante enviou um lance maior neste lote. Sua reserva foi liberada e o valor voltou ao saldo disponível."}
          </p>

          <dl className="grid grid-cols-2 gap-3 text-xs">
            {amountCents !== null && (
              <div className="rounded-xl border border-border-subtle bg-[#FAF7F2] p-2.5">
                <dt className="block text-[10px] text-text-secondary">
                  {isCanceled ? "Saldo liberado" : "Valor do lance"}
                </dt>

                <dd className="font-heading text-sm font-bold text-brand-primary">
                  {formatBRL(amountCents)}
                </dd>
              </div>
            )}

            <div className="rounded-xl border border-border-subtle bg-[#FAF7F2] p-2.5">
              <dt className="flex items-center gap-1 text-[10px] text-text-secondary">
                <Clock className="h-3 w-3" />
                Quando
              </dt>

              <dd className="text-[11px] font-medium text-text-primary">
                {formatDateTimeBR(createdAt)}
              </dd>
            </div>
          </dl>

          {lot && lot.status === "LIVE" && !isCanceled && (
            <p className="rounded-lg border border-semantic-warning/25 bg-semantic-warning-bg/60 px-3 py-2 text-[11px] text-semantic-warning">
              O pregão continua aberto — você pode retomar a liderança.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border-subtle p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-border-subtle px-3.5 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-base"
          >
            Fechar
          </button>

          {lotId && (
            <button
              type="button"
              onClick={handleGoToLot}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-primary px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-deep"
            >
              {isWin ? "Ver comprovante" : "Ir para o lote"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modal, document.body);
};
