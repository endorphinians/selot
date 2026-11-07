---
type: decision
scope: project
title: Bundled symbol font for the arcade cabinets
---

# Bundled symbol font for the arcade cabinets

**Date:** 2026-11-07

## Context

The three cabinets draw their symbols from Unicode dingbats and geometric
shapes — Aztec uses ✦ ☀ ✚ ♜ ◆ †, Ocean World uses ▣ ◀ ✿ ♆ ✶, Sparta uses ✸ ⊕
▣ ⚑ ♜ ♛ ♞ ◈ ⬟ ↑, and the chrome adds ✳ ◆ ↻ ← ↗. Twenty-three distinct
codepoints in all.

Nothing in the repository shipped a font, so every one of those glyphs was
rendered from whatever the host machine happened to have. macOS and Windows
cover them. A bare Linux container does not: the sandbox this project runs in
ships only the four Liberation families, and every special symbol came out as
an empty box. The previous session papered over that by installing
`fonts-noto-core` and `fonts-dejavu-core` inside the container — an
environment fix that vanished on the next container rebuild, and that never
helped a Linux visitor of the hosted preview.

## Options

1. **Keep the environment fix.** Install the Noto and DejaVu font packages in
   whatever serves the client. Free of code change, but the symptom returns
   on every fresh machine and the repository still depends on host setup.
2. **Replace the dingbats with inline SVG.** Remove the font dependency
   entirely and hand-draw every symbol. The strongest guarantee and the
   prettiest reels, but it discards the design's typographic idea — the
   cabinets deliberately mix dingbats with letter ranks (A K Q J T E C) as if
   they were printed card faces, and drawn icons would fight the letters.
3. **Ship a subsetted symbol font.** Cut the used glyphs out of an existing
   family and carry the result with the client.

## Decision

Option 3. `arcade/symbols.css` holds an `@font-face` for a family renamed
`SELOT Symbols`, subset from **DejaVu Sans** to exactly the twenty-three
codepoints the arcade draws and inlined as a base64 `woff2` — 17 KB of font
data, 24 KB of CSS.

The family is placed ahead of the system stack in `:root` and in `.tile`, and
declares a `unicode-range` covering those codepoints only, so the letter ranks
keep falling through to Georgia while the dingbats come from the bundled
font.

DejaVu Sans was the only single family that covers the whole set:

| Family | Missing |
| --- | --- |
| Noto Sans Symbols 2 | ♆ lobster, ⚑ banner |
| Noto Sans Symbols | every dingbat and geometric shape |
| Noto Sans Math | every pictograph |
| **DejaVu Sans** | — none — |

Base64 rather than a `.woff2` file, for two reasons: the deploy pipeline drops
binary fonts from the repository, and the offline single-file build
(`dist/SELOT-Arcade.html`) has to stay self-contained.

## Why not a `woff2` file in the repository

Committed binaries above 1.5 MB are dropped and other binary types arrive
corrupted; fonts are skipped. An external font file would work locally and
break in production. Inlining sidesteps both problems and costs one CSS file.

## Consequences

- The cabinets render identically on every machine, in the preview, and in the
  offline file. The sandbox no longer needs `fonts-noto-core`, and the
  previous environment fix is obsolete.
- `arcade/build.mjs` now inlines `symbols.css` as well as `style.css`, and
  `arcade/build-site.mjs` copies it into `dist/`. The standalone file grows
  from roughly 48 KB to 73 KB.
- The client carries a derived font, so `arcade/FONT-LICENSE.txt` travels with
  it. DejaVu is derived from Bitstream Vera and Arev; the licence requires the
  notices to ship, and requires a modified font to be renamed — hence
  `SELOT Symbols` rather than `DejaVu Sans`.
- Adding a symbol means extending the subset. The recipe: collect the
  codepoints from `arcade/app.js` (`symbols` arrays plus the chrome glyphs),
  subset DejaVu Sans to them with `fontTools.subset`, rename the name table,
  and regenerate the base64 block in `arcade/symbols.css`.

## Verified

All three cabinets spun in the preview: every special symbol draws, the
letter ranks stay in the serif, the built `dist/` site and the standalone
`dist/SELOT-Arcade.html` both render with no external requests, and the
console stays clean. `npm test` passes 11 of 11.
