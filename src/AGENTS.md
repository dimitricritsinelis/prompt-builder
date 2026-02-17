# src/AGENTS.md

Frontend implementation notes for PromptPad.

## Scope
- React + TypeScript + Vite UI only.
- Keep business logic in small pure modules where possible.
- Use Zustand for app state (`src/stores/*`).

## UI principles
- Follow tokens in `docs/UI_TOKENS.md` exactly.
- Keep interactions calm: short transitions (`200ms ease`) and minimal visual noise.
- Do not build IDE-like, dense layouts.

## Editor
- TipTap is the rich text engine.
- Prompt-aware blocks are optional overlays on top of regular writing.
- Preserve writer-first flow; structured blocks should never block freeform text.

## State boundaries
- UI state stays in frontend.
- Persistent storage and filesystem operations go through Tauri commands.
- Avoid direct persistence assumptions in components.

## Testing
- Unit test pure TS formatters/parsers/export helpers.
- Keep component tests focused on behavior, not implementation details.

## Do not add
- Network calls
- Analytics/telemetry
- Account, auth, or cloud sync flows
