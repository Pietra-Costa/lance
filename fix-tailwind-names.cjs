const fs = require("fs");
const path = require("path");

const root = path.resolve("apps/web/src");
const extensions = new Set([".tsx", ".ts", ".jsx", ".js"]);

// Classes antigas -> nomenclatura canônica do Tailwind CSS v4
const replacements = [
  [/\bbg-gradient-to-t\b/g, "bg-linear-to-t"],
  [/\bbg-gradient-to-tr\b/g, "bg-linear-to-tr"],
  [/\bbg-gradient-to-r\b/g, "bg-linear-to-r"],
  [/\bbg-gradient-to-br\b/g, "bg-linear-to-br"],
  [/\bbg-gradient-to-b\b/g, "bg-linear-to-b"],
  [/\bbg-gradient-to-bl\b/g, "bg-linear-to-bl"],
  [/\bbg-gradient-to-l\b/g, "bg-linear-to-l"],
  [/\bbg-gradient-to-tl\b/g, "bg-linear-to-tl"],
  [/\bbg-opacity-(\d+)\b/g, "bg-opacity-$1"],
];

const exactReplacements = new Map([
  ["h-[440px]", "h-110"],
  ["w-[440px]", "w-110"],
  ["h-[310px]", "h-77.5"],
  ["w-[310px]", "w-77.5"],
  ["max-w-[1400px]", "max-w-350"],
  ["max-w-[560px]", "max-w-140"],
  ["min-h-[155px]", "min-h-38.75"],
  ["sm:min-h-[175px]", "sm:min-h-43.75"],
  ["bg-white/[0.06]", "bg-white/6"],
  ["border-white/[0.08]", "border-white/8"],
]);

function walk(dir) {
  let files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", "dist", "build", ".git"].includes(entry.name)) {
        continue;
      }
      files = files.concat(walk(fullPath));
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

let changedFiles = 0;
let totalReplacements = 0;

for (const file of walk(root)) {
  const original = fs.readFileSync(file, "utf8");
  let updated = original;
  let count = 0;

  for (const [oldClass, newClass] of exactReplacements) {
    const escaped = oldClass.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "g");
    const matches = updated.match(regex);

    if (matches) {
      count += matches.length;
      updated = updated.replace(regex, newClass);
    }
  }

  for (const [regex, replacement] of replacements) {
    const matches = updated.match(regex);

    if (matches) {
      count += matches.length;
      updated = updated.replace(regex, replacement);
    }
  }

  if (updated !== original) {
    fs.writeFileSync(file, updated, "utf8");
    changedFiles++;
    totalReplacements += count;
    console.log(`${path.relative(process.cwd(), file)}: ${count} alterações`);
  }
}

console.log(`\nConcluído: ${totalReplacements} alterações em ${changedFiles} arquivos.`);
