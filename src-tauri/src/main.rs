// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod fetch;  // 统一的 fetch 模块
mod ws;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      fetch::tauri_fetch,
      ws::tauri_ws_connect,
      ws::tauri_ws_send_text,
      ws::tauri_ws_close
    ])
    .setup(|_app| {
      // 只在启用 debug-devtools feature 时打开开发者工具
      #[cfg(feature = "debug-devtools")]
      {
        use tauri::Manager;
        if let Some(window) = _app.get_webview_window("main") {
          window.open_devtools();
          println!("Developer tools opened");
        }
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
