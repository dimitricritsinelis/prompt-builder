# PromptPad — AGENTS.md

This file is the agent-focused “how to work in this repo” guide.  
Canonical product intent lives in `docs/PRODUCT_SPEC.md`.

## Project overview

PromptPad is a lightweight desktop notes app for writing and organizing LLM prompts.

Non-negotiables:
- Single-user
- Offline-first (no accounts, no cloud, no external API keys)
- macOS primary, Windows compatible
- Fast + calm UI (not IDE-like)
- Notes are prompt-aware via optional structured blocks (Role, Context, Task, Constraints, Examples, Output Format)

Tech stack:
- Tauri 2 + Rust (backend commands, filesystem/export, SQLite)
- React + TypeScript + Vite (frontend)
- TipTap (ProseMirror) editor
- Tailwind CSS + CSS variables for theming
- Zustand for state

Key docs:
- `docs/PRODUCT_SPEC.md` — what to build
- `docs/UI_TOKENS.md` — colors/typography/spacing (do not drift)
- `docs/DB_SCHEMA.md` — SQLite schema + FTS5 strategy
- `docs/EDITOR_AND_BLOCKS.md` — TipTap + prompt blocks requirements
- `docs/EXPORT_FORMATS.md` — markdown/json/provider exports
- `docs/TAURI_COMMANDS.md` — backend command contract
- `docs/BRANCH_PLAN.md` — simple branching + merge order
- `docs/QA_CHECKLIST.md` — cross-platform acceptance checklist

## Setup commands

### Prereqs
- Node.js 20 LTS
- Rust stable
- pnpm

### Install deps
- `pnpm install`

### Run desktop app (Tauri)
- `pnpm tauri dev`

### Run web-only (optional, if configured)
- `pnpm dev`

## Quality gates (run before merging)

Frontend:
- `pnpm lint`
- `pnpm test` (Vitest)
- `pnpm build` (Vite)

Backend (from `src-tauri/`):
- `cargo fmt --all`
- `cargo clippy --all-targets --all-features -D warnings`
- `cargo test`

Cross-platform smoke (manual):
- Create note, edit, search, export, theme toggle, shortcuts (mac + win)

## Working rules for agents

### 1) Stay offline-first
- Do not add telemetry, analytics, update checks, “sign in”, cloud sync, or network calls.
- Prefer local filesystem operations via Tauri.

### 2) Respect the design system
- Use CSS variables defined in `docs/UI_TOKENS.md` (and implemented in `src/styles/theme.css`).
- Use subtle motion only (200ms ease).
- Avoid dense IDE UI. This is a notebook.

### 3) DB + editor integrity > new features
- `body_json` is source of truth.
- `body_text` is derived from `body_json` for FTS only.
- Updates must be transaction-safe. See `docs/DB_SCHEMA.md`.

### 4) Keep boundaries clean
- UI state in Zustand (`src/stores/*`).
- DB/storage in Rust commands (`src-tauri/`).
- Export logic should be deterministic and well-tested.

### 5) Implement incrementally
For any non-trivial work:
1. Add/update types + interfaces
2. Implement minimal happy path
3. Add tests (Rust unit tests for DB/export; TS tests for pure functions)
4. Wire UI
5. Run checks and fix failures before finalizing

## “Don’t surprise future you”
- Prefer small modules with obvious names
- Keep file paths aligned with `docs/PRODUCT_SPEC.md` project structure
- If you intentionally deviate from spec, write it down in the PR and update docs
