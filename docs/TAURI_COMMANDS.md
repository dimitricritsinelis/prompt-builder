# Tauri Command Contract

Commands exposed from Rust to frontend via `invoke`.

Notes:
- `note_delete` is soft delete (trash).
- `note_delete_permanent` is hard delete.

## Notes

- `note_create(note_type: string) -> Note`
- `note_get(id: string) -> Note`
- `note_update(id: string, title: string, body_json: string, body_text: string) -> Note`
- `note_delete(id: string) -> void`
- `note_delete_permanent(id: string) -> void`
- `note_list(include_trashed: bool) -> Note[]`
- `note_list_meta(include_trashed: bool) -> NoteMeta[]`
- `note_search(query: string) -> Note[]`
- `note_search_meta(query: string) -> NoteMeta[]`
- `note_pin(id: string, pinned: bool) -> void`
- `note_reindex() -> void`

## Export (Planned, Not Wired Yet)

The following commands are documented target contracts but are not currently
registered in `/Users/dimitri/Desktop/prompt-builder/src-tauri/src/lib.rs`:

- `export_note_markdown(id: string) -> string`
- `export_note_json(id: string) -> string`
- `export_note_prompt(id: string, provider: string) -> string` // 'claude' | 'openai'
- `export_all_markdown(dir_path: string) -> void`
- `export_all_json(file_path: string) -> void`
