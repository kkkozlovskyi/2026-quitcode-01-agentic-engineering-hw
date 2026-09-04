"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  formatTime,
} from "@/lib/minesweeper";
import { winRate, type StatsMap } from "@/lib/stats";

export interface StatsPanelProps {
  stats: StatsMap;
  onClear: () => void;
}

export function StatsPanel({ stats, onClear }: StatsPanelProps) {
  const totalPlayed = DIFFICULTY_ORDER.reduce(
    (sum, key) => sum + stats[key].played,
    0
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Your record</CardTitle>
        <CardDescription>
          Saved in this browser via localStorage.
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={totalPlayed === 0}
          >
            <Trash2 aria-hidden />
            Clear
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Difficulty</TableHead>
              <TableHead className="text-right">Played</TableHead>
              <TableHead className="text-right">Won</TableHead>
              <TableHead className="text-right">Win rate</TableHead>
              <TableHead className="text-right">Best time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DIFFICULTY_ORDER.map((key) => {
              const entry = stats[key];
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">
                    {DIFFICULTIES[key].label}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.played}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.won}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {winRate(entry)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.bestSeconds === null
                      ? "—"
                      : formatTime(entry.bestSeconds)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
