mod commands;
mod db;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db = db::Db::from_app(&app.handle())?;
            app.manage(db);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::note_create,
            commands::note_get,
            commands::note_update,
            commands::note_delete,
            commands::note_delete_permanent,
            commands::note_list,
            commands::note_search,
            commands::note_pin,
            commands::note_reindex
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
