# PromptPad Product Spec

## Product summary
PromptPad is an offline-first desktop notebook for writing, organizing, and exporting LLM prompts.
It should feel like a calm writing app, not an IDE.

## Goals
- Help a single user capture and iterate on prompts quickly.
- Support both freeform writing and optional structured prompt blocks.
- Keep all data local with fast search and deterministic export.

## Non-goals
- Multi-user collaboration
- Cloud sync
- Prompt execution against provider APIs
- Analytics or telemetry

## Target platforms
- Primary: macOS desktop
- Required compatibility: Windows desktop
- Stack: Tauri 2 + React + TypeScript + Vite + Rust + SQLite

## Core user stories
1. Create and edit prompt notes with no setup friction.
2. Organize notes with tags and lightweight folders/views.
3. Search instantly across all notes.
4. Add optional structured prompt blocks (Role/Context/Task/Constraints/Examples/Output Format).
5. Export notes as markdown, JSON, and provider-ready text format variants.

## Information architecture
- Sidebar: all notes, recent, tags, favorites (optional)
- Main list: notes filtered by current scope
- Editor pane: rich text editor + optional structured block sections
- Utility actions: search, theme toggle, export

## Data model intent
- `body_json` stores canonical editor document.
- `body_text` stores derived plain text for FTS indexing.
- Tags and note metadata are normalized.
- See `docs/DB_SCHEMA.md` for exact schema and search strategy.

## Functional requirements
- Local create/read/update/delete note operations
- Local full-text search with ranked results
- Tag assignment and tag filtering
- Optional structured block editing and serialization
- Deterministic export generation
- Theme support via design tokens
- Keyboard shortcuts for core note actions

## Quality requirements
- Startup should feel immediate on normal laptops.
- Editing should remain responsive on long notes.
- Search should return in well under one second on typical local datasets.
- App must function without network.

## Constraints
- No cloud/auth dependencies
- No external API keys
- Calm visual design and subtle motion (200ms ease)
- Strict frontend/backend boundary via Tauri commands

## Definition of MVP
- User can create, edit, search, tag, and export prompt notes locally.
- Structured blocks exist and remain optional.
- All quality gates in `docs/DEFINITION_OF_DONE.md` pass.
