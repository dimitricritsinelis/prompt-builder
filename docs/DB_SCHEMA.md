# PromptPad DB Schema

SQLite schema and invariants for local storage.

## Core principles
- `body_json` is canonical editor content.
- `body_text` is derived text used only for FTS.
- Writes that touch note content + FTS data must be transaction-safe.

## Tables
```sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body_json TEXT NOT NULL,
  body_text TEXT NOT NULL DEFAULT '',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## FTS strategy
```sql
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
USING fts5(
  note_id UNINDEXED,
  title,
  body_text,
  tokenize = 'unicode61'
);
```

## Update contract
1. Parse/validate incoming editor JSON.
2. Derive plain text from JSON in backend.
3. In one transaction:
   - update `notes.body_json`, `notes.body_text`, `notes.updated_at`
   - upsert FTS row
4. Commit or rollback as one unit.

## Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
```

## Search query pattern
- Use FTS for matching and rank ordering.
- Join back to `notes` for canonical fields.
- Keep pagination simple and deterministic (limit + offset).
