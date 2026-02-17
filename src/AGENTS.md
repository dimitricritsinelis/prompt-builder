# Frontend AGENTS.md (src/)

This file applies to work under `src/`.

## Commands (from repo root)

- Dev (desktop): `pnpm tauri dev`
- Dev (web-only, optional): `pnpm dev`
- Typecheck: `pnpm typecheck` (add if missing)
- Test: `pnpm test`
- Lint: `pnpm lint`

## Frontend architecture

- React + TypeScript
- Zustand stores:
  - `src/stores/noteStore.ts` (notes list, active note, CRUD)
  - `src/stores/uiStore.ts` (theme, sidebar state, search query)
- TipTap editor lives in `src/components/editor/Editor.tsx`
- TipTap extensions live in `src/extensions/`

## UI rules

- Theme comes from CSS variables (see `docs/UI_TOKENS.md`)
- Keep text readable:
  - editor max width 720px
  - serif body font for content; system font for UI chrome
- Use Lucide icons sparingly
- Avoid “developer tool” vibes (no heavy borders, no cluttered toolbars)

## TipTap rules

- Prompt blocks are a custom node with React NodeView.
- NodeView must preserve editable rich text inside blocks.
- The block wrapper (label bar, collapse toggle, drag handle) is non-editable.
- Export should rely on TipTap JSON, not HTML.

## State + persistence

- The canonical note data comes from Rust commands (Tauri invoke).
- Autosave:
  - 1000ms debounce
  - also save on blur / note switch
- If you need derived stats (word count, block count), compute from current editor state (and/or derived text).

## Testing guidance

- Pure formatting logic belongs in `src/lib/*` and should be unit tested.
- Avoid testing TipTap internals directly; test your wrapper utilities and exported formatting.
