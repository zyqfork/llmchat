export type DesktopShortcutAction =
  | "new-chat"
  | "open-settings"
  | "focus-input"
  | "show-shortcuts";

export const DESKTOP_SHORTCUT_EVENT = "llmchat:desktop-shortcut";

export function emitDesktopShortcut(action: DesktopShortcutAction) {
  window.dispatchEvent(
    new CustomEvent(DESKTOP_SHORTCUT_EVENT, { detail: { action } }),
  );
}

/** 桌面端应用级快捷键（任意页面可用，需应用获得焦点） */
export function handleDesktopGlobalKeyDown(event: KeyboardEvent): boolean {
  const mod = event.metaKey || event.ctrlKey;
  if (!mod) return false;

  // 打开设置：Cmd/Ctrl + ,
  if (event.key === ",") {
    event.preventDefault();
    emitDesktopShortcut("open-settings");
    return true;
  }

  return false;
}
