import React from 'react';

export interface LogoProps {
  variant?: 'light' | 'dark' | 'isolated' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
  onClick,
}) => {
  // Color tokens per brand guide:
  // Verde Lance: #123D2F
  // Verde profundo: #0A2B22
  // Off-white: #F5F1E7
  // Grafite: #222923
  // Dourado suave: #C8A96A

  const isDark = variant === 'dark';
  const isMono = variant === 'monochrome';
  const isIsolated = variant === 'isolated';

  const symbolFill = isDark ? '#F5F1E7' : isMono ? '#222923' : '#123D2F';
  const diamondStroke = isDark ? '#C8A96A' : isMono ? '#222923' : '#123D2F';
  const textColor = isDark ? 'text-[#F5F1E7]' : isMono ? 'text-[#222923]' : 'text-[#123D2F]';
  const subtitleColor = isDark ? 'text-[#F5F1E7]/70' : isMono ? 'text-[#68716A]' : 'text-[#68716A]';

  const sizeDimensions = {
    sm: { symbol: 24, text: 'text-base', sub: 'text-[9px]' },
    md: { symbol: 32, text: 'text-xl', sub: 'text-[10px]' },
    lg: { symbol: 42, text: 'text-2xl', sub: 'text-[11px]' },
    xl: { symbol: 56, text: 'text-4xl', sub: 'text-[13px]' },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Abstract geometric symbol: diamond with precise architectural L */}
      <svg
        width={sizeDimensions.symbol}
        height={sizeDimensions.symbol}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105"
      >
        {/* Rhombus outline with subtle angle */}
        <rect
          x="20"
          y="2.5"
          width="24.75"
          height="24.75"
          rx="2"
          transform="rotate(45 20 2.5)"
          stroke={diamondStroke}
          strokeWidth="1.75"
          fill={isDark ? '#0A2B22' : '#F5F1E7'}
        />
        {/* Architectural geometric "L" */}
        <path
          d="M16 11V26.5H26.5V23.5H19V11H16Z"
          fill={symbolFill}
        />
        {/* Subtle geometric gold accent corner dot */}
        <circle cx="28" cy="12" r="1.5" fill="#C8A96A" />
      </svg>

      {!isIsolated && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-heading font-bold tracking-tight ${sizeDimensions.text} ${textColor}`}
          >
            LANCE
          </span>
          <span
            className={`font-body font-medium tracking-[0.22em] uppercase ${sizeDimensions.sub} ${subtitleColor}`}
          >
            Casa de Leilões
          </span>
        </div>
      )}
    </div>
  );
};
