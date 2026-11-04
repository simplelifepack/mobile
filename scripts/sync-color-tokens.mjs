import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Usage: node scripts/sync-color-tokens.mjs "/path/to/ReadiNes Design System/tokens/tokens.css"
const source = process.argv[2];
if (!source) throw new Error("Pass the design system tokens.css export path.");
const css = readFileSync(source, "utf8");
const blocks = [css.split(":root {", 2)[1], css.split(':root[data-theme="dark"] {', 2)[1]];
let output = "// ReadiNes Design System 1.0: color tokens from the supplied Light/Dark tokens.\n// Preserve semantic names; application aliases belong in the theme adapters.\n";
for (const [index, mode] of ["light", "dark"].entries()) {
  const tokens = Object.fromEntries([...blocks[index].split("\n}", 1)[0].matchAll(/--color-([\w-]+): ([^;]+);/g)].map((m) => [m[1], m[2]]));
  if (!tokens["action-primary-default"]) throw new Error(`Missing ${mode} color tokens`);
  const resolved = Object.fromEntries(Object.entries(tokens).map(([key, value]) => [key, value.startsWith("var(--color-") ? tokens[value.slice(12, -1)] : value]));
  output += `export const ${mode}ColorTokens = ${JSON.stringify(resolved, null, 2)} as const;\n\n`;
}
writeFileSync(resolve(import.meta.dirname, "../src/design/tokens/colorTokens.ts"), output);
