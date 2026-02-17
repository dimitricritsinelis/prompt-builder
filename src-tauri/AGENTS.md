# Backend AGENTS.md (src-tauri/)

This file applies to work under `src-tauri/`.

## Commands (run from src-tauri/)

- Format: `cargo fmt --all`
- Lint: `cargo clippy --all-targets --all-features -D warnings`
- Test: `cargo test`

## Backend responsibilities

- SQLite storage (single DB file in app data dir)
- Migrations on startup
- Tauri commands for:
  - note CRUD + search + pin/trash
  - reindex
  - exports (markdown/json/provider formatted)
  - bulk export
- Crash-safe writes (transactional updates)

## DB rules (must follow)

- `body_json` is source of truth.
- `body_text` is derived from JSON, used for FTS5 only.
- Updates must be done in a single transaction for note update operations.
- Keep schema compatible with `docs/DB_SCHEMA.md`.

## Error handling

- Return clear error messages across the Tauri boundary.
- Prefer structured errors internally, map to user-safe strings at the command layer.

## Performance constraints

- Keep note switching fast; avoid blocking the UI thread.
- Avoid long synchronous DB work on the main thread.
