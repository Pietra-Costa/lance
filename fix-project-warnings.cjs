const fs = require("fs");
const path = require("path");

const root = path.resolve("apps/web/src");
const extensions = new Set([".tsx", ".ts", ".jsx", ".js"]);

const replacements = [
  ["border-[#E2DDD2]", "border-border-subtle"],
  ["bg-[#123D2F]", "bg-brand-primary"],
  ["text-[#F5F1E7]", "text-surface-base"],
  ["border-[#C8A96A]/40", "border-accent-gold/40"],
  ["text-[#123D2F]", "text-brand-primary"],
  ["bg-[#123D2F]/10", "bg-brand-primary/10"],
  ["border-[#123D2F]/20", "border-brand-primary/20"],
  ["text-[#68716A]", "text-text-secondary"],
  ["bg-[#E2DDD2]", "bg-border-subtle"],
  ["text-[#B45309]", "text-semantic-warning"],
  ["hover:text-[#222923]", "hover:text-text-primary"],
  ["text-[#1E7E34]", "text-semantic-success"],
  ["hover:bg-[#0A2B22]", "hover:bg-brand-deep"],
  ["border-[#CDC5B4]", "border-border-strong"],
  ["hover:border-[#123D2F]", "hover:border-brand-primary"],
  ["border-[#1E7E34]/30", "border-semantic-success/30"],
  ["text-[#222923]", "text-text-primary"],
  ["divide-[#E2DDD2]", "divide-border-subtle"],
  ["bg-[#EAF7EE]", "bg-semantic-success-bg"],
  ["bg-[#F5F1E7]", "bg-surface-base"],
  ["bg-[#FEF3C7]", "bg-semantic-warning-bg"],
  ["border-[#123D2F]", "border-brand-primary"],
  ["hover:bg-[#123D2F]", "hover:bg-brand-primary"],
  ["hover:text-[#F5F1E7]", "hover:text-surface-base"],
  ["text-[#C8A96A]", "text-accent-gold"],
  ["border-[#1E7E34]/40", "border-semantic-success/40"],
  ["max-w-[150px]", "max-w-37.5"],
  ["bg-[#0A2B22]", "bg-brand-deep"],
  ["text-[#B91C1C]", "text-semantic-error"],
  ["bg-[#FEE2E2]", "bg-semantic-error-bg"],
  ["border-[#B91C1C]/30", "border-semantic-error/30"],
  ["h-[440px]", "h-110"],
  ["w-[440px]", "w-110"],
  ["h-[310px]", "h-77.5"],
  ["w-[310px]", "w-77.5"],
  ["bg-gradient-to-r", "bg-linear-to-r"],
  ["bg-gradient-to-t", "bg-linear-to-t"],
  ["max-w-[1400px]", "max-w-350"],
  ["bg-white/[0.06]", "bg-white/6"],
  ["max-w-[560px]", "max-w-140"],
  ["min-h-[155px]", "min-h-38.75"],
  ["sm:min-h-[175px]", "sm:min-h-43.75"],
  ["border-white/[0.08]", "border-white/8"],
];

function walk(dir) {
  let files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", "dist", "build", ".git"].includes(entry.name)) {
        continue;
      }
      files = files.concat(walk(full));
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }

  return files;
}

let changedFiles = 0;
let total = 0;

for (const file of walk(root)) {
  const original = fs.readFileSync(file, "utf8");
  let content = original;
  let count = 0;

  for (const [oldClass, newClass] of replacements) {
    const escaped = oldClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "g");
    const matches = content.match(regex);

    if (matches) {
      count += matches.length;
      content = content.replace(regex, newClass);
    }
  }

  // Remove the three unused icons from BidderArea's lucide-react import.
  if (path.basename(file) === "BidderArea.tsx") {
    content = content.replace(
      /import\s*\{([\s\S]*?)\}\s*from\s*(["'])lucide-react\2/g,
      (whole, names) => {
        const unused = new Set(["Clock", "ArrowUpRight", "ShieldCheck"]);
        const filtered = names
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name && !unused.has(name));

        const removed = names
          .split(",")
          .map((name) => name.trim())
          .filter((name) => unused.has(name));

        count += removed.length;
        return `import {\n  ${filtered.join(",\n  ")}\n} from "lucide-react"`;
      }
    );

    // The reported conflict is on line 701: keep pt-4 and remove pt-2
    // only if both occur on that same line.
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (/\bpt-2\b/.test(lines[i]) && /\bpt-4\b/.test(lines[i])) {
        lines[i] = lines[i].replace(/\bpt-2\b/, "");
        count++;
        console.log(`Conflito de padding corrigido na linha ${i + 1}`);
      }
    }
    content = lines.join("\n");
  }

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    changedFiles++;
    total += count;
    console.log(`${path.relative(process.cwd(), file)}: ${count} alterações`);
  }
}

console.log(`\nFinalizado: ${total} alterações em ${changedFiles} arquivos.`);
