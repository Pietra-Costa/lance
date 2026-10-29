import React from "react";

export interface LogoProps {
  variant?: "light" | "dark" | "isolated" | "monochrome";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = "light",
  size = "md",
  className = "",
  onClick,
}) => {
  const isDark = variant === "dark";
  const isMono = variant === "monochrome";
  const isIsolated = variant === "isolated";

  const textColor = isDark
    ? "text-surface-base"
    : isMono
      ? "text-text-primary"
      : "text-brand-primary";
  const subtitleColor = isDark ? "text-surface-base/70" : "text-text-secondary";

  const sizeDimensions = {
    sm: {
      imgHeight: "h-12",
      text: "text-lg tracking-[0.28em]",
      sub: "text-[9px] tracking-[0.15em]",
    },
    md: {
      imgHeight: "h-20",
      text: "text-2xl tracking-[0.34em]",
      sub: "text-[11px] tracking-[0.18em]",
    },
    lg: {
      imgHeight: "h-24",
      text: "text-3xl tracking-[0.36em]",
      sub: "text-[12px] tracking-[0.20em]",
    },
    xl: {
      imgHeight: "h-28",
      text: "text-4xl tracking-[0.38em]",
      sub: "text-[13px] tracking-[0.22em]",
    },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none group ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <img
        src="/assets/green.png"
        alt="Símbolo Lance"
        className={`${sizeDimensions.imgHeight} w-auto object-contain shrink-0 transition-transform group-hover:scale-105`}
      />

      {!isIsolated && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-heading font-bold uppercase ${sizeDimensions.text} ${textColor} mr-[-0.34em]`}
          >
            LANCE
          </span>
          <span
            className={`font-body font-medium uppercase mt-1 whitespace-nowrap ${sizeDimensions.sub} ${subtitleColor}`}
          >
            Casa de Leilões
          </span>
        </div>
      )}
    </div>
  );
};
