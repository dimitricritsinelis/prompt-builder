use r2d2::{Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::{params, OptionalExtension, Row};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::Manager;
use uuid::Uuid;

const MIGRATION_001: &str = include_str!("../migrations/001_initial.sql");

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: String,
    pub title: String,
    pub body_json: String,
    pub body_text: String,
    pub note_type: String,
    pub meta_json: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub is_pinned: bool,
    pub is_trashed: bool,
}

#[derive(Clone)]
pub struct Db {
    pool: Pool<SqliteConnectionManager>,
}

impl Db {
    pub fn from_app(app: &tauri::AppHandle) -> Result<Self, String> {
        let app_dir = app
            .path()
            .app_data_dir()
            .map_err(|error| format!("failed to resolve app data dir: {error}"))?;

        Self::initialize(&app_dir.join("promptpad.sqlite3"))
    }

    pub fn initialize(db_path: &Path) -> Result<Self, String> {
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent).map_err(|error| {
                format!(
                    "failed to create database directory {}: {error}",
                    parent.display()
                )
            })?;
        }

        let manager = SqliteConnectionManager::file(db_path);
        let pool = Pool::builder()
            .max_size(4)
            .build(manager)
            .map_err(|error| format!("failed to create sqlite pool: {error}"))?;

        let db = Self { pool };
        db.migrate()?;
        Ok(db)
    }

    #[cfg(test)]
    fn initialize_in_memory() -> Result<Self, String> {
        let manager = SqliteConnectionManager::memory();
        let pool = Pool::builder()
            .max_size(1)
            .build(manager)
            .map_err(|error| format!("failed to create in-memory sqlite pool: {error}"))?;

        let db = Self { pool };
        db.migrate()?;
        Ok(db)
    }

    pub fn create_note(&self, note_type: &str) -> Result<Note, String> {
        if note_type != "freeform" && note_type != "prompt" {
            return Err(format!(
                "invalid note_type '{note_type}', expected 'freeform' or 'prompt'"
            ));
        }

        let id = Uuid::new_v4().to_string();
        let conn = self.get_conn()?;
        conn.execute(
            "INSERT INTO notes (id, note_type) VALUES (?1, ?2)",
            params![id, note_type],
        )
        .map_err(|error| format!("failed to create note: {error}"))?;
        drop(conn);

        self.get_note(&id)
    }

    pub fn get_note(&self, id: &str) -> Result<Note, String> {
        let conn = self.get_conn()?;
        conn.query_row(
            "SELECT id, title, body_json, body_text, note_type, meta_json, created_at, updated_at, is_pinned, is_trashed
             FROM notes
             WHERE id = ?1",
            params![id],
            note_from_row,
        )
        .optional()
        .map_err(|error| format!("failed to read note {id}: {error}"))?
        .ok_or_else(|| format!("note not found: {id}"))
    }

    pub fn update_note(
        &self,
        id: &str,
        title: &str,
        body_json: &str,
        body_text: &str,
    ) -> Result<Note, String> {
        let mut conn = self.get_conn()?;
        let tx = conn
            .transaction()
            .map_err(|error| format!("failed to start update transaction: {error}"))?;

        let changed = tx
            .execute(
                "UPDATE notes
                 SET title = ?1,
                     body_json = ?2,
                     body_text = ?3,
                     updated_at = datetime('now')
                 WHERE id = ?4",
                params![title, body_json, body_text, id],
            )
            .map_err(|error| format!("failed to update note {id}: {error}"))?;

        if changed == 0 {
            return Err(format!("note not found: {id}"));
        }

        tx.commit()
            .map_err(|error| format!("failed to commit note update: {error}"))?;
        drop(conn);

        self.get_note(id)
    }

    pub fn delete_note(&self, id: &str) -> Result<(), String> {
        let conn = self.get_conn()?;
        let changed = conn
            .execute(
                "UPDATE notes
                 SET is_trashed = 1, updated_at = datetime('now')
                 WHERE id = ?1",
                params![id],
            )
            .map_err(|error| format!("failed to trash note {id}: {error}"))?;

        if changed == 0 {
            return Err(format!("note not found: {id}"));
        }

        Ok(())
    }

    pub fn restore_note(&self, id: &str) -> Result<(), String> {
        let conn = self.get_conn()?;
        let changed = conn
            .execute(
                "UPDATE notes
                 SET is_trashed = 0, updated_at = datetime('now')
                 WHERE id = ?1",
                params![id],
            )
            .map_err(|error| format!("failed to restore note {id}: {error}"))?;

        if changed == 0 {
            return Err(format!("note not found: {id}"));
        }

        Ok(())
    }

    pub fn delete_note_permanent(&self, id: &str) -> Result<(), String> {
        let conn = self.get_conn()?;
        let changed = conn
            .execute("DELETE FROM notes WHERE id = ?1", params![id])
            .map_err(|error| format!("failed to permanently delete note {id}: {error}"))?;

        if changed == 0 {
            return Err(format!("note not found: {id}"));
        }

        Ok(())
    }

    pub fn list_notes(&self, include_trashed: bool) -> Result<Vec<Note>, String> {
        let conn = self.get_conn()?;
        let query = if include_trashed {
            "SELECT id, title, body_json, body_text, note_type, meta_json, created_at, updated_at, is_pinned, is_trashed
             FROM notes
             ORDER BY is_pinned DESC, updated_at DESC"
        } else {
            "SELECT id, title, body_json, body_text, note_type, meta_json, created_at, updated_at, is_pinned, is_trashed
             FROM notes
             WHERE is_trashed = 0
             ORDER BY is_pinned DESC, updated_at DESC"
        };

        let mut stmt = conn
            .prepare(query)
            .map_err(|error| format!("failed to prepare note list query: {error}"))?;

        let rows = stmt
            .query_map([], note_from_row)
            .map_err(|error| format!("failed to list notes: {error}"))?;

        let mut notes = Vec::new();
        for row in rows {
            notes.push(row.map_err(|error| format!("failed to map note row: {error}"))?);
        }
        Ok(notes)
    }

    pub fn search_notes(&self, query: &str) -> Result<Vec<Note>, String> {
        let cleaned = query.trim();
        if cleaned.is_empty() {
            return self.list_notes(false);
        }

        let conn = self.get_conn()?;
        let mut stmt = conn
            .prepare(
                "SELECT n.id, n.title, n.body_json, n.body_text, n.note_type, n.meta_json, n.created_at, n.updated_at, n.is_pinned, n.is_trashed
                 FROM notes_fts
                 JOIN notes n ON n.rowid = notes_fts.rowid
                 WHERE notes_fts MATCH ?1
                   AND n.is_trashed = 0
                 ORDER BY n.is_pinned DESC, bm25(notes_fts), n.updated_at DESC",
            )
            .map_err(|error| format!("failed to prepare search query: {error}"))?;

        let rows = stmt
            .query_map(params![cleaned], note_from_row)
            .map_err(|error| format!("failed to run search query: {error}"))?;

        let mut notes = Vec::new();
        for row in rows {
            notes.push(row.map_err(|error| format!("failed to map search row: {error}"))?);
        }

        Ok(notes)
    }

    pub fn set_note_pinned(&self, id: &str, pinned: bool) -> Result<(), String> {
        let conn = self.get_conn()?;
        let changed = conn
            .execute(
                "UPDATE notes
                 SET is_pinned = ?1, updated_at = datetime('now')
                 WHERE id = ?2",
                params![if pinned { 1 } else { 0 }, id],
            )
            .map_err(|error| format!("failed to pin note {id}: {error}"))?;

        if changed == 0 {
            return Err(format!("note not found: {id}"));
        }

        Ok(())
    }

    pub fn reindex_notes(&self) -> Result<(), String> {
        let conn = self.get_conn()?;
        conn.execute("INSERT INTO notes_fts(notes_fts) VALUES('rebuild')", [])
            .map_err(|error| format!("failed to rebuild FTS index: {error}"))?;
        Ok(())
    }

    fn get_conn(&self) -> Result<PooledConnection<SqliteConnectionManager>, String> {
        let conn = self
            .pool
            .get()
            .map_err(|error| format!("failed to get sqlite connection: {error}"))?;

        conn.execute_batch("PRAGMA foreign_keys = ON;")
            .map_err(|error| format!("failed to apply sqlite pragmas: {error}"))?;

        Ok(conn)
    }

    fn migrate(&self) -> Result<(), String> {
        let mut conn = self.get_conn()?;
        let tx = conn
            .transaction()
            .map_err(|error| format!("failed to start migration transaction: {error}"))?;

        let schema_exists = tx
            .query_row(
                "SELECT EXISTS(
                    SELECT 1
                    FROM sqlite_master
                    WHERE type = 'table' AND name = 'schema_version'
                )",
                [],
                |row| row.get::<_, i64>(0),
            )
            .map_err(|error| format!("failed to inspect schema_version table: {error}"))?
            == 1;

        if !schema_exists {
            tx.execute_batch(MIGRATION_001)
                .map_err(|error| format!("failed to run initial migration: {error}"))?;
            tx.commit()
                .map_err(|error| format!("failed to commit initial migration: {error}"))?;
            return Ok(());
        }

        let current_version = tx
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_version",
                [],
                |row| row.get::<_, i64>(0),
            )
            .map_err(|error| format!("failed to query schema_version: {error}"))?;

        if current_version < 1 {
            tx.execute_batch(MIGRATION_001)
                .map_err(|error| format!("failed to apply migration version 1: {error}"))?;
        }

        tx.commit()
            .map_err(|error| format!("failed to commit migrations: {error}"))?;
        Ok(())
    }
}

