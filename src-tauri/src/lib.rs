mod commands;
mod db;
use serde::Serialize;
use std::sync::OnceLock;
use std::time::Instant;
use tauri::{Emitter, Manager};

static PROCESS_START: OnceLock<Instant> = OnceLock::new();
static RUST_READY_MS: OnceLock<u128> = OnceLock::new();

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct StartupReadyPayload {
    rust_ready_ms: u128,
}

pub fn mark_process_start() {
    let _ = PROCESS_START.set(Instant::now());
}

fn startup_elapsed_ms() -> u128 {
    PROCESS_START
        .get_or_init(Instant::now)
        .elapsed()
        .as_millis()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    mark_process_start();

    tauri::Builder::default()
        .setup(|app| {
            let db = db::Db::from_app(app.handle())?;
            app.manage(db);
            let _ = RUST_READY_MS.set(startup_elapsed_ms());
            #[cfg(debug_assertions)]
            if std::env::var("PROMPTPAD_OPEN_DEVTOOLS").as_deref() == Ok("1") {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }
            Ok(())
        })
        .on_page_load(|window, _| {
            let rust_ready_ms = *RUST_READY_MS.get_or_init(startup_elapsed_ms);
            let payload = StartupReadyPayload { rust_ready_ms };

            if let Err(error) = window.eval(&format!(
                "window.__PROMPTPAD_RUST_READY_MS__ = {};",
                rust_ready_ms
            )) {
                eprintln!("failed to publish startup metrics to webview global: {error}");
            }

            if let Err(error) = window.emit("startup:ready", payload) {
                eprintln!("failed to emit startup:ready event: {error}");
            }
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::note_create,
            commands::note_get,
            commands::note_update,
            commands::note_delete,
            commands::note_restore,
            commands::note_delete_permanent,
            commands::note_list,
            commands::note_list_meta,
            commands::note_search,
            commands::note_search_meta,
            commands::note_pin,
            commands::note_reindex
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
