import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/useTheme";

interface ThemeToggleProps {
  variant?: "icon" | "menu";
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "icon",
  className = "",
}) => {
  const { resolved, toggleTheme } = useTheme();
  const isDark = resolved === "dark";
  const label = isDark ? "Ativar tema claro" : "Ativar tema escuro";

  if (variant === "menu") {
    return (
      <button
        onClick={toggleTheme}
        className={`w-full px-4 py-2 text-left text-xs font-medium text-text-primary hover:bg-surface-base flex items-center gap-2 cursor-pointer ${className}`}
        aria-label={label}
      >
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-accent-gold-ink" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-brand-interactive" />
        )}
        <span>{isDark ? "Tema claro" : "Tema escuro"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center justify-center w-9 h-9 rounded-lg
        text-text-primary/80 hover:text-brand-interactive hover:bg-surface-muted
        transition-colors cursor-pointer ${className}`}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun className="w-4.25 h-4.25" strokeWidth={1.7} />
      ) : (
        <Moon className="w-4.25 h-4.25" strokeWidth={1.7} />
      )}
    </button>
  );
};