fn note_from_row(row: &Row<'_>) -> rusqlite::Result<Note> {
    Ok(Note {
        id: row.get("id")?,
        title: row.get("title")?,
        body_json: row.get("body_json")?,
        body_text: row.get("body_text")?,
        note_type: row.get("note_type")?,
        meta_json: row.get("meta_json")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        is_pinned: row.get::<_, i64>("is_pinned")? != 0,
        is_trashed: row.get::<_, i64>("is_trashed")? != 0,
    })
}

#[cfg(test)]
mod tests {
    use super::Db;

    #[test]
    fn creates_note_with_defaults() {
        let db = Db::initialize_in_memory().expect("in-memory db should initialize");
        let note = db.create_note("freeform").expect("note should be created");

        assert_eq!(note.title, "Untitled");
        assert_eq!(note.body_json, "{}");
        assert_eq!(note.body_text, "");
        assert_eq!(note.note_type, "freeform");
        assert!(!note.is_trashed);
        assert!(!note.is_pinned);
    }

    #[test]
    fn updates_note_in_single_record() {
        let db = Db::initialize_in_memory().expect("in-memory db should initialize");
        let note = db.create_note("freeform").expect("note should be created");

        let updated = db
            .update_note(
                &note.id,
                "Updated title",
                r#"{"type":"doc"}"#,
                "Updated plain text",
            )
            .expect("note should update");

        assert_eq!(updated.title, "Updated title");
        assert_eq!(updated.body_json, r#"{"type":"doc"}"#);
        assert_eq!(updated.body_text, "Updated plain text");
    }

    #[test]
    fn searches_notes_using_fts() {
        let db = Db::initialize_in_memory().expect("in-memory db should initialize");
        let alpha = db
            .create_note("freeform")
            .expect("alpha note should be created");
        let beta = db
            .create_note("prompt")
            .expect("beta note should be created");

        db.update_note(
            &alpha.id,
            "Alpha note",
            r#"{"type":"doc","content":[{"type":"paragraph","text":"alpha"}]}"#,
            "alpha keyword present",
        )
        .expect("alpha note should update");

        db.update_note(
            &beta.id,
            "Beta note",
            r#"{"type":"doc","content":[{"type":"paragraph","text":"beta"}]}"#,
            "beta only",
        )
        .expect("beta note should update");

        let results = db.search_notes("alpha").expect("search should succeed");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, alpha.id);
    }
}
