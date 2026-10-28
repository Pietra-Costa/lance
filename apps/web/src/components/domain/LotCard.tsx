import React from 'react';
import { Lot } from '../../types/auction';
import { useApp } from '../../context/AppContext';
import { LotStatusBadge } from './LotStatusBadge';
import { CountdownTimer } from './CountdownTimer';
import { formatBRL } from '../../logic/auctionRules';
import { ArrowUpRight, ShieldCheck, Tag } from 'lucide-react';

export interface LotCardProps {
  lot: Lot;
  compact?: boolean;
}

export const LotCard: React.FC<LotCardProps> = ({ lot, compact = false }) => {
  const { navigateTo, currentUser } = useApp();

  const isUserLeading =
    lot.status === 'LIVE' &&
    currentUser?.id &&
    lot.currentLeaderBidderId === currentUser.id;

  const handleOpenDetail = () => {
    navigateTo(`/lotes/${lot.id}`);
  };

  return (
    <article
      onClick={handleOpenDetail}
      className={`group bg-white rounded-xl border border-[#E2DDD2] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-[#CDC5B4] cursor-pointer ${
        isUserLeading ? 'ring-2 ring-[#123D2F]' : ''
      }`}
    >
      {/* Image container with source badge */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#FAF7F2]">
        {lot.itemSnapshot.primaryImageUrl ? (
          <img
            src={lot.itemSnapshot.primaryImageUrl}
            alt={lot.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[#68716A] text-sm"
            aria-label="Imagem indispon?vel"
          >
            Imagem indispon?vel
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <LotStatusBadge status={lot.status} size="sm" />
          {isUserLeading && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#123D2F] text-[#F5F1E7] border border-[#C8A96A]/40 shadow-xs">
              Você está liderando
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 rounded bg-[#0A2B22]/80 backdrop-blur-xs text-[#F5F1E7] font-mono text-[10px] tracking-wide border border-white/10">
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
          <div className="flex items-center gap-1.5 text-xs text-[#68716A] mb-1">
            <Tag className="w-3 h-3 text-[#123D2F]" />
            <span className="font-medium">{lot.category}</span>
            <span className="text-[#E2DDD2]">•</span>
            <span className="truncate">{lot.itemSnapshot.creator}</span>
          </div>

          <h3 className="font-heading font-semibold text-base text-[#222923] group-hover:text-[#123D2F] transition-colors line-clamp-2 leading-snug">
            {lot.title}
          </h3>
        </div>

        {/* Financial info & Countdown */}
        <div className="pt-3 border-t border-[#E2DDD2]/60 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] text-[#68716A]">
              {lot.bidCount > 0 ? 'Lance atual' : 'Lance inicial'}
            </p>
            <p className="font-heading font-bold text-lg text-[#123D2F] leading-tight">
              {formatBRL(lot.currentBidCents > 0 ? lot.currentBidCents : lot.startingPriceCents)}
            </p>

          </div>

          <div className="text-right flex flex-col items-end">
            {lot.status === 'LIVE' ? (
              <>
                <span className="text-[10px] text-[#68716A] mb-0.5">Tempo restante:</span>
                <CountdownTimer targetDateISO={lot.endsAt} compact />
              </>
            ) : lot.status === 'SCHEDULED' ? (
              <>
                <span className="text-[10px] text-[#B45309] font-medium">Inicia em:</span>
                <CountdownTimer targetDateISO={lot.startsAt} isStartsAt compact />
              </>
            ) : (
              <span className="text-xs text-[#68716A] font-medium">Pregão finalizado</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetail();
          }}
          className="w-full mt-2 py-2 px-3 rounded-lg border border-[#123D2F]/20 text-[#123D2F] font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-[#123D2F] hover:text-[#F5F1E7] transition-all cursor-pointer group-hover:border-[#123D2F]"
        >
          <span>Ver detalhes do lote</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </article>
  );
};
