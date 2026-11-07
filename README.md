# SELOT

SELOT contains a browser arcade and the original Java game-server projects.
The browser app runs independently with fictional credits and needs no account,
API keys, database, or package installation.

## Build the app

Use Node.js 20 or newer from the repository root:

```sh
npm test
npm run build
python3 -m http.server 8080 --directory dist
```

Open <http://localhost:8080>. The build produces:

| Output | Purpose |
| --- | --- |
| `dist/index.html` and assets | Static web app for any web host |
| `dist/SELOT-Arcade.html` | Self-contained file that also opens offline |
| `dist/build-info.json` | Source repository, build revision, and machine list |

Aztec, Ocean World, and Sparta share a 10,000-credit guest balance. Daily
rewards, free spins, last results, and sound preferences save in the browser.
An offline file uses its browser's file-storage behavior; use the hosted app
for consistent progress across visits. Credits have no cash value.

The Arcade Build workflow tests the game rules and uploads the web build on
GitHub pushes and pull requests affecting the client.

## Source

See [the arcade documentation](arcade/README.md) for rules, sound, and the
workbook configuration exporter. Build the web client from this repository;
no external app-builder project or exported ZIP is required.

The legacy Java projects are separate from the guest arcade. Their Gradle
files expect a multi-project root build that is absent from this checkout;
the repository does not contain a Gradle wrapper. The web build does not run
those servers, multiplayer games, server accounts, or shared jackpots.

## Twilio

The guest arcade has no messaging or phone verification. Twilio is therefore
not a dependency of this build. A future account service can integrate Twilio
Verify on the server with credentials supplied through environment variables.
