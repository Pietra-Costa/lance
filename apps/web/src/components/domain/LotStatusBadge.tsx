import React from 'react';
import { LotStatus } from '../../types/auction';
import { Radio, Calendar, CheckCircle2, AlertOctagon } from 'lucide-react';

export interface LotStatusBadgeProps {
  status: LotStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const LotStatusBadge: React.FC<LotStatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'LIVE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#EAF7EE] text-[#1E7E34] border border-[#1E7E34]/30 ${sizeClasses} ${className}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E7E34] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E7E34]"></span>
          </span>
          <span>Ao vivo</span>
        </span>
      );
    case 'SCHEDULED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/30 ${sizeClasses} ${className}`}
        >
          <Calendar className="w-3 h-3 text-[#B45309]" />
          <span>Em breve</span>
        </span>
      );
    case 'ENDED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-[#EFE9DB] text-[#68716A] border border-[#CDC5B4] ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-[#68716A]" />
          <span>Encerrado</span>
        </span>
      );
    case 'CANCELED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-[#FEE2E2] text-[#B91C1C] border border-[#B91C1C]/30 ${sizeClasses} ${className}`}
        >
          <AlertOctagon className="w-3 h-3 text-[#B91C1C]" />
          <span>Cancelado</span>
        </span>
      );
    default:
      return null;
  }
};
