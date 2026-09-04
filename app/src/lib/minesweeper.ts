/**
 * Pure Minesweeper rules engine.
 *
 * Deliberately free of React and of the DOM: every function takes a board and
 * returns a new board, which makes the whole game trivially testable and lets
 * React treat state as immutable.
 */

export type DifficultyKey = "beginner" | "intermediate" | "expert";

export interface DifficultyPreset {
  key: DifficultyKey;
  label: string;
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyPreset> = {
  beginner: { key: "beginner", label: "Beginner", rows: 9, cols: 9, mines: 10 },
  intermediate: {
    key: "intermediate",
    label: "Intermediate",
    rows: 16,
    cols: 16,
    mines: 40,
  },
  expert: { key: "expert", label: "Expert", rows: 16, cols: 30, mines: 99 },
};

export const DIFFICULTY_ORDER: DifficultyKey[] = [
  "beginner",
  "intermediate",
  "expert",
];

export interface Cell {
  mine: boolean;
  /** Number of mines in the 8 surrounding cells. */
  adjacent: number;
  revealed: boolean;
  flagged: boolean;
  /** The single mine the player actually detonated. */
  exploded: boolean;
  /** A flag left on a safe cell, highlighted after a loss. */
  wrongFlag: boolean;
}

export type Board = Cell[][];

export type GameStatus = "idle" | "playing" | "won" | "lost";

export type Rng = () => number;

function emptyCell(): Cell {
  return {
    mine: false,
    adjacent: 0,
    revealed: false,
    flagged: false,
    exploded: false,
    wrongFlag: false,
  };
}

export function createBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, emptyCell)
  );
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function inBounds(board: Board, r: number, c: number): boolean {
  return r >= 0 && r < board.length && c >= 0 && c < board[0].length;
}

export function neighbours(
  board: Board,
  r: number,
  c: number
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(board, nr, nc)) out.push([nr, nc]);
    }
  }
  return out;
}

/**
 * Lays mines *after* the first click so the opening move is always safe.
 *
 * The clicked cell and its 8 neighbours are kept mine-free, which guarantees a
 * useful opening cascade instead of a lone "1" to guess from. If the board is
 * too dense to honour that, the safe zone shrinks to the clicked cell alone.
 */
export function placeMines(
  board: Board,
  mineCount: number,
  safeR: number,
  safeC: number,
  rng: Rng = Math.random
): Board {
  const rows = board.length;
  const cols = board[0].length;
  const next = cloneBoard(board);

  const fullSafeZone = new Set<number>([
    safeR * cols + safeC,
    ...neighbours(next, safeR, safeC).map(([r, c]) => r * cols + c),
  ]);
  const safeZone =
    rows * cols - fullSafeZone.size >= mineCount
      ? fullSafeZone
      : new Set<number>([safeR * cols + safeC]);

  const candidates: number[] = [];
  for (let i = 0; i < rows * cols; i++) {
    if (!safeZone.has(i)) candidates.push(i);
  }

  // Fisher-Yates: unbiased, and O(n) instead of "retry until we find a free cell".
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const placed = Math.min(mineCount, candidates.length);
  for (let i = 0; i < placed; i++) {
    const idx = candidates[i];
    next[Math.floor(idx / cols)][idx % cols].mine = true;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      next[r][c].adjacent = neighbours(next, r, c).filter(
        ([nr, nc]) => next[nr][nc].mine
      ).length;
    }
  }

  return next;
}

/**
 * Reveals a cell, flood-filling outward through the blank region it belongs to.
 * Iterative rather than recursive so a big expert-board cascade can't blow the
 * call stack.
 */
export function revealCell(
  board: Board,
  r: number,
  c: number
): { board: Board; exploded: boolean } {
  const cell = board[r][c];
  if (cell.revealed || cell.flagged) return { board, exploded: false };

  const next = cloneBoard(board);

  if (next[r][c].mine) {
    next[r][c].revealed = true;
    next[r][c].exploded = true;
    return { board: next, exploded: true };
  }

  const stack: Array<[number, number]> = [[r, c]];
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!;
    const current = next[cr][cc];
    if (current.revealed || current.flagged) continue;

    current.revealed = true;
    if (current.adjacent === 0) {
      for (const [nr, nc] of neighbours(next, cr, cc)) {
        if (!next[nr][nc].revealed && !next[nr][nc].mine) {
          stack.push([nr, nc]);
        }
      }
    }
  }

  return { board: next, exploded: false };
}

export function toggleFlag(board: Board, r: number, c: number): Board {
  if (board[r][c].revealed) return board;
  const next = cloneBoard(board);
  next[r][c].flagged = !next[r][c].flagged;
  return next;
}

/**
 * "Chording": clicking a revealed number whose flag count already matches it
 * opens every remaining neighbour at once. It is how experienced players move
 * quickly — and it will happily detonate a mine if the flags are wrong.
 */
export function chord(
  board: Board,
  r: number,
  c: number
): { board: Board; exploded: boolean } {
  const cell = board[r][c];
  if (!cell.revealed || cell.adjacent === 0) {
    return { board, exploded: false };
  }

  const around = neighbours(board, r, c);
  const flagged = around.filter(([nr, nc]) => board[nr][nc].flagged).length;
  if (flagged !== cell.adjacent) return { board, exploded: false };

  let working = board;
  let exploded = false;
  for (const [nr, nc] of around) {
    const target = working[nr][nc];
    if (target.revealed || target.flagged) continue;
    const result = revealCell(working, nr, nc);
    working = result.board;
    exploded = exploded || result.exploded;
  }

  return { board: working, exploded };
}

/** The board is won once every cell that is not a mine has been revealed. */
export function isWon(board: Board): boolean {
  return board.every((row) =>
    row.every((cell) => cell.mine || cell.revealed)
  );
}

/** Reveals the remaining mines and marks flags the player got wrong. */
export function revealAllMines(board: Board): Board {
  const next = cloneBoard(board);
  for (const row of next) {
    for (const cell of row) {
      if (cell.mine && !cell.flagged) cell.revealed = true;
      if (!cell.mine && cell.flagged) cell.wrongFlag = true;
    }
  }
  return next;
}

/** Flags every remaining mine — cosmetic tidy-up shown on a win. */
export function flagAllMines(board: Board): Board {
  const next = cloneBoard(board);
  for (const row of next) {
    for (const cell of row) {
      if (cell.mine) cell.flagged = true;
    }
  }
  return next;
}

export function countFlags(board: Board): number {
  return board.reduce(
    (total, row) => total + row.filter((cell) => cell.flagged).length,
    0
  );
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
