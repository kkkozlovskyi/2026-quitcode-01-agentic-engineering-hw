"use client";

import * as React from "react";

import { CellButton } from "@/components/game/cell-button";
import type { Board } from "@/lib/minesweeper";

export interface BoardGridProps {
  board: Board;
  frozen: boolean;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
}

/** Reads the row/column a click landed on, or null if it missed the cells. */
function coordsFrom(event: React.MouseEvent): [number, number] | null {
  const button = (event.target as HTMLElement).closest<HTMLElement>(
    "button[data-row]"
  );
  if (!button) return null;
  const row = Number(button.dataset.row);
  const col = Number(button.dataset.col);
  return Number.isInteger(row) && Number.isInteger(col) ? [row, col] : null;
}

export function BoardGrid({
  board,
  frozen,
  onReveal,
  onFlag,
  onChord,
}: BoardGridProps) {
  const cols = board[0]?.length ?? 0;

  // One handler for the whole grid rather than two per cell. Besides being
  // cheaper for 480 cells, it keeps every cell free of callback props, so a
  // memoised cell can never hold on to a handler from a previous board.
  const handleClick = (event: React.MouseEvent) => {
    if (frozen) return;
    const coords = coordsFrom(event);
    if (!coords) return;
    const [row, col] = coords;
    const cell = board[row]?.[col];
    if (!cell) return;

    if (cell.revealed) {
      if (cell.adjacent > 0) onChord(row, col);
    } else {
      onReveal(row, col);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    const coords = coordsFrom(event);
    if (!coords) return;
    event.preventDefault();
    if (frozen) return;
    const [row, col] = coords;
    if (board[row]?.[col]?.revealed) return;
    onFlag(row, col);
  };

  return (
    // Expert is 30 columns wide — wider than a phone, so the grid scrolls
    // horizontally instead of squashing the cells.
    <div className="w-full overflow-x-auto pb-1">
      <div
        role="grid"
        aria-label="Minefield"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="mx-auto grid w-fit gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <CellButton
              key={`${r}-${c}`}
              cell={cell}
              row={r}
              col={c}
              frozen={frozen}
            />
          ))
        )}
      </div>
    </div>
  );
}
