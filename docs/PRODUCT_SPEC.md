# PromptPad — Product Spec (Condensed)

Version: 1.0 (Feb 2026)

PromptPad is a lightweight desktop notes app purpose-built for writing and organizing LLM prompts.
It should feel like a warm, thoughtful notepad — not an IDE and not a chat interface.

## Success criteria

- Cold start feels instant (< ~1s target)
- Create/edit prompts quickly
- Optional prompt structure via blocks, never forced
- Export to provider-friendly formats (Claude XML tags, GPT markdown delimiters)
- All data local, no accounts/cloud

## Platform targets

- macOS 13+ (primary)
- Windows 10 21H2+ (compatible)

## Stack

- Tauri 2 (Rust backend commands)
- React + TS + Vite
- TipTap (ProseMirror)
- Tailwind + CSS variables
- Zustand

## Core UX

Layout:
- Sidebar (fixed ~260px): search, new note buttons, pinned, note list grouped by recency
- Editor pane: centered content (max 720px)
- Status bar: save state + word count + block count + note type badge

Notes:
- Two note types:
  - freeform: blank doc
  - prompt: pre-populated with blocks (Role → Context → Task → Constraints → Examples → Output Format)

Autosave:
- 1000ms debounce after last keystroke
- also save on blur / note switch
- transactional update of `body_json` + `body_text`

Shortcuts:
- Cmd+N new freeform
- Cmd+Shift+N new prompt
- Cmd+F focus search
- Cmd+S force save
- Cmd+Shift+E export

## Prompt blocks (first-class but optional)

Block types:
- role
- context
- task
- constraints
- examples
- format (output format)

Each block:
- label bar + collapse toggle
- left accent border per type
- rich text inside
- drag-to-reorder

Insertion:
- slash menu (`/`) at empty line start
- toolbar dropdown

## Exports

- Markdown (headings)
- JSON (lossless envelope with version + timestamps)
- Provider formatted:
  - Claude: XML tags like `<role>...</role>`
  - GPT: `### Role` style markdown delimiters

Bulk export:
- Markdown folder (one .md per note)
- JSON archive (single file of all notes)

## Data model (SQLite)

- `notes` table with UUID, title, `body_json`, `body_text`, note_type, pinned/trashed, timestamps
- FTS5 virtual table for title + body_text
- triggers to keep FTS in sync

See: `docs/DB_SCHEMA.md` and `docs/TAURI_COMMANDS.md`.
