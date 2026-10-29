/**
 * Normaliza as cores fixas dos componentes para tokens de tema.
 *
 * Problema: vários componentes usam classes com hex literal
 * (`bg-[#FAF7F2]`, `text-[#F5F1E7]`) ou branco puro (`bg-white`). Isso ignora
 * os tokens do Tailwind e quebra o tema escuro — um card `bg-white` continua
 * branco no escuro.
 *
 * O que este script faz:
 *  1. Mapeia hex -> token semântico equivalente (`#FAF7F2` -> `surface-subtle`).
 *     Usado em `bg-`, `text-`, `border-`, `from-`, `via-`, `to-`, `ring-`, etc.
 *  2. Converte `bg-white` / `bg-white/70` para `bg-surface-card` (mesma cor no
 *     tema claro, superfície escura no tema escuro).
 *  3. Deixa intocado o que é intencionalmente escuro nos dois temas (overlays
 *     de modal, blocos invertidos, cores da cena 3D): esses hex não estão no
 *     mapa e são preservados.
 *
 * É idempotente: rodar duas vezes não muda nada.
 *
 * Uso: node scripts/theme-tokens.cjs [--dry]
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../apps/web/src");
const DRY = process.argv.includes("--dry");

const EXTENSIONS = new Set([".tsx", ".ts"]);

/**
 * Hex -> nome do token.
 *
 * Regra: só entram aqui cores de interface (superfícies, bordas, texto,
 * marca, semânticas). Overlays escuros e cores de materiais 3D ficam fora,
 * porque devem continuar iguais nos dois temas.
 */
const COLOR_MAP = {
  // Superfícies
  "#FFFFFF": "surface-card",
  "#FAF7F2": "surface-subtle",
  "#F8F5EE": "surface-subtle",
  "#FBFAF6": "surface-subtle",
  "#F7F5EF": "surface-base",
  "#F5F1E7": "surface-base",
  "#EFE9DB": "surface-muted",
  "#EEE7D8": "surface-muted",
  "#E8E5DC": "surface-muted",
  "#E4DFD3": "surface-muted",
  "#E4DED0": "surface-muted",
  "#F0EDE4": "surface-muted",
  "#F5F3ED": "surface-muted",
  "#F2F1EC": "surface-muted",
  // Bordas
  "#E2DDD2": "border-subtle",
  "#E2DDCF": "border-subtle",
  "#DEDED5": "border-subtle",
  "#E4E1D8": "border-subtle",
  "#DCD6C9": "border-subtle",
  "#D9CFBA": "border-subtle",
  "#D6D0C2": "border-subtle",
  "#E7E0D2": "border-subtle",
  "#DED5C4": "border-subtle",
  "#CDC5B4": "border-strong",
  "#B7BBAE": "border-strong",
  // Texto
  "#222923": "text-primary",
  "#202820": "text-primary",
  "#393D35": "text-primary",
  "#51594F": "text-primary",
  "#4E554C": "text-primary",
  "#68716A": "text-secondary",
  "#626A61": "text-secondary",
  "#72776D": "text-secondary",
  "#74796F": "text-secondary",
  "#777D73": "text-secondary",
  "#85877C": "text-secondary",
  "#969990": "text-secondary",
  "#A2A59C": "text-secondary",
  "#A4A398": "text-secondary",
  "#B3B5AC": "text-secondary",
  "#A69A7D": "text-secondary",
  "#B7A67E": "text-secondary",
  "#C9B990": "text-secondary",
  "#514833": "text-secondary",
  // Marca (fixas — valem nos dois temas)
  "#123D2F": "brand-primary",
  "#10392D": "brand-primary",
  "#17382C": "brand-primary",
  "#315B48": "brand-primary",
  "#0A2B22": "brand-deep",
  "#C8A96A": "accent-gold",
  "#C8AA70": "accent-gold",
  "#D2B77E": "accent-gold",
  "#D7C49B": "accent-gold",
  "#D8BC82": "accent-gold",
  "#D6B979": "accent-gold",
  "#DED5C4": "accent-gold",
  "#927642": "accent-gold",
  "#947844": "accent-gold",
  // Semânticas
  "#1E7E34": "semantic-success",
  "#B45309": "semantic-warning",
  "#B91C1C": "semantic-error",
  "#991B1B": "semantic-error",
  "#A7352A": "semantic-error",
  "#1D4ED8": "semantic-info",
  "#EFF6FF": "semantic-info-bg",
  "#E7DFD0": "surface-muted",
};

/**
 * Propriedades Tailwind cujo valor pode ser um hex literal.
 * `border` também cobre `border-t`, `border-b`, etc.
 */
const PREFIXES = [
  "bg",
  "text",
  "border",
  "from",
  "via",
  "to",
  "ring",
  "divide",
  "fill",
  "stroke",
  "shadow",
  "outline",
  "decoration",
  "placeholder",
  "caret",
  "accent",
];

function tokenFor(hex) {
  return COLOR_MAP[hex.toUpperCase()] ?? null;
}

/** Converte `prefix-[#HEX]` e `prefix-[#HEX]/opacidade`. */
function convertHexClasses(content) {
  const pattern = new RegExp(
    `(^|[\\s"'\`:])(${PREFIXES.join("|")})-\\[(#[0-9A-Fa-f]{3,8})\\](\\/[0-9.]+)?`,
    "g",
  );

  return content.replace(pattern, (match, lead, prefix, hex, alpha) => {
    const token = tokenFor(hex);

    if (!token) return match;

    return `${lead}${prefix}-${token}${alpha ?? ""}`;
  });
}

/** `bg-white` -> `bg-surface-card`, preservando a opacidade. */
function convertWhiteBackgrounds(content) {
  return content.replace(
    /(^|[\s"'`:])(bg|from|via|to)-white(\/[0-9.]+)?/g,
    (match, lead, prefix, alpha) =>
      `${lead}${prefix}-surface-card${alpha ?? ""}`,
  );
}

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }

    if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }

  return files;
}

let changed = 0;
let total = 0;

for (const file of walk(ROOT)) {
  const original = fs.readFileSync(file, "utf8");
  let next = convertHexClasses(original);
  next = convertWhiteBackgrounds(next);

  total += 1;

  if (next !== original) {
    changed += 1;
    console.log(
      `${DRY ? "[dry] " : ""}${path.relative(ROOT, file)}`.padEnd(60),
      "atualizado",
    );

    if (!DRY) fs.writeFileSync(file, next, "utf8");
  }
}

console.log(
  `\n${changed} de ${total} arquivos ${DRY ? "seriam" : "foram"} atualizados.`,
);
