import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

export interface CountdownTimerProps {
  targetDateISO: string;
  isStartsAt?: boolean;
  onExpire?: () => void;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDateISO,
  isStartsAt = false,
  onExpire,
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: false });

  useEffect(() => {
    const calculate = () => {
      const target = new Date(targetDateISO).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalMs: 0,
          expired: true,
        });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        totalMs: diff,
        expired: false,
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDateISO, onExpire]);

  if (timeLeft.expired) {
    return (
      <span className="text-xs text-text-secondary font-medium flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        <span>{isStartsAt ? "Iniciado" : "Encerrado"}</span>
      </span>
    );
  }

  // Anti-sniping warning window: less than 2 minutes (120,000 ms)
  const isAntiSnipingActive = !isStartsAt && timeLeft.totalMs <= 120000;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
          isAntiSnipingActive
            ? "text-semantic-warning animate-pulse"
            : "text-text-primary"
        }`}
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
        isAntiSnipingActive
          ? "bg-semantic-warning-bg border-semantic-warning/40 text-semantic-warning"
          : "bg-surface-base border-border-subtle text-text-primary"
      }`}
    >
      {isAntiSnipingActive ? (
        <AlertTriangle className="w-4 h-4 text-semantic-warning shrink-0 animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-brand-primary shrink-0" />
      )}
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <>
            <span className="font-bold text-sm">{timeLeft.days}</span>
            <span className="text-[10px] text-text-secondary mr-1">d</span>
          </>
        )}
        <span className="font-bold text-sm">
          {String(timeLeft.hours).padStart(2, "0")}
        </span>
        <span className="text-text-secondary">:</span>
        <span className="font-bold text-sm">
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className="text-text-secondary">:</span>
        <span className="font-bold text-sm">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
      {isAntiSnipingActive && (
        <span className="text-[10px] font-sans font-bold bg-semantic-warning text-white px-1.5 py-0.5 rounded">
          Anti-sniping (+2m)
        </span>
      )}
    </div>
  );
};

