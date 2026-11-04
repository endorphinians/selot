# SELOT Arcade

A browser client for Aztec, Ocean World, and Sparta with fictional credits. It
runs independently as a guest arcade. One browser profile shares a balance
across all three machines and keeps each machine's free spins and last result.
The daily claim follows the weekday values from the original sign-in table and
resets at midnight according to the device's local calendar.

## Run

From the repository root, serve the client with `python3 -m http.server 8080
--directory arcade` and open <http://localhost:8080>. The client requires no
packages or credentials. For a single offline HTML file, run
`node arcade/build.mjs /path/to/SELOT-Arcade.html`. Use the local server for
consistent browser storage across reloads.

The repository root also carries an `index.html` entry point that forwards to
`arcade/`, so a static server rooted at the repository root — the hosted
preview, for instance — opens the client instead of a directory listing.

The reel symbols are Unicode characters (✦ ☀ ✚ ♜ ◆ ▣ ✿ ✸ ⚑ and the rest), so
the machine needs a font that covers them. macOS and Windows ship one;
a bare Linux container does not, and the reels fall back to empty boxes until
`fonts-noto-core` and `fonts-dejavu-core` are installed.

## Sound

`arcade/sound.js` synthesises every cue with the WebAudio API — there are no
audio files and no dependencies. It is loaded after `game.js` and exposes a
global `arcadeSound` object.

| Cue | Behaviour |
| --- | --- |
| Reel tick | Short filtered-noise click on every pass of a reel, staggered as the reels decelerate. |
| Land | Low thud when a reel stops. |
| Line win | Rising three-note chime; every doubling of the payout lifts the pitch. |
| Big win | Fanfare for a payout of twenty times the stake or more. |
| Coin | Bright two-note ping when the daily reward is claimed. |
| Free spins | Ascending sting when free spins are awarded. |

The `AudioContext` is created on the first user gesture — a spin or the daily
claim — so the browser autoplay policy is never violated, and it is resumed if
the browser suspended it. Every playback call is guarded, so a host without Web
Audio plays silently instead of failing, and no cue blocks the UI or the spin
animation: the whole sequence is scheduled on the audio clock and a new spin
fades out whatever is still ringing.

The speaker button in the site header mutes the client. The choice is stored as
a `sound` boolean on the guest profile in `localStorage`, validated in
`arcade.readProfile` and defaulting to on.

## Configuration

`tables.js` is generated from the original `resources/scripts` workbooks by
`python3 arcade/export-config.py` with the Python `xlrd` package installed.
The client uses the first lobby tier's stake options and the corresponding
reel strips, paylines, and base paytables. Guest play opens all three machines
from the start and uses a 10,000-credit starting balance.

The browser ports Aztec's puzzle and scatter features, Ocean World's treasure
and turtle-race outcomes, and Sparta's scatter free spins. It reports Ocean
bonus outcomes directly in the spin result. The legacy Java server, player
accounts, shared jackpots, and multiplayer bonus rounds are outside the guest
arcade. The client has no phone authentication, messaging, payments, or
cash-out flows.
