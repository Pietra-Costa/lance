import React from "react";
import { LotStatus } from "../../types/auction";
import { Calendar, CheckCircle2, AlertOctagon } from "lucide-react";

export interface LotStatusBadgeProps {
  status: LotStatus;
  size?: "sm" | "md";
  className?: string;
}

export const LotStatusBadge: React.FC<LotStatusBadgeProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  switch (status) {
    case "LIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-semantic-success-bg text-semantic-success border border-semantic-success/30 ${sizeClasses} ${className}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-semantic-success"></span>
          </span>
          <span>Ao vivo</span>
        </span>
      );
    case "SCHEDULED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-semantic-warning-bg text-semantic-warning border border-semantic-warning/30 ${sizeClasses} ${className}`}
        >
          <Calendar className="w-3 h-3 text-semantic-warning" />
          <span>Em breve</span>
        </span>
      );
    case "ENDED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-[#EFE9DB] text-text-secondary border border-border-strong ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-text-secondary" />
          <span>Encerrado</span>
        </span>
      );
    case "CANCELED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-semantic-error-bg text-semantic-error border border-semantic-error/30 ${sizeClasses} ${className}`}
        >
          <AlertOctagon className="w-3 h-3 text-semantic-error" />
          <span>Cancelado</span>
        </span>
      );
    default:
      return null;
  }
};

