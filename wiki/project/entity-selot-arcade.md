---
type: entity
scope: project
title: SELOT Arcade
---

# SELOT Arcade

The static browser client in `arcade/`. Dependency-free: plain HTML, CSS, and
classic (non-module) JavaScript, so it runs from any static file server and
also builds into one offline HTML file.

## Files

| File | Role |
| --- | --- |
| `arcade/index.html` | Page shell — lobby and cabinet markup. |
| `arcade/style.css` | The whole visual system. Dark green-black ground, cream text, lime accent, one serif display face. |
| `arcade/tables.js` | Generated reel strips, paylines, bet ladders, and paytables for all three machines. Produced by `arcade/export-config.py` from `resources/scripts`. |
| `arcade/game.js` | The spin engine. Exposes `arcade` (spin, claim, daily, profile read/write). |
| `arcade/sound.js` | The synthesised sound layer. Exposes `arcadeSound`. See [arcade sound](entity-arcade-sound.md). |
| `arcade/app.js` | Rendering, routing by URL hash, and localStorage persistence. |
| `arcade/build.mjs` | Inlines the CSS and the four scripts into one standalone HTML file. |
| `arcade/export-config.py` | Regenerates `tables.js` from the original `.xls` workbooks (needs Python `xlrd`). |

## The three machines

- **Aztec** — 30 paylines. Sun-disc scatter awards 10 free spins; puzzle
  pieces pay every 6 collected; the star is wild.
- **Ocean World** — 25 paylines. Treasure chests and turtle races pay extra;
  matching full columns on reels two and four double line wins; those reels
  turn wild during free spins.
- **Sparta** — 25 paylines. Three banners award 5 free spins with a wild
  centre reel; landed warriors hold until the round ends.

## State

One guest profile lives in `localStorage` under `selot.arcade.guest.v1`: a
shared credit balance (10,000 to start), the daily-claim date, the sound
preference, and per-machine bet index, free-spin count, puzzle pieces, held
cells, and last result.
`readProfile` validates every field on load and falls back to a fresh profile
if the stored one is malformed, so a hand-edited or truncated entry can never
break the client.

## Symbols and fonts

The reel tiles use Unicode characters (`✦ ☀ ✚ ♜ ◆ ▣ ✿ ✸ ⚑` and the rest).
Any host without a font covering them renders empty boxes — the symptom is a
reel full of tofu, not an error. See
[the preview entry-point decision](decision-preview-entry-point.md) for the
sandbox-side fix.
