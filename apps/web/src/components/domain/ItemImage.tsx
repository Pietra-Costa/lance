import React, { useMemo } from "react";
import { placeholderPalettes } from "../../theme/colors";

/**
 * Placeholder de imagem de item.
 *
 * Motivo: as imagens vêm de APIs externas (The Met, Art Institute of Chicago,
 * Cover Art Archive) e podem falhar por 404, bloqueio de hotlink, mudança de
 * CDN ou item sem imagem. Sem placeholder, o card mostra o ícone quebrado.
 *
 * Design:
 * - Cor determinística a partir do `seed` (id do lote + título): o mesmo item
 *   sempre recebe a mesma cor, sem "piscar" entre renders ou reloads.
 * - Gradiente diagonal + iniciais do título + ícone discreto.
 * - Nenhuma imagem gerada: só CSS, então não pesa no bundle nem no carregamento.
 */

/** Hash estável (FNV-1a de 32 bits) para escolher a paleta. */
function stableHash(input: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return Math.abs(hash);
}

/** Iniciais do título, no máximo duas letras. */
function initialsOf(title: string): string {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "—";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
}

export interface ItemImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  /** Mostra o texto do título no placeholder. */
  showLabel?: boolean;
  loading?: "lazy" | "eager";
  /** Semente da paleta. Padrão: `alt`. Use o id do lote para estabilidade. */
  seed?: string;
}

export const ItemImage: React.FC<ItemImageProps> = ({
  src,
  alt,
  className = "",
  placeholderClassName = "",
  showLabel = true,
  loading = "lazy",
  seed,
}) => {
  const [failed, setFailed] = React.useState(false);

  const palette = useMemo(() => {
    const key = seed ?? alt ?? "lance";
    return placeholderPalettes[stableHash(key) % placeholderPalettes.length];
  }, [seed, alt]);

  const initials = useMemo(() => initialsOf(alt ?? ""), [alt]);

  const hasImage = typeof src === "string" && src.trim().length > 0;

  if (!hasImage || failed) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center gap-1.5 relative overflow-hidden ${placeholderClassName}`}
        style={{
          background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
          color: palette.ink,
        }}
        role="img"
        aria-label={`Sem imagem disponível para ${alt}`}
      >
        {/* Padrão geométrico sutil, sem imagem */}
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 14px)",
          }}
          aria-hidden="true"
        />

        <span className="relative font-heading font-bold text-2xl tracking-tight opacity-90">
          {initials}
        </span>

        {showLabel && (
          <span className="relative text-[10px] px-3 text-center line-clamp-2 leading-tight opacity-80">
            {alt}
          </span>
        )}

        <span className="relative text-[8px] uppercase tracking-[0.18em] opacity-60 mt-0.5">
          sem imagem
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};
