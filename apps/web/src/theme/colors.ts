/**
 * Tokens de cor da identidade Lance.
 *
 * Fonte única de verdade para as cores usadas nos componentes.
 * Os mesmos valores estão declarados como variáveis CSS em `index.css`
 * (bloco `@theme`), o que gera as classes utilitárias do Tailwind
 * (`bg-brand-primary`, `text-text-secondary`, ...).
 *
 * Regra: componentes **não** devem escrever hex literal. Use as classes
 * utilitárias (`bg-surface-base`) ou, quando precisar do valor em JS
 * (canvas, SVG, gráficos), importe daqui.
 *
 * Paleta oficial: Lance_Identidade_Visual.pdf / seção 33 do documento
 * de arquitetura.
 */

export const colors = {
  /** Verde Lance — cor institucional principal. */
  brandPrimary: "#123D2F",
  /** Verde profundo — fundos escuros e header de comprovantes. */
  brandDeep: "#0A2B22",
  /** Off-white — fundo padrão da aplicação. */
  surfaceBase: "#F5F1E7",
  /** Superfície de card (branco puro). */
  surfaceCard: "#FFFFFF",
  /** Superfície rebaixada (área de destaque suave). */
  surfaceMuted: "#EFE9DB",
  /** Superfície interna de cards e blocos de código. */
  surfaceSubtle: "#FAF7F2",
  /** Grafite — texto principal. */
  textPrimary: "#222923",
  /** Cinza funcional — texto secundário, legendas. */
  textSecondary: "#68716A",
  /** Dourado suave — acentos, nunca em texto pequeno sem contraste. */
  accentGold: "#C8A96A",
  /** Borda sutil (divisores finos). */
  borderSubtle: "#E2DDD2",
  /** Borda forte (controles, inputs). */
  borderStrong: "#CDC5B4",
} as const;

export const semantic = {
  success: "#1E7E34",
  successBg: "#EAF7EE",
  warning: "#B45309",
  warningBg: "#FEF3C7",
  error: "#B91C1C",
  errorBg: "#FEE2E2",
  info: "#1D4ED8",
  infoBg: "#EFF6FF",
} as const;

/**
 * Paleta usada para gerar o placeholder de imagem determinístico.
 * Tons harmonizados com a identidade (verde, dourado, terracota, grafite).
 */
export const placeholderPalettes = [
  { from: "#123D2F", to: "#0A2B22", ink: "#F5F1E7" },
  { from: "#C8A96A", to: "#9C7F45", ink: "#0A2B22" },
  { from: "#3E5C50", to: "#1B342A", ink: "#F5F1E7" },
  { from: "#8C6A4A", to: "#5C4230", ink: "#F5F1E7" },
  { from: "#4A5A62", to: "#2C383E", ink: "#F5F1E7" },
  { from: "#6E5A7E", to: "#453552", ink: "#F5F1E7" },
  { from: "#7A6A3F", to: "#4E4326", ink: "#F5F1E7" },
  { from: "#2F4F5F", to: "#1A3038", ink: "#F5F1E7" },
] as const;

export type ColorToken = keyof typeof colors;
