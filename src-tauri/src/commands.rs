use crate::db::{Db, Note};
use tauri::State;

#[tauri::command]
pub fn note_create(db: State<'_, Db>, note_type: String) -> Result<Note, String> {
    db.create_note(&note_type)
}

#[tauri::command]
pub fn note_get(db: State<'_, Db>, id: String) -> Result<Note, String> {
    db.get_note(&id)
}

#[tauri::command]
pub fn note_update(
    db: State<'_, Db>,
    id: String,
    title: String,
    body_json: String,
    body_text: String,
) -> Result<Note, String> {
    db.update_note(&id, &title, &body_json, &body_text)
}

#[tauri::command]
pub fn note_delete(db: State<'_, Db>, id: String) -> Result<(), String> {
    db.delete_note(&id)
}

#[tauri::command]
pub fn note_restore(db: State<'_, Db>, id: String) -> Result<(), String> {
    db.restore_note(&id)
}

#[tauri::command]
pub fn note_delete_permanent(db: State<'_, Db>, id: String) -> Result<(), String> {
    db.delete_note_permanent(&id)
}

#[tauri::command]
pub fn note_list(db: State<'_, Db>, include_trashed: bool) -> Result<Vec<Note>, String> {
    db.list_notes(include_trashed)
}

#[tauri::command]
pub fn note_search(db: State<'_, Db>, query: String) -> Result<Vec<Note>, String> {
    db.search_notes(&query)
}

#[tauri::command]
pub fn note_pin(db: State<'_, Db>, id: String, pinned: bool) -> Result<(), String> {
    db.set_note_pinned(&id, pinned)
}

#[tauri::command]
pub fn note_reindex(db: State<'_, Db>) -> Result<(), String> {
    db.reindex_notes()
}
