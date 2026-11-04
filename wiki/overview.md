# Overview

This repository is the SELOT game server: a Java/Gradle monorepo (`game_server`,
`game_core`, `game_db`, `game_tools`, `robot`, `h5CodeBuilder`, `resources`)
plus one browser client, `arcade/`, that plays three of the original reel
machines — Aztec, Ocean World, and Sparta — with fictional credits.

The browser client is the only thing in the repository that a browser can run.
It is dependency-free static HTML/CSS/JavaScript: `tables.js` holds reel strips,
paylines, and paytables exported from `resources/scripts`; `game.js` holds the
spin engine; `sound.js` synthesises every cue with the WebAudio API; `app.js`
renders the lobby and the cabinets. Guest play shares one balance across all
three machines in `localStorage`.

The rest of the repository — the Java server, the build tooling, the robot, the
H5 code generator — is source-only. Running it needs a JVM, a MySQL database,
and configuration this sandbox does not provide. The arcade is the app that
runs here.
