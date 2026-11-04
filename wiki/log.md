# Log

## [2026-11-04T22:12:05Z] init | bootstrapped the wiki for the SELOT repository

## [2026-11-04T22:13:00Z] update | ran the SELOT Arcade client in the preview

The preview served the repository root as a directory listing. Added
`/index.html` at the repository root forwarding to `arcade/`, so any static
server rooted at the repository opens the browser client instead of a listing.
Verified all three cabinets — Aztec, Ocean World, Sparta — spin, pay out, and
persist their balance across reloads; the daily claim and stake stepper work;
the console is clean. Documented the entry point and the symbol-font
requirement in `arcade/README.md`.

The container shipped only the four Liberation fonts, so every decorative reel
symbol rendered as an empty box. Installed `fonts-noto-core` and
`fonts-dejavu-core`, ran `fc-cache -f`, and restarted Chromium — it caches its
font list at startup, so a page reload alone is not enough. Added a `.gitignore`
for `node_modules/`, `.next/`, and the standalone build output, and bootstrapped
this wiki.
