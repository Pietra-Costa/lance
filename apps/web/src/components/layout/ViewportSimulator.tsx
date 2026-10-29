import React from "react";
import { useApp } from "../../context/AppContext";
import {
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Eye,
  Gavel,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatBRL } from "../../logic/auctionRules";

export const ViewportSimulator: React.FC = () => {
  const {
    viewportMode,
    setViewportMode,
    currentRole,
    currentUser,
    wallet,
    currentRoute,
    navigateTo,
  } = useApp();

  const isDesign = currentRoute === "/design-system";
  const isVitrine = !isDesign;

  return (
    <div className="w-full max-w-full bg-brand-deep text-surface-base border-b border-brand-primary px-2.5 sm:px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 select-none z-50 sticky top-0 shadow-sm overflow-hidden">
      {/* Left: Role Switcher & Environment Pill */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-brand-primary text-accent-gold font-medium border border-accent-gold/30 text-[10px] sm:text-xs shrink-0">
          <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent-gold" />
          <span>PLATAFORMA</span>
        </span>

        <span className="text-surface-base/50 hidden sm:inline">|</span>

        {currentRole === "LICITANTE" && (
          <div className="hidden xl:flex items-center gap-1.5 ml-2 text-[11px] text-surface-base/80">
            <span>Disp.:</span>
            <span className="font-semibold text-accent-gold">
              {formatBRL(wallet.availableCents)}
            </span>
            <span className="text-surface-base/40">Â·</span>
            <span>Res.:</span>
            <span className="text-surface-base/70">
              {formatBRL(wallet.reservedCents)}
            </span>
          </div>
        )}
      </div>

      {/* Center/Right: Product Switcher Block (Vitrine LeilÃ£o vs Landing SaaS vs Design System) */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-lg border border-accent-gold/30">
          <button
            onClick={() => navigateTo("/")}
            className={`px-2.5 py-0.5 sm:py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              isVitrine
                ? "bg-surface-base text-brand-primary font-semibold shadow-xs"
                : "text-surface-base/80 hover:text-white"
            }`}
            title="Vitrine de LeilÃµes (Marketplace oficial)"
          >
            <Gavel className="w-3 h-3" />
            <span>Vitrine de LeilÃµes</span>
          </button>

          <button
            onClick={() => navigateTo("/design-system")}
            className={`px-2 py-0.5 sm:py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              isDesign
                ? "bg-brand-primary text-white font-semibold"
                : "text-surface-base/70 hover:text-white"
            }`}
            title="Design System & Tokens"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">Design System</span>
            <span className="sm:hidden">Design</span>
          </button>
        </div>

        {/* Viewport Device Switcher */}
        <div className="hidden lg:inline-flex items-center bg-black/25 rounded border border-white/10 p-0.5">
          <button
            onClick={() => setViewportMode("native")}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              viewportMode === "native"
                ? "bg-brand-primary text-white font-medium"
                : "text-surface-base/70 hover:text-white"
            }`}
            title="Responsivo Nativo 100%"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden xl:inline">Fluido</span>
          </button>
          <button
            onClick={() => setViewportMode("desktop")}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              viewportMode === "desktop"
                ? "bg-brand-primary text-white font-medium"
                : "text-surface-base/70 hover:text-white"
            }`}
            title="Desktop 1440px"
          >
            <Monitor className="w-3 h-3" />
            <span className="hidden xl:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewportMode("tablet")}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              viewportMode === "tablet"
                ? "bg-brand-primary text-white font-medium"
                : "text-surface-base/70 hover:text-white"
            }`}
            title="Tablet 768px"
          >
            <Tablet className="w-3 h-3" />
            <span className="hidden xl:inline">Tablet</span>
          </button>
          <button
            onClick={() => setViewportMode("mobile")}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              viewportMode === "mobile"
                ? "bg-brand-primary text-white font-medium"
                : "text-surface-base/70 hover:text-white"
            }`}
            title="Mobile 390px"
          >
            <Smartphone className="w-3 h-3" />
            <span className="hidden xl:inline">Mobile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

