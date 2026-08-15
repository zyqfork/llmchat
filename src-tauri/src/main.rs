// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod desktop;
mod fetch;
mod ws;

use tauri::Emitter;

fn main() {
  let builder = tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
      desktop::handle_second_instance(app, &argv);
    }))
    .plugin(
      tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, shortcut, event| {
          use tauri_plugin_global_shortcut::ShortcutState;
          if event.state != ShortcutState::Pressed {
            return;
          }
          let id = shortcut.to_string();
          let payload = if id.contains("Comma") {
            "settings"
          } else if id.contains("KeyO") {
            "new-chat"
          } else {
            return;
          };
          let _ = app.emit("global-shortcut", payload);
        })
        .build(),
    )
    .plugin(tauri_plugin_deep_link::init())
    .invoke_handler(tauri::generate_handler![
      fetch::tauri_fetch,
      fetch::tauri_fetch_cancel,
      ws::tauri_ws_connect,
      ws::tauri_ws_send_text,
      ws::tauri_ws_close,
      desktop::toggle_devtools,
      desktop::desktop_frontend_ready
    ])
    .setup(|app| {
      desktop::setup(app)?;
      Ok(())
    });

  builder
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
