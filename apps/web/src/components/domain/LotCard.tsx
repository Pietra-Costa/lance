import React from "react";
import { Lot } from "../../types/auction";
import { useApp } from "../../context/AppContext";
import { LotStatusBadge } from "./LotStatusBadge";
import { ItemImage } from "./ItemImage";
import { CountdownTimer } from "./CountdownTimer";
import { formatBRL } from "../../logic/auctionRules";
import { ArrowUpRight, ShieldCheck, Tag } from "lucide-react";

export interface LotCardProps {
  lot: Lot;
  compact?: boolean;
}

export const LotCard: React.FC<LotCardProps> = ({ lot, compact = false }) => {
  const { navigateTo, currentUser } = useApp();

  const isUserLeading =
    lot.status === "LIVE" &&
    currentUser?.id &&
    lot.currentLeaderBidderId === currentUser.id;

  const handleOpenDetail = () => {
    navigateTo(`/lotes/${lot.id}`);
  };

  return (
    <article
      onClick={handleOpenDetail}
      className={`group bg-white rounded-xl border border-border-subtle overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-border-strong cursor-pointer ${
        isUserLeading ? "ring-2 ring-brand-primary" : ""
      }`}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#FAF7F2]">
        <ItemImage
          src={lot.itemSnapshot.primaryImageUrl}
          alt={lot.title}
          seed={lot.id}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          showLabel={false}
        />

        <div className="absolute inset-x-0 top-0 p-2.5 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <LotStatusBadge status={lot.status} size="sm" />
            {isUserLeading && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary text-surface-base border border-accent-gold/40 shadow-xs whitespace-nowrap">
                Você está liderando
              </span>
            )}
          </div>

          <span
            className="shrink-0 max-w-[45%] truncate px-2 py-1 rounded bg-brand-deep/80 backdrop-blur-xs text-surface-base font-mono text-[10px] tracking-wide border border-white/10"
            title={lot.code}
          >
            {lot.code}
          </span>
        </div>

        {/* Source watermark */}
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white/90">
            {lot.itemSnapshot.source}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1 min-w-0">
            <Tag className="w-3 h-3 text-brand-primary shrink-0" />
            {lot.category ? (
              <>
                <span className="font-medium shrink-0">{lot.category}</span>
                {lot.itemSnapshot.creator && (
                  <span className="text-border-subtle shrink-0">•</span>
                )}
              </>
            ) : null}
            {lot.itemSnapshot.creator && (
              <span className="truncate">{lot.itemSnapshot.creator}</span>
            )}
          </div>

          <h3 className="font-heading font-semibold text-base text-text-primary group-hover:text-brand-primary transition-colors line-clamp-2 leading-snug">
            {lot.title}
          </h3>
        </div>

        {/* Financial info & Countdown */}
        <div className="pt-3 border-t border-border-subtle/60 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] text-text-secondary">
              {lot.bidCount > 0 ? "Lance atual" : "Lance inicial"}
            </p>
            <p className="font-heading font-bold text-lg text-brand-primary leading-tight">
              {formatBRL(
                lot.currentBidCents > 0
                  ? lot.currentBidCents
                  : lot.startingPriceCents,
              )}
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            {lot.status === "LIVE" ? (
              <>
                <span className="text-[10px] text-text-secondary mb-0.5">
                  Tempo restante:
                </span>
                <CountdownTimer targetDateISO={lot.endsAt} compact />
              </>
            ) : lot.status === "SCHEDULED" ? (
              <>
                <span className="text-[10px] text-semantic-warning font-medium">
                  Inicia em:
                </span>
                <CountdownTimer
                  targetDateISO={lot.startsAt}
                  isStartsAt
                  compact
                />
              </>
            ) : (
              <span className="text-xs text-text-secondary font-medium">
                Pregão finalizado
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetail();
          }}
          className="w-full mt-2 py-2 px-3 rounded-lg border border-brand-primary/20 text-brand-primary font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-brand-primary hover:text-surface-base transition-all cursor-pointer group-hover:border-brand-primary"
        >
          <span>Ver detalhes do lote</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </article>
  );
};

