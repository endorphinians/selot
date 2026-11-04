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

## [2026-11-04T22:24Z] develop | started the arcade expansion

Recorded the approved develop scope in `wiki/project/plan-arcade-expansion.md`
and handed the first step to the Fullstack Builder: a synthesised sound layer
for the client, with a persisted mute toggle.

The collection still shows three cabinets against the roughly 38 reel machines
in the repository, and the client has no paytable and no session history. Those
are the next three steps.

## [2026-11-04T22:28Z] update | added the synthesised sound layer

Step 1 of the arcade expansion is built. `arcade/sound.js` exposes `arcadeSound`
and synthesises every cue with the WebAudio API — no audio files, no
dependencies: a filtered-noise tick on every reel pass, a thud when a reel
stops, a chime whose pitch rises with the payout, a fanfare at 20× the stake, a
ping on the daily claim, and an ascending sting when free spins are awarded.

The AudioContext is created on the first user gesture, every playback call is
guarded, and the sequence is scheduled on the audio clock so no cue blocks the
UI. A speaker button in the site header mutes the client; the choice is a
`sound` boolean on the guest profile, validated in `arcade.readProfile` and
defaulting to on.

Verified in the preview: a spin schedules 30 reel ticks and the thuds plus the
win chime, a 25× payout adds the fanfare, a forced scatter award plays the
free-spin sting and leaves ten free spins on the cabinet, a muted spin
schedules nothing at all, the daily claim pays 4,000 and pings, the toggle
survives a reload, and the console stays clean. `node arcade/build.mjs` still
produces a working single-file build, now with the sound layer inlined.
