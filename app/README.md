# Minesweeper — QuitCode WS1

The Windows classic, rebuilt with **Next.js 16 (App Router)** and **shadcn/ui**.

Three difficulties, a guaranteed-safe first click, chording, flag mode for
touch, and a personal record kept in `localStorage`.

## Run it

```bash
cd app
npm install
npm run dev      # http://localhost:3000
npm run build    # production build, runs TypeScript too
npm run lint
```

> **Folder names must not contain `:`** — `PATH` is colon-separated, so a `:`
> anywhere in the absolute path stops `npm run` from finding `node_modules/.bin`
> and every script fails with `next: not found`. If you hit that, rename the
> parent folder (e.g. `koldovsky-2026-…` instead of `koldovsky:2026-…`).

## Layout

```
src/
  lib/
    minesweeper.ts    pure rules engine — no React, no DOM
    stats.ts          localStorage read/write, tolerant of corrupt data
    stats-store.ts    external store consumed via useSyncExternalStore
    utils.ts          shadcn `cn` helper
  components/
    ui/               shadcn/ui primitives
    game/
      minesweeper-game.tsx   state machine: status, timer, results
      board-grid.tsx         grid layout + click delegation
      cell-button.tsx        one cell, memoised, presentation only
      game-hud.tsx           mine counter, timer, difficulty, flag mode
      stats-panel.tsx        the record table
  app/                layout, page, design tokens
```

### Design notes

**The rules live in one pure module.** `minesweeper.ts` takes a board and
returns a new board — no React, no DOM, no randomness it doesn't accept as an
argument. That makes the whole game testable without a browser, and lets React
treat every board as immutable state.

**The first click is always safe.** Mines are laid *after* the opening move, with
the clicked cell and its eight neighbours excluded, so the game always starts
with a real cascade instead of a coin flip. If the board is too dense to allow
that, the safe zone shrinks to the clicked cell alone.

**Cells carry no callbacks.** An expert board is 480 buttons, so each cell is
memoised on its own fields. Memoised components that also receive handlers
quietly keep *stale* handlers, which is a real bug — so clicks are handled once,
by delegation on the grid container, and cells stay purely presentational.

**Stats are read through an external store.** `localStorage` doesn't exist during
the server render, so the values have to arrive after hydration.
`useSyncExternalStore` expresses that directly: the server gets empty stats, the
browser gets the real ones, with no hydration mismatch and no `setState` in an
effect.

**No webfont request.** The app uses a system font stack, so it builds and runs
with no network access.
