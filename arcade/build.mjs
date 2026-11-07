import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve(process.argv[2] ?? "SELOT-Arcade.html");
const readSource = file => readFile(new URL(file, import.meta.url), "utf8");
const [page, style, symbols, ...scripts] = await Promise.all(
  ["index.html", "style.css", "symbols.css", "tables.js", "game.js", "sound.js", "app.js"].map(readSource),
);
const standalone = page
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${style}</style>`)
  .replace('<link rel="stylesheet" href="symbols.css">', () => `<style>\n${symbols}</style>`)
  .replace(/^\s*<script defer src="[^"]+"><\/script>\s*$/gm, "")
  .replace("</body>", () => `<script>\n${scripts.join("\n")}</script>\n</body>`);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, standalone);
console.log(output);
