# Task 3 — Vibe session notes

**App:** Minesweeper (`app/`) — Next.js 16 App Router + shadcn/ui + Tailwind v4
**Agent:** Claude (Cowork), model `claude-opus-5`
**Date:** 2026-09-04

---

## 1. What came out of the first prompt, and what didn't

**Worked first time:**

1. **The rules engine.** `src/lib/minesweeper.ts` (flood-fill reveal, first-click
   safety, chording, win detection) was written once and passed all 21
   assertions on the first run — including a 200-seed check that the opening
   click and its eight neighbours are never mined, and a 60×60 board to prove
   the flood fill is iterative and can't blow the call stack. Zero iterations on
   the actual game logic.
2. **The shadcn component layer.** Nine primitives (Button, Card, Badge, Table,
   Dialog, Separator, ToggleGroup, Toggle, Alert) written by hand, compiled
   clean on the first `next build`.
3. **Layout and responsiveness.** Light mode, dark mode and a 390 px viewport
   were all correct on the first screenshot pass — no horizontal page scroll,
   the 30-column expert board scrolling inside its own container.

**Did not work first time:**

4. **The `shadcn` CLI never ran at all.** `npx shadcn@latest init` failed against
   `ui.shadcn.com` (HTTP 403 through the egress proxy) on both machines
   available to the session. Fallback: install the Radix/CVA dependencies from
   npm and write the component files directly — shadcn is a copy-paste registry,
   so this is the same result by another route, and `components.json` is still
   committed so the CLI works later.
5. **`npm install` failed four times in a row.** `ENOTEMPTY: rename
   'node_modules/caniuse-lite' -> '.caniuse-lite-2jPgKum0'`. The project folder
   is on a filesystem that can't rename a non-empty directory, which is exactly
   what npm does when it *updates* an existing tree. Adding all nine
   dependencies to `package.json` first and doing one clean install into an
   empty `node_modules` worked immediately.
6. **`next/font/google` broke the build** with no network access. Swapped for a
   system font stack — the app now builds offline, which is strictly better for
   a repo someone else has to clone.

---

## 2. Where the agent stumbled, and the prompt that turned it around

### The bug the build could not see

Cells are memoised — an expert board is 480 buttons and the clock ticks four
times a second, so re-rendering all of them was worth avoiding. The memo
comparator compared the cell's own fields and deliberately ignored the
`onReveal` / `onFlag` / `onChord` props, because those change identity on every
render.

That is a real bug, and it type-checked, linted and built perfectly. Switching
Expert → Beginner and clicking a cell brought the **expert board back**: the
memoised cells had skipped re-rendering, so they were still holding the click
handler that closed over the old 16×30 board.

It was caught by *looking at a screenshot* — the header read `9 × 9 grid · 10
mines` while the grid underneath was clearly 30 columns wide. A Playwright
assertion pinned it down:

```
expert: 480
back to beginner: 81
after first click: 480     ← should be 81
```

The prompt that fixed it named the mechanism rather than the symptom:

> *The memo comparator ignores the handler props, so a memoised cell keeps a
> stale closure over the previous board. Remove handlers from the cells
> entirely and handle clicks by delegation on the grid container.*

Result: cells became purely presentational, one handler replaced 1,440, and the
whole class of bug is now unrepresentable.

### Lint pushing back on a habit

`react-hooks/set-state-in-effect` rejected the reflexive way to load
`localStorage` after mount (`useEffect(() => setStats(loadStats()), [])`).
The lazy fix would have been to disable the rule. The correct fix was
`useSyncExternalStore` with a `getServerSnapshot`, which is what that hook
exists for — server render gets empty stats, the browser gets the real ones, no
hydration mismatch, no extra render pass.

### An environment trap worth remembering

`npm run build` failed with `next: not found` even though `node_modules/.bin/next`
existed and ran fine when invoked directly. Cause: the repo folder is named
`koldovsky:2026-quitcode-01-agentic-engineering-hw`, and **`PATH` is
colon-separated** — npm's injected `…/koldovsky:2026-…/app/node_modules/.bin`
splits into two garbage entries. Not an agent mistake and not a code mistake;
renaming the folder to drop the `:` fixes it permanently.

---

## 3. Numbers

| Metric | Value |
|---|---|
| Human turns (prompts I actually typed) | 4 |
| Clarifying questions the agent asked before coding | 2 rounds (7 options total) |
| Files created | 24 |
| TypeScript/TSX files in `app/src` | 20 |
| Lines of TS/TSX in `app/src` | 1,828 |
| Logic assertions written and passing | 21 |
| Browser verification runs (Playwright) | 6 |
| Production builds run | 6 (3 on this machine, 3 in the sandbox) |
| Defects found before submission | 5 |
| — of those, caught by build/lint | 2 |
| — caught only by running and screenshotting | 3 |
| A/B sub-agent cost (Task 4) | 43,611 + 41,543 tokens |
| **Session tokens / cost** | **Opus 5 — 5.1M in / 167 out, $12.85 total (41m 25s wall, 27m 6s API)** |

> The A/B numbers are exact (reported per sub-agent). The session total is from
> the tool's own usage screen for this build session (Claude Cowork, model
> `claude-opus-5`) — the 5.1M input tokens are almost entirely prompt-cache
> reads, not fresh context.

---

## 4. What I'd do differently

**1. Screenshot earlier, and treat "it builds" as meaning almost nothing.**
Three of the five defects — the stale-closure board bug, revealed cells being
invisible against a white card, and the board/header desync — were invisible to
TypeScript, ESLint and `next build`. All three showed up the moment the app was
opened in a real browser and looked at. Rendering the thing should come
*before* polishing it, not after.

**2. Establish the environment before generating code.** Roughly a third of the
session went on things that had nothing to do with Minesweeper: a blocked
registry, a filesystem that can't rename directories, a colon in a folder name,
an unreachable font CDN. Five minutes of "can I install, build and run an empty
app here?" up front would have surfaced all four before a line of game code
existed.

**3. Be suspicious of optimisations the agent volunteers.** The memoised cell was
a genuinely good idea that introduced the session's only gameplay bug. The fix
wasn't to abandon the optimisation — it was to change the *shape* of the
component so the optimisation couldn't be wrong. Worth asking, of any
performance tweak: "what does this now assume, and what happens when that
assumption breaks?"
