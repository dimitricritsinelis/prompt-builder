-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO schema_version (version) VALUES (1);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,                          -- UUID v4
    title TEXT NOT NULL DEFAULT 'Untitled',
    body_json TEXT NOT NULL DEFAULT '{}',          -- TipTap JSON (source of truth)
    body_text TEXT NOT NULL DEFAULT '',            -- Plain text extract (FTS only)
    note_type TEXT NOT NULL DEFAULT 'freeform',    -- 'freeform' | 'prompt'
    meta_json TEXT,                                -- nullable metadata (tags, etc.)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_trashed INTEGER NOT NULL DEFAULT 0
);

-- Full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    title, body_text,
    content='notes', content_rowid='rowid'
);

-- FTS sync triggers
CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, body_text)
    VALUES (new.rowid, new.title, new.body_text);
END;

CREATE TRIGGER notes_ad AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, body_text)
    VALUES ('delete', old.rowid, old.title, old.body_text);
END;

CREATE TRIGGER notes_au AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, body_text)
    VALUES ('delete', old.rowid, old.title, old.body_text);
    INSERT INTO notes_fts(rowid, title, body_text)
    VALUES (new.rowid, new.title, new.body_text);
END;

-- Indexes
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_type ON notes(note_type);
CREATE INDEX idx_notes_trashed ON notes(is_trashed);
