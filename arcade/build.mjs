import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve(process.argv[2] ?? "SELOT-Arcade.html");
const readSource = file => readFile(new URL(file, import.meta.url), "utf8");
const [page, style, ...scripts] = await Promise.all(
  ["index.html", "style.css", "tables.js", "game.js", "app.js"].map(readSource),
);
const standalone = page
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${style}</style>`)
  .replace(/^  <script defer src="[^"]+"><\/script>\n/gm, "")
  .replace("</body>", () => `<script>\n${scripts.join("\n")}</script>\n</body>`);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, standalone);
console.log(output);
