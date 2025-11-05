// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod proxy;  // HTTP 代理服务器（保留）
mod fetch;  // 统一的 fetch 模块

#[tauri::command]
async fn start_proxy_server(port: u16) -> Result<String, String> {
    let proxy = proxy::ProxyServer::new(port);
    
    tokio::spawn(async move {
        if let Err(e) = proxy.start().await {
            eprintln!("[Tauri Proxy] Failed to start proxy server: {}", e);
        }
    });
    
    Ok(format!("Proxy server starting on port {}", port))
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      start_proxy_server,
      // 新的统一命令
      fetch::tauri_fetch,
      fetch::tauri_fetch_stream
    ])
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .setup(|_app| {
      // Auto-start proxy server on port 3210
      tauri::async_runtime::spawn(async move {
        let proxy = proxy::ProxyServer::new(3210);
        if let Err(e) = proxy.start().await {
          eprintln!("[Tauri Proxy] Failed to start proxy server: {}", e);
        }
      });
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
