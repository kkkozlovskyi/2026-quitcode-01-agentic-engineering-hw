import {
  clearStats,
  emptyStats,
  loadStats,
  recordResult,
  type StatsMap,
} from "@/lib/stats";
import type { DifficultyKey } from "@/lib/minesweeper";

/**
 * A tiny external store for the persisted stats, read through
 * `useSyncExternalStore`.
 *
 * Why not `useState` + `useEffect`? localStorage doesn't exist during the
 * server render, so the stats have to arrive after hydration. Doing that with
 * `setState` inside an effect causes an extra render pass (and React's lint
 * rules rightly flag it). An external store expresses the same thing directly:
 * the server gets `emptyStats()`, the client gets the real values, and React
 * swaps them over without a cascading render.
 */

/** Stable reference — `getSnapshot` must not return a fresh object each call. */
let cache: StatsMap | null = null;
const serverSnapshot: StatsMap = emptyStats();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): StatsMap {
  if (cache === null) cache = loadStats();
  return cache;
}

export function getServerSnapshot(): StatsMap {
  return serverSnapshot;
}

/** Records a finished game and reports whether it beat the previous best. */
export function commitResult(
  difficulty: DifficultyKey,
  won: boolean,
  seconds: number
): boolean {
  const { stats, isPersonalBest } = recordResult(
    getSnapshot(),
    difficulty,
    won,
    seconds
  );
  cache = stats;
  emit();
  return isPersonalBest;
}

export function resetStats(): void {
  cache = clearStats();
  emit();
}
