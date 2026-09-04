"use client";

import * as React from "react";
import { Bomb, Flag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Cell } from "@/lib/minesweeper";

/** Classic Minesweeper number colours, tuned to stay legible in dark mode. */
const NUMBER_COLOURS = [
  "",
  "text-blue-600 dark:text-blue-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-red-600 dark:text-red-400",
  "text-violet-600 dark:text-violet-400",
  "text-amber-600 dark:text-amber-400",
  "text-cyan-600 dark:text-cyan-400",
  "text-pink-600 dark:text-pink-400",
  "text-muted-foreground",
] as const;

export interface CellButtonProps {
  cell: Cell;
  row: number;
  col: number;
  frozen: boolean;
}

/**
 * Presentation only: no event handlers, no game logic.
 *
 * Clicks are handled once, by delegation on the grid container. Keeping this
 * component prop-pure is what makes the memoisation below both safe and
 * effective — there are no callbacks that could go stale.
 */
function CellButtonBase({ cell, row, col, frozen }: CellButtonProps) {
  const chordable = cell.revealed && cell.adjacent > 0;

  const label = cell.revealed
    ? cell.mine
      ? "mine"
      : `${cell.adjacent} adjacent`
    : cell.flagged
      ? "flagged"
      : "hidden";

  return (
    <Button
      type="button"
      variant={cell.revealed ? "ghost" : "outline"}
      size="icon"
      data-row={row}
      data-col={col}
      aria-label={`Row ${row + 1}, column ${col + 1}: ${label}`}
      className={cn(
        "size-7 shrink-0 rounded-[4px] border-0 p-0 text-[13px] font-bold tabular-nums shadow-none select-none md:size-8",
        // Three distinct tones: card < opened < closed, so the cleared region
        // reads as a sunken plate the way the original does.
        !cell.revealed &&
          "bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-600 dark:hover:bg-neutral-500",
        cell.revealed &&
          "bg-neutral-100 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-800 cursor-default",
        chordable &&
          !frozen &&
          "cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700",
        cell.revealed && !cell.mine && NUMBER_COLOURS[cell.adjacent],
        cell.revealed && cell.mine && "bg-destructive/15",
        cell.exploded && "bg-destructive hover:bg-destructive text-white",
        cell.wrongFlag && "bg-destructive/10 text-destructive"
      )}
    >
      {cell.revealed ? (
        cell.mine ? (
          <Bomb className="size-4" aria-hidden />
        ) : cell.adjacent > 0 ? (
          cell.adjacent
        ) : null
      ) : cell.flagged ? (
        cell.wrongFlag ? (
          <X className="text-destructive size-4" aria-hidden />
        ) : (
          <Flag className="size-3.5 fill-current" aria-hidden />
        )
      ) : null}
    </Button>
  );
}

/**
 * An expert board is 480 cells, so re-rendering all of them on every tick of
 * the clock is wasteful. Memoising on the cell's own fields means only the
 * cells that actually changed re-render.
 */
export const CellButton = React.memo(CellButtonBase, (prev, next) => {
  return (
    prev.row === next.row &&
    prev.col === next.col &&
    prev.frozen === next.frozen &&
    prev.cell.revealed === next.cell.revealed &&
    prev.cell.flagged === next.cell.flagged &&
    prev.cell.mine === next.cell.mine &&
    prev.cell.adjacent === next.cell.adjacent &&
    prev.cell.exploded === next.cell.exploded &&
    prev.cell.wrongFlag === next.cell.wrongFlag
  );
});
