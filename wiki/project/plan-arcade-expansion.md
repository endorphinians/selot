---
type: concept
scope: project
title: Arcade expansion plan
---

# Arcade expansion plan

**Date:** 2026-11-04

The develop plan approved for the SELOT Arcade client. The plan card itself was
rendered in an earlier ProductOS session whose transcript is no longer present in
the workspace, so this page records the scope that was approved and is the brief
the builders work from.

## Starting point

`arcade/` is a finished, dependency-free static client: a lobby, three cabinets
(Aztec, Ocean World, Sparta), a spin engine with scatter, puzzle, chest, turtle
race and held-warrior mechanics, a shared guest balance in `localStorage`, a
daily claim, and a stake stepper. It was verified in the preview: all three
cabinets spin, pay, and persist.

Two things stood out as the gaps worth closing:

- The collection shows `01 — 03`. The repository carries roughly 38 reel
  machines in `robot/src/com/robot/slot/slot1..slot38` with their balance
  tables in `resources/scripts`. Only three are playable.
- The client is silent. It has no paytable and no session history, so a player
  cannot see what pays what or how a session is going.

## Steps

### 1. Sound

Every sound is synthesised with the WebAudio API — no audio files, no new
dependencies. A new `arcade/sound.js`, loaded after `game.js`, exposes an
`arcadeSound` object.

| Cue | Behaviour |
| --- | --- |
| Reel tick | Short filtered-noise tick per reel pass, staggered as the reels decelerate. |
| Land | Low thud when a reel stops. |
| Line win | Rising chime arpeggio; pitch scales with the payout size. |
| Big win | Fanfare for a payout of 20x the stake or more. |
| Coin | Bright ping on the daily claim. |
| Free spins | Ascending sting when free spins are awarded. |

The AudioContext is created lazily on the first user gesture (spin or claim) so
the browser autoplay policy is never violated. Every playback call is wrapped
in `try/catch` and degrades silently when audio is unavailable. Cues never
block the UI or the spin animation.

A mute toggle lives in the site header. It is persisted as a `sound` boolean on
the existing profile and validated in `arcade.readProfile`, defaulting to on.

### 2. Paytable and odds

Each cabinet gains a paytable panel built from the `pays` data already in
`tables.js`: the symbol glyph, its name, and the award for three, four and five
of a kind from the left. The panel also states the machine's theoretical return
percentage, computed from the reel strips, paylines and paytable, and the
largest possible single-line award.

### 3. Session stats and history

The lobby gains a session panel: spins played, credits wagered, credits
returned, session return percentage, the best win, and the last ten results.
The counters are persisted on the profile alongside the credits and survive a
reload, matching how the rest of the guest state is stored.

### 4. More cabinets

The collection grows from three machines to eight. Five more are exported from
`resources/scripts` through `arcade/export-config.py`, which needs the Python
`xlrd` package; if it is not installed the export runs from a local virtual
environment.

Selection rule: slots with a lobby entry in `slotsList.xls` (`list == 1`) that
are not already ported, preferring machines whose bonus behaviour is scatter
based so the existing engine covers them without new archetypes.

Each new machine needs its own entry in the `machines` map in `arcade/app.js`:
a symbol table with a glyph and a label per symbol, a theme class in
`arcade/style.css`, cabinet art, a caption, a description and the rules copy.
The `wilds` map in `arcade/game.js` is currently hardcoded per machine, so it
moves into the exported data to cover every machine.

The lobby copy, the collection counter and the page metadata change from
"three machines" to the new count.

## Constraints

- No runtime dependencies. The client stays plain HTML, CSS and classic
  JavaScript that runs from a static file server.
- `arcade/tables.js` is generated. The generator is edited, never the output.
- The Java server, MySQL, player accounts and multiplayer bonus rounds stay out
  of scope — this remains a guest arcade.
