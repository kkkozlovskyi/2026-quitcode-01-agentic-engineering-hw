import { Badge } from "@/components/ui/badge";
import { MinesweeperGame } from "@/components/game/minesweeper-game";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">QuitCode · Workshop 1</Badge>
          <Badge variant="secondary">Next.js + shadcn/ui</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Minesweeper
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          The Windows classic, rebuilt from design-system components. Three
          difficulties, a safe first click, chording, and a personal record kept
          in your browser.
        </p>
      </header>

      <MinesweeperGame />

      <footer className="text-muted-foreground pt-2 text-xs">
        Vibe-coded for the QuitCode “Modern Development with Agentic AI” course.
      </footer>
    </main>
  );
}
