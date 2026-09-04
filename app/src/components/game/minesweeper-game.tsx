"use client";

import * as React from "react";
import { Bomb, MousePointerClick, PartyPopper, Trophy } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BoardGrid } from "@/components/game/board-grid";
import { GameHud } from "@/components/game/game-hud";
import { StatsPanel } from "@/components/game/stats-panel";
import {
  DIFFICULTIES,
  chord,
  countFlags,
  createBoard,
  flagAllMines,
  formatTime,
  isWon,
  placeMines,
  revealAllMines,
  revealCell,
  toggleFlag,
  type Board,
  type DifficultyKey,
  type GameStatus,
} from "@/lib/minesweeper";
import {
  commitResult,
  getServerSnapshot,
  getSnapshot,
  resetStats,
  subscribe,
} from "@/lib/stats-store";

interface GameResult {
  won: boolean;
  seconds: number;
  isPersonalBest: boolean;
}

export function MinesweeperGame() {
  const [difficulty, setDifficulty] = React.useState<DifficultyKey>("beginner");
  const preset = DIFFICULTIES[difficulty];

  const [board, setBoard] = React.useState<Board>(() =>
    createBoard(preset.rows, preset.cols)
  );
  const [status, setStatus] = React.useState<GameStatus>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const [flagMode, setFlagMode] = React.useState(false);
  const [result, setResult] = React.useState<GameResult | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const startedAt = React.useRef<number | null>(null);

  // Stats live in localStorage, which the server can't see. Reading them
  // through an external store gives the server empty values and the browser the
  // real ones, with no hydration mismatch and no extra render pass.
  const stats = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  React.useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => {
      if (startedAt.current !== null) {
        setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [status]);

  const startNewGame = React.useCallback((key: DifficultyKey) => {
    const next = DIFFICULTIES[key];
    startedAt.current = null;
    setDifficulty(key);
    setBoard(createBoard(next.rows, next.cols));
    setStatus("idle");
    setSeconds(0);
    setResult(null);
    setDialogOpen(false);
  }, []);

  const concludeGame = React.useCallback(
    (won: boolean) => {
      const elapsed =
        startedAt.current === null
          ? 0
          : Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));

      setSeconds(elapsed);
      const isPersonalBest = commitResult(difficulty, won, elapsed);
      setResult({ won, seconds: elapsed, isPersonalBest });
      setDialogOpen(true);
    },
    [difficulty]
  );

  /** Single place where a move is turned into the next game state. */
  const settle = React.useCallback(
    (nextBoard: Board, exploded: boolean) => {
      if (exploded) {
        setBoard(revealAllMines(nextBoard));
        setStatus("lost");
        concludeGame(false);
        return;
      }
      if (isWon(nextBoard)) {
        setBoard(flagAllMines(nextBoard));
        setStatus("won");
        concludeGame(true);
        return;
      }
      setBoard(nextBoard);
      setStatus("playing");
    },
    [concludeGame]
  );

  const handleFlag = React.useCallback(
    (row: number, col: number) => {
      if (status === "won" || status === "lost") return;
      setBoard((current) => toggleFlag(current, row, col));
    },
    [status]
  );

  const handleReveal = React.useCallback(
    (row: number, col: number) => {
      if (status === "won" || status === "lost") return;
      if (flagMode) {
        handleFlag(row, col);
        return;
      }

      // Mines are laid only once the first cell is chosen, so the opening
      // click can never lose the game.
      let working = board;
      if (status === "idle") {
        working = placeMines(board, preset.mines, row, col);
        startedAt.current = Date.now();
      }

      const { board: next, exploded } = revealCell(working, row, col);
      settle(next, exploded);
    },
    [board, flagMode, handleFlag, preset.mines, settle, status]
  );

  const handleChord = React.useCallback(
    (row: number, col: number) => {
      if (status !== "playing") return;
      const { board: next, exploded } = chord(board, row, col);
      if (next === board) return;
      settle(next, exploded);
    },
    [board, settle, status]
  );

  const handleClearStats = React.useCallback(() => {
    resetStats();
  }, []);

  const minesLeft = preset.mines - countFlags(board);
  const frozen = status === "won" || status === "lost";

  return (
    <div className="flex w-full flex-col gap-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bomb className="size-4" aria-hidden />
            Minefield
          </CardTitle>
          <CardDescription>
            {preset.rows} × {preset.cols} grid · {preset.mines} mines
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <GameHud
            difficulty={difficulty}
            onDifficultyChange={startNewGame}
            minesLeft={minesLeft}
            seconds={seconds}
            status={status}
            flagMode={flagMode}
            onFlagModeChange={setFlagMode}
            onReset={() => startNewGame(difficulty)}
          />

          <BoardGrid
            board={board}
            frozen={frozen}
            onReveal={handleReveal}
            onFlag={handleFlag}
            onChord={handleChord}
          />
        </CardContent>
      </Card>

      <Alert>
        <MousePointerClick />
        <AlertTitle>How to play</AlertTitle>
        <AlertDescription>
          <p>
            Left-click opens a cell, right-click plants a flag. On a phone, turn
            on <strong>Flag mode</strong> to plant flags by tapping.
          </p>
          <p>
            Click a revealed number once its flags add up and every remaining
            neighbour opens at once. The first click is always safe.
          </p>
        </AlertDescription>
      </Alert>

      <StatsPanel stats={stats} onClear={handleClearStats} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result?.won ? (
                <>
                  <PartyPopper className="size-5" aria-hidden />
                  Field cleared
                </>
              ) : (
                <>
                  <Bomb className="size-5" aria-hidden />
                  You hit a mine
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {result?.won
                ? `${DIFFICULTIES[difficulty].label} cleared in ${formatTime(result.seconds)}.`
                : `Better luck next round on ${DIFFICULTIES[difficulty].label}.`}
            </DialogDescription>
          </DialogHeader>

          {result?.isPersonalBest && (
            <Badge className="gap-1.5">
              <Trophy aria-hidden />
              New personal best
            </Badge>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Look at the board
            </Button>
            <Button onClick={() => startNewGame(difficulty)}>Play again</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
