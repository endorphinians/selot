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
