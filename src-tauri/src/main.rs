// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod fetch;  // 统一的 fetch 模块

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      // MCP 请求
      fetch::tauri_fetch_mcp,
      fetch::tauri_fetch_mcp_stream,
      // 大模型请求
      fetch::tauri_fetch_llm,
      fetch::tauri_fetch_llm_stream,
      // 云同步请求
      fetch::tauri_fetch_sync,
      fetch::tauri_fetch_sync_stream
    ])
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .setup(|app| {
      // 只在启用 debug-devtools feature 时打开开发者工具
      #[cfg(feature = "debug-devtools")]
      {
        use tauri::Manager;
        if let Some(window) = app.get_window("main") {
          window.open_devtools();
          println!("Developer tools opened");
        }
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
