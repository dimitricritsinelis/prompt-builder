# src-tauri/AGENTS.md

Backend implementation notes for PromptPad.

## Scope
- Rust + Tauri 2 commands for storage, filesystem access, and exports.
- SQLite is local-only and authoritative for app data.

## Data integrity rules
- `body_json` is source of truth.
- `body_text` is derived from `body_json` only for FTS/search indexing.
- Multi-step writes must use transactions.

## Command design
- Keep command inputs/outputs explicit and serializable.
- Return predictable error variants/messages.
- Keep side effects local and deterministic.

## Safety
- No remote network dependencies for core app behavior.
- No analytics or external telemetry.
- Limit filesystem writes to explicit user actions (save/export/import paths).

## Testing
- Add Rust unit tests for DB operations and export formatting.
- Validate migration behavior and rollback safety where relevant.
