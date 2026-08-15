use once_cell::sync::Lazy;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  AppHandle, Emitter, Manager,
};

/// 前端是否已完成 deep-link 事件监听。未就绪前收到的深链 URL 会先缓存，
/// 等前端通过 `desktop_frontend_ready` 命令取回后再分发（避免首启丢失）。
static FRONTEND_READY: AtomicBool = AtomicBool::new(false);
static PENDING_DEEP_LINKS: Lazy<Mutex<Vec<String>>> =
  Lazy::new(|| Mutex::new(Vec::new()));

fn dispatch_deep_link(app: &AppHandle, url: &str) {
  if FRONTEND_READY.load(Ordering::SeqCst) {
    let _ = app.emit("deep-link", url.to_string());
  } else if let Ok(mut pending) = PENDING_DEEP_LINKS.lock() {
    pending.push(url.to_string());
  }
}

/// 前端挂载 deep-link 监听后调用：一次性取回首启缓存的深链（由前端分发），
/// 此后新到达的深链直接 emit，不再缓存。
#[tauri::command]
pub fn desktop_frontend_ready() -> Vec<String> {
  FRONTEND_READY.store(true, Ordering::SeqCst);
  PENDING_DEEP_LINKS
    .lock()
    .map(|mut v| std::mem::take(&mut *v))
    .unwrap_or_default()
}

pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  setup_tray(app)?;
  setup_deep_link(app)?;
  setup_global_shortcuts(app)?;
  Ok(())
}

pub fn focus_main_window_from_plugin(app: &AppHandle) {
  focus_main_window(app);
}

fn focus_main_window(app: &AppHandle) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
  }
}

fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  let show = MenuItem::with_id(app, "tray-show", "显示 LLMChat", true, None::<&str>)?;
  let quit = MenuItem::with_id(app, "tray-quit", "退出", true, None::<&str>)?;
  let menu = Menu::with_items(app, &[&show, &quit])?;

  let icon = app
    .default_window_icon()
    .ok_or("missing default window icon")?
    .clone();

  let _tray = TrayIconBuilder::new()
    .icon(icon)
    .menu(&menu)
    .tooltip("LLMChat")
    .on_menu_event(move |app, event| match event.id.as_ref() {
      "tray-show" => focus_main_window(app),
      "tray-quit" => {
        app.exit(0);
      }
      _ => {}
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        let app = tray.app_handle();
        focus_main_window(&app);
      }
    })
    .build(app)?;

  Ok(())
}

fn setup_deep_link(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  use tauri_plugin_deep_link::DeepLinkExt;

  let handle = app.handle().clone();
  app.deep_link().on_open_url(move |event| {
    for url in event.urls() {
      dispatch_deep_link(&handle, &url.to_string());
    }
  });

  Ok(())
}

fn setup_global_shortcuts(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

  let settings =
    Shortcut::new(Some(Modifiers::SUPER | Modifiers::CONTROL), Code::Comma);
  let new_chat = Shortcut::new(
    Some(Modifiers::SUPER | Modifiers::CONTROL | Modifiers::SHIFT),
    Code::KeyO,
  );

  app.global_shortcut().register(settings)?;
  app.global_shortcut().register(new_chat)?;

  Ok(())
}

#[tauri::command]
pub fn toggle_devtools(window: tauri::WebviewWindow) {
  if window.is_devtools_open() {
    window.close_devtools();
  } else {
    window.open_devtools();
  }
}

pub fn handle_second_instance(app: &AppHandle, argv: &[String]) {
  focus_main_window_from_plugin(app);
  for arg in argv {
    if arg.starts_with("llmchat:") {
      dispatch_deep_link(app, arg);
    }
  }
}
