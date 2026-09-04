# Task 4 (bonus) — Prompt A/B

**Sub-task under test:** the stats panel — the component that shows the player's
record per difficulty.

**Method:** both prompts were run by the same model (`claude-opus-5`) as
*sub-agents with a clean context*, at the same moment, with no knowledge of each
other and no sight of the existing `stats-panel.tsx`. Each was told to write its
answer to a file and report four facts about it. Token counts below are the
figures each sub-agent actually reported.

---

## Prompt A — basic

```
Make a React component that shows minesweeper stats.
```

## Prompt B — structured (role + context + constraints + criteria + format)

```
You are a senior React/TypeScript engineer working in an existing Next.js 16
App Router project that uses shadcn/ui (new-york style) and Tailwind v4.

CONTEXT
The project is a Minesweeper game. It already has:
- `@/lib/minesweeper` exporting `DIFFICULTY_ORDER: DifficultyKey[]`,
  `DIFFICULTIES: Record<DifficultyKey, {label: string}>`, and
  `formatTime(seconds: number): string`.
- `@/lib/stats` exporting `type StatsMap = Record<DifficultyKey,
  { played: number; won: number; bestSeconds: number | null }>`.
- shadcn components available at `@/components/ui/card`,
  `@/components/ui/table`, `@/components/ui/button`.

TASK
Write a `StatsPanel` component that displays the player's record per difficulty.

CONSTRAINTS
- Build the UI only from the shadcn components listed above; no hand-rolled CSS
  beyond Tailwind utility classes.
- The component receives `stats: StatsMap` and `onClear: () => void` as props.
  It must not read localStorage itself.
- One row per difficulty, in `DIFFICULTY_ORDER`. Columns: Difficulty, Played,
  Won, Win rate, Best time.
- Numeric columns right-aligned and `tabular-nums`. Show an em dash for a win
  rate with zero games and for a null best time.
- The Clear button must be disabled when no games have been played.
- Strict TypeScript: no `any`, exported prop interface.

ACCEPTANCE CRITERIA
- Compiles under `next build` with TypeScript strict mode.
- No `useEffect`, no client-side data fetching; it is a pure presentational
  component.
- Accessible table markup via the shadcn Table primitives.

OUTPUT FORMAT
Write the component to <path>. Then reply with ONLY these four lines…
```

---

## Results

| | **A — basic** | **B — structured** |
|---|---|---|
| Lines of code | **348** | **150** |
| Tokens | **43,611** | **41,543** |
| Tool calls | 3 | 2 |
| Wall clock | 45.7 s | 32.0 s |
| Uses shadcn components | yes | yes |
| Strict TypeScript types | yes | yes |
| **Compiles in this project** | **no** | **yes** |
| **Drops into the app unchanged** | **no** | **yes** |

### Why A doesn't compile

`import { Progress } from "@/components/ui/progress"` — a component this project
does not have. The basic prompt gave the model no inventory, so it assumed one.

### Why A doesn't integrate

A invented its own data shape:

```ts
export interface DifficultyStats {
  played: number;
  won: number;
  bestTimeSeconds: number | null;
  totalTimeSeconds: number;      // the game never records this
  longestWinStreak: number;      // nor this
  flagsPlanted: number;          // nor this
  cellsRevealed: number;         // nor this
}
```

Four of the seven fields don't exist anywhere in the app, and the two that do
are spelled differently (`bestTimeSeconds` vs `bestSeconds`). It also declared
its own `Difficulty` union, duplicating the one already exported from
`@/lib/minesweeper`.

A further went dual-mode on its own initiative — the component optionally reads
`localStorage` itself when no `stats` prop is passed, using
`useState` + `useEffect` + a `hydrated` flag. That is precisely the pattern this
project's ESLint config rejects (`react-hooks/set-state-in-effect`), so it would
have failed lint as well as the build.

B imported `StatsMap` from `@/lib/stats`, took `stats` and `onClear` as props,
and contains no `localStorage` access and no effects at all.

---

## Conclusion

**The basic prompt cost 5% more tokens and 43% more wall-clock time to produce
something unusable.** It is not that A was lazy — A worked *harder*, producing
2.3× more code, a richer stat model and an extra self-loading mode. It simply
built all of it against an imagined project.

The structured prompt's win came almost entirely from the **CONTEXT** block. Two
sentences naming the modules and components that already exist removed every
invented import, every duplicated type and every unrequested feature. The
CONSTRAINTS and ACCEPTANCE CRITERIA blocks then did the second job — they turned
"pure presentational component" from a preference I held silently into something
the model could actually satisfy.

The cheap generalisation: **for an agent working inside an existing codebase, an
inventory of what already exists is worth more than any amount of instruction
about what to build.** A vague prompt does not produce less work; it produces
the same work aimed somewhere else.
