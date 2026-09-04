"use client";

import * as React from "react";
import { Bomb, Flag, RotateCcw, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  formatTime,
  type DifficultyKey,
  type GameStatus,
} from "@/lib/minesweeper";

export interface GameHudProps {
  difficulty: DifficultyKey;
  onDifficultyChange: (value: DifficultyKey) => void;
  minesLeft: number;
  seconds: number;
  status: GameStatus;
  flagMode: boolean;
  onFlagModeChange: (value: boolean) => void;
  onReset: () => void;
}

const STATUS_LABEL: Record<GameStatus, string> = {
  idle: "Ready",
  playing: "In progress",
  won: "Cleared",
  lost: "Boom",
};

export function GameHud({
  difficulty,
  onDifficultyChange,
  minesLeft,
  seconds,
  status,
  flagMode,
  onFlagModeChange,
  onReset,
}: GameHudProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-sm">
          <Bomb aria-hidden />
          <span className="tabular-nums">{minesLeft}</span>
          <span className="sr-only">mines remaining</span>
        </Badge>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              status === "lost"
                ? "destructive"
                : status === "won"
                  ? "default"
                  : "outline"
            }
          >
            {STATUS_LABEL[status]}
          </Badge>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw aria-hidden />
            New game
          </Button>
        </div>

        <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-sm">
          <Timer aria-hidden />
          <span className="tabular-nums">{formatTime(seconds)}</span>
          <span className="sr-only">elapsed time</span>
        </Badge>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={difficulty}
          onValueChange={(value) => {
            // Radix emits "" when the active item is clicked again.
            if (value) onDifficultyChange(value as DifficultyKey);
          }}
          aria-label="Difficulty"
        >
          {DIFFICULTY_ORDER.map((key) => (
            <ToggleGroupItem key={key} value={key} className="px-4">
              {DIFFICULTIES[key].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button
          variant={flagMode ? "default" : "outline"}
          size="sm"
          aria-pressed={flagMode}
          onClick={() => onFlagModeChange(!flagMode)}
        >
          <Flag aria-hidden className={flagMode ? "fill-current" : undefined} />
          Flag mode
        </Button>
      </div>
    </div>
  );
}
