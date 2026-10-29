import React from "react";
import { formatDateTimeBR } from "../../logic/auctionRules";
import type { AuditEvent } from "../../types/auction";
import { ShieldCheck, X, XCircle } from "lucide-react";

interface LotAuditModalProps {
  lotTitle: string;
  lotCode: string;
  events: AuditEvent[];
  onClose: () => void;
}

const labelFor = (eventType: string) =>
  ({
    LOT_CREATED: "Leilão criado",
    LOT_LIVE: "Leilão aberto",
    BID_PLACED: "Lance registrado",
    AUCTION_ENDED: "Leilão finalizado",
    AUCTION_WON: "Leilão vencido",
    LOT_CANCELED: "Leilão cancelado",
    SETTLEMENT_COMPLETED: "Liquidação concluída",
    LOT_UPDATED: "Lote atualizado",
  })[eventType] ?? eventType;

export const LotAuditModal: React.FC<LotAuditModalProps> = ({
  lotTitle,
  lotCode,
  events,
  onClose,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Auditoria do lote ${lotTitle}`}
      className="bg-white w-full sm:max-w-3xl max-h-dvh sm:max-h-[90vh] sm:rounded-2xl border border-border-subtle shadow-2xl flex flex-col overflow-hidden"
    >
      <div className="bg-brand-deep text-surface-base px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-accent-gold shrink-0" />
          <span className="text-xs font-semibold truncate">
            Auditoria do lote · {lotCode}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
          aria-label="Fechar auditoria do lote"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
        <p className="text-xs text-text-secondary">
          {events.length}{" "}
          {events.length === 1 ? "evento registrado" : "eventos registrados"}{" "}
          para <strong className="text-text-primary">{lotTitle}</strong>.
        </p>

        {events.length === 0 && (
          <p className="text-xs text-text-secondary">
            Nenhum evento de auditoria para este lote ainda.
          </p>
        )}

        {events.map((ev) => (
          <div
            key={ev.sequence}
            className={`rounded-2xl border p-5 space-y-3 ${
              ev.eventType === "LOT_CANCELED"
                ? "bg-red-50 border-red-300"
                : "bg-[#FAF7F2] border-border-subtle"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-8 h-8 rounded-lg text-surface-base font-mono font-bold text-xs flex items-center justify-center ${
                    ev.eventType === "LOT_CANCELED"
                      ? "bg-red-700"
                      : "bg-brand-primary"
                  }`}
                >
                  #{ev.sequence}
                </span>
                <div>
                  <span
                    className={`font-heading font-bold text-sm ${
                      ev.eventType === "LOT_CANCELED"
                        ? "text-red-800"
                        : "text-brand-primary"
                    }`}
                  >
                    {labelFor(ev.eventType)}
                  </span>
                  <span className="text-[11px] text-text-secondary block">
                    {formatDateTimeBR(ev.timestamp)}
                  </span>
                </div>
              </div>
              {ev.eventType === "LOT_CANCELED" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2.5 py-1 rounded-full border border-red-300">
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelado
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-text-primary leading-relaxed">
              {ev.description}
            </p>

            <div className="p-3 bg-white rounded-xl border border-border-subtle text-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-text-secondary block mb-1">
                Dados públicos do evento
              </span>
              <pre className="text-[11px] font-mono text-text-primary overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(ev.payloadSummary, null, 2)}
              </pre>
            </div>

            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-border-subtle">
                <span className="text-text-secondary block text-[10px] uppercase">
                  Hash anterior (prevHash):
                </span>
                <span className="text-text-secondary break-all">{ev.prevHash}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-border-strong">
                <span className="text-brand-primary font-bold block text-[10px] uppercase">
                  Hash deste registro:
                </span>
                <span className="text-brand-primary font-bold break-all">
                  {ev.hash}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
