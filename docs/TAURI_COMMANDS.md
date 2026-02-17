# PromptPad Tauri Commands

High-level command contract between frontend and Rust backend.

## Notes
- `list_notes(query?: string, tag_ids?: string[]) -> NoteSummary[]`
- `get_note(id: string) -> NoteRecord`
- `create_note(input: CreateNoteInput) -> NoteRecord`
- `update_note(input: UpdateNoteInput) -> NoteRecord`
- `delete_note(id: string) -> { ok: true }`

## Tags
- `list_tags() -> Tag[]`
- `create_tag(name: string) -> Tag`
- `delete_tag(id: string) -> { ok: true }`
- `set_note_tags(note_id: string, tag_ids: string[]) -> { ok: true }`

## Search
- `search_notes(query: string) -> NoteSummary[]`

## Settings
- `get_setting(key: string) -> string | null`
- `set_setting(key: string, value: string) -> { ok: true }`

## Export
- `export_note_markdown(note_id: string, path: string) -> { ok: true }`
- `export_note_json(note_id: string, path: string) -> { ok: true }`
- `export_note_provider(note_id: string, provider: string, path: string) -> { ok: true }`
