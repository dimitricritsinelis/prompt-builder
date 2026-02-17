# Manual QA checklist (macOS + Windows)

Core flows:
- Create freeform note
- Create prompt note (6 blocks inserted)
- Edit title
- Edit content (rich text, lists)
- Autosave triggers (pause typing, blur, switch notes)
- Search returns expected results (FTS5)
- Pin/unpin note and verify pinned section
- Soft delete to trash + undo (if implemented)
- Restore from trash (if implemented)

Prompt blocks:
- Insert via slash menu
- Insert via toolbar
- Collapse/expand
- Drag to reorder
- Placeholders display in empty blocks

Exports:
- Export current note: markdown
- Export current note: json
- Export provider format: Claude + OpenAI
- Bulk export: markdown folder
- Bulk export: json archive
- Import markdown (becomes freeform)
- Import json (lossless restore)

Shortcuts:
- Cmd/Ctrl+N, Cmd/Ctrl+Shift+N
- Cmd/Ctrl+F
- Cmd/Ctrl+S
- Cmd/Ctrl+Shift+E

Theming:
- Light/dark mode switch
- Ensure contrast and hover states feel consistent

Performance smoke:
- Create ~200 notes; search stays snappy
- Rapid note switching does not lag or lose edits
