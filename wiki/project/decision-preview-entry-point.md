---
type: decision
scope: project
title: Repository-root preview entry point
---

# Repository-root preview entry point

**Date:** 2026-11-04

## Context

The preview server serves the repository root, not `arcade/`. With the client
living in a subdirectory and no `index.html` at the root, the preview URL
returned a directory listing of the whole monorepo — `game_server/`,
`code_libs/`, `.git/`, and the rest — instead of the app.

Three fixes were possible:

1. Move the client to the repository root.
2. Rename `arcade/` to `frontend/`, the convention the managed preview
   launcher recognises.
3. Add a root `index.html` that forwards to `arcade/`.

## Decision

Add `/index.html` — a small entry page that forwards to `arcade/` — and leave
`arcade/` exactly where the repository put it.

```html
<meta http-equiv="refresh" content="0; url=./arcade/">
<script>location.replace("./arcade/");</script>
```

The visible fallback is a styled "Enter the arcade" link in the arcade's own
palette, so a browser that blocks the automatic hop still lands somewhere
usable.

## Why

- `arcade/` is the repository's own name for the client. Renaming it to
  `frontend/` would fight the imported layout and the README.
- Moving the files to the root would scatter the monorepo's web assets and
  duplicate nothing — but it changes what the repository *is*.
- The forwarding page is one small file with no duplicated markup, so the
  client cannot drift out of sync with it.
- It survives whichever static server ends up in front of the repository: a
  server rooted at the repository root serves the page and the client, and a
  server rooted at `arcade/` serves the client directly. Both open the app.

## Consequences

- The preview URL settles at `/arcade/` rather than `/`. The root URL still
  opens the app, one hop away.
- The root `index.html` also satisfies the managed preview launcher's
  "static site" rule, so the app survives a sandbox restart instead of
  falling back to the directory listing.

## Sandbox-side fix: symbol fonts (superseded)

The reel symbols are Unicode, and the container shipped only the four
Liberation families — every special symbol rendered as an empty box. Fixed by
installing `fonts-noto-core` and `fonts-dejavu-core` and running `fc-cache -f`.
Chromium caches its font list at startup, so the browser process must be
restarted for the change to show.

This was an environment fix, not a code fix: a user's own macOS or Windows
machine already has fonts covering these characters. A Linux host that serves
this client needed the same packages.

**Superseded on 2026-11-07** — the container was rebuilt without those
packages and the empty boxes came back. The client now carries the glyphs
itself, so no host setup is needed: see
[Bundled symbol font for the arcade cabinets](decision-arcade-symbol-font.md).
