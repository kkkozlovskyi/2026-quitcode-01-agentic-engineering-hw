# QuitCode Workshop 1 — Homework (vibe-coding)

Starter repo for the first homework of the QuitCode **"Modern Development with
Agentic AI"** course.

> Workshop 1: **Сучасний стан агентної інженерії. Від no-code до AI-розробки**
> Автор: В'ячеслав Колдовський — Dev AI Consulting (dev-ai.dev)

**Live demo:** https://kkkozlovskyi.github.io/2026-quitcode-01-agentic-engineering-hw/

The first homework is deliberately simple and fun: **vibe-code a small app**
with an AI agent, using a grown-up design system for the UI (we recommend the
open [Porsche Design System](https://designsystem.porsche.com/)) — then write
down what worked and what it cost. ~1–1.5 hours. Rules, skills, tests and
migration discipline come later in the course (workshops 3, 4, 8, 10).

## Quick start

```bash
gh repo fork koldovsky/2026-quitcode-01-agentic-engineering-hw --clone
cd 2026-quitcode-01-agentic-engineering-hw
git checkout -b ws01/<github-username>
npm create vite@latest app -- --template react-ts
# follow docs/walkthrough.md
gh pr create --title "WS1: <your name>" --fill
```

Full step-by-step instructions: [`docs/walkthrough.md`](docs/walkthrough.md).

## What's in here

| File | Purpose |
|---|---|
| `docs/walkthrough.md` | Step-by-step: setup, Task 1–4, Definition of Done |
| `.github/pull_request_template.md` | PR checklist (auto-applied) |
| `.coderabbit.yaml` | CodeRabbit review tuned to this homework's DoD |
| `AGENTS.md` | Baseline guidance for your agentic tool in this repo |

You create everything else (`app/`, `docs/vibe-notes.md`, …) yourself — that's
the homework. This repo is also used for the **live demo** during the workshop;
the open PR `ws01/koldovsky-demo` is the reference solution ("Lead Desk" on
Porsche Design System).

## Tools

Claude Code / Cursor (at least one) + a GitHub account + Node 22+.
Questions → the course chat (feedback within 2 weeks after the final workshop).
