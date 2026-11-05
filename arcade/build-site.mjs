import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const output = new URL("dist/", root);
const assets = ["index.html", "style.css", "tables.js", "game.js", "sound.js", "app.js"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of assets) {
  await cp(new URL(file, import.meta.url), new URL(file, output));
}
await cp(new URL("public/productos-badge.js", root), new URL("productos-badge.js", output));

const standalone = spawnSync(process.execPath, [
  fileURLToPath(new URL("build.mjs", import.meta.url)),
  fileURLToPath(new URL("SELOT-Arcade.html", output)),
], { stdio: "inherit" });
if (standalone.status !== 0) process.exit(standalone.status ?? 1);

// Keep the deployment traceable to the checked-out GitHub source.
const revision = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: fileURLToPath(root), encoding: "utf8",
});
await writeFile(new URL("build-info.json", output), JSON.stringify({
  application: "SELOT Arcade",
  source: "https://github.com/endorphinians/selot",
  revision: revision.status === 0 ? revision.stdout.trim() : null,
  machines: ["aztec", "ocean", "sparta"],
}, null, 2) + "\n");

// Missing assets should fail the build instead of becoming a broken release.
for (const file of assets) await readFile(new URL(file, output));
console.log("Built SELOT Arcade in dist/ (web app and standalone HTML).");
