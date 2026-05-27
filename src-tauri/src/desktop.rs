use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  AppHandle, Emitter, Manager,
};

pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  setup_tray(app)?;
  setup_deep_link(app)?;
  setup_global_shortcuts(app)?;
  setup_traffic_lights(app);
  Ok(())
}

/// macOS Overlay 标题栏交通灯位置（不宜写在 tauri.conf，旧版 CLI 不识别该字段）
#[cfg(target_os = "macos")]
fn setup_traffic_lights(app: &tauri::App) {
  if let Some(window) = app.get_webview_window("main") {
    use tauri::{LogicalPosition, Position};
    let _ = window.set_traffic_light_position(Position::Logical(LogicalPosition::new(
      16.0, 18.0,
    )));
  }
}

#[cfg(not(target_os = "macos"))]
fn setup_traffic_lights(_app: &tauri::App) {}

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
      let _ = handle.emit("deep-link", url.to_string());
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
      let _ = app.emit("deep-link", arg.clone());
    }
  }
}
