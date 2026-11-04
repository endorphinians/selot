---
type: entity
scope: project
title: Arcade sound
---

# Arcade sound

`arcade/sound.js` is the client's sound layer. Every cue is synthesised with
the WebAudio API — no audio files, no dependencies, nothing to ship. It is
loaded after `game.js` and before `app.js`, and exposes a global
`arcadeSound` object.

## Cues

| Cue | Sound | Trigger |
| --- | --- | --- |
| Reel tick | Band-passed noise burst | Every pass of a reel, staggered as the reels decelerate |
| Land | Triangle thud dropping 165 Hz → 48 Hz | A reel coming to rest |
| Line win | Three-note triangle arpeggio | A payout; the root rises four semitones per doubling of the payout size |
| Big win | Sawtooth fanfare through a low-pass, then a held chord | A payout of 20× the stake or more |
| Coin | Two sine pings, 1760 Hz then 2637 Hz | The daily claim |
| Free spins | Ascending triangle run | Free spins awarded |

`arcadeSound.spin({ reels, multiple, freeSpins, fast })` composes a whole spin:
the reel ticks and thuds are timed to the spin animation, then the win chime,
the free-spin sting, and the fanfare follow on the audio clock. `fast`
compresses the reel sequence to a flutter for players who ask for reduced
motion.

## Rules the implementation holds to

- **The AudioContext is created on the first user gesture.** `unlock()` runs
  inside the spin and claim click handlers, so the browser autoplay policy is
  never violated. It is created lazily — a visitor who never spins never gets
  one.
- **Every playback call is guarded.** Each cue sits in a `try/catch`, and a
  host without `AudioContext` simply plays silently. The client falls back to
  a no-op stub if `sound.js` is missing altogether.
- **No cue blocks the UI.** The whole sequence is scheduled ahead on the audio
  clock; nothing awaits it. A new spin fades out whatever is still ringing
  through a per-sequence gain bus, so cues never pile up.
- **Muting is immediate.** `setEnabled(false)` fades the bus out, so a chime
  already playing stops when the toggle is pressed.

## Mute toggle

The speaker button in the site header toggles the client. The choice is a
`sound` boolean on the guest profile in `localStorage` under
`selot.arcade.guest.v1`, validated in `arcade.readProfile` and defaulting to
on — a stored value that is missing, not a boolean, or null falls back to
sound on.

## Where it is wired

- `arcade/index.html` — the script tag and the header button.
- `arcade/app.js` — `refreshProfile` applies the stored flag, the spin and
  claim handlers call the cues, and `transact` gained an `onOutcome` callback
  so a cue fires the moment the spin is committed rather than after the
  animation ends.
- `arcade/build.mjs` — the standalone build inlines `sound.js` too.
