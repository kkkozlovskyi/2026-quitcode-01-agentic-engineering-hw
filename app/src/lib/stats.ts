import { DIFFICULTY_ORDER, type DifficultyKey } from "@/lib/minesweeper";

export interface DifficultyStats {
  played: number;
  won: number;
  bestSeconds: number | null;
}

export type StatsMap = Record<DifficultyKey, DifficultyStats>;

const STORAGE_KEY = "minesweeper:stats:v1";

export function emptyStats(): StatsMap {
  return DIFFICULTY_ORDER.reduce((acc, key) => {
    acc[key] = { played: 0, won: 0, bestSeconds: null };
    return acc;
  }, {} as StatsMap);
}

function isValidEntry(value: unknown): value is DifficultyStats {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.played === "number" &&
    typeof v.won === "number" &&
    (v.bestSeconds === null || typeof v.bestSeconds === "number")
  );
}

/**
 * Reads stats from localStorage. Never throws: a corrupt or partial payload
 * falls back to zeroes rather than taking the page down.
 */
export function loadStats(): StatsMap {
  if (typeof window === "undefined") return emptyStats();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyStats();

    const base = emptyStats();
    for (const key of DIFFICULTY_ORDER) {
      const entry = (parsed as Record<string, unknown>)[key];
      if (isValidEntry(entry)) base[key] = entry;
    }
    return base;
  } catch {
    return emptyStats();
  }
}

export function saveStats(stats: StatsMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Private browsing or a full quota — the game still plays fine without stats.
  }
}

export function clearStats(): StatsMap {
  const fresh = emptyStats();
  saveStats(fresh);
  return fresh;
}

/**
 * Folds a finished game into the stats and reports whether it set a new record.
 */
export function recordResult(
  stats: StatsMap,
  difficulty: DifficultyKey,
  won: boolean,
  seconds: number
): { stats: StatsMap; isPersonalBest: boolean } {
  const previous = stats[difficulty];
  const isPersonalBest =
    won && (previous.bestSeconds === null || seconds < previous.bestSeconds);

  const next: StatsMap = {
    ...stats,
    [difficulty]: {
      played: previous.played + 1,
      won: previous.won + (won ? 1 : 0),
      bestSeconds: isPersonalBest ? seconds : previous.bestSeconds,
    },
  };

  saveStats(next);
  return { stats: next, isPersonalBest };
}

export function winRate(entry: DifficultyStats): string {
  if (entry.played === 0) return "—";
  return `${Math.round((entry.won / entry.played) * 100)}%`;
}
