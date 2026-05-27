import type { Theme } from "../store/config";
import { isElectronApp, isTauriApp } from "./fetch";
import { logger } from "./logger";

type NativeWindowTheme = "light" | "dark";

/** 将应用主题同步到原生窗口（Tauri 标题栏 / Electron nativeTheme） */
export async function syncNativeWindowTheme(theme: Theme) {
  if (isTauriApp()) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      if (theme === "auto") {
        await win.setTheme(null);
      } else {
        await win.setTheme(theme as NativeWindowTheme);
      }
    } catch (e) {
      logger.debug("[Desktop] Tauri setTheme failed:", e);
    }
    return;
  }

  if (isElectronApp() && window.electronApp?.setNativeTheme) {
    try {
      await window.electronApp.setNativeTheme(
        theme === "auto" ? "system" : theme,
      );
    } catch (e) {
      logger.debug("[Desktop] Electron setNativeTheme failed:", e);
    }
  }
}

/** @deprecated 使用 syncNativeWindowTheme */
export const syncTauriWindowTheme = syncNativeWindowTheme;

/** 监听系统主题变化（auto 模式下更新 meta theme-color） */
export function watchSystemColorScheme(
  onChange: (isDark: boolean) => void,
): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => onChange(mq.matches);
  handler();
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

/** 原生窗口系统主题变更（Tauri onThemeChanged / Electron nativeTheme.updated） */
export async function watchNativeSystemTheme(
  onChange: () => void,
): Promise<(() => void) | undefined> {
  if (isTauriApp()) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      return await win.onThemeChanged(() => onChange());
    } catch (e) {
      logger.debug("[Desktop] Tauri onThemeChanged failed:", e);
    }
    return undefined;
  }

  if (isElectronApp() && window.electronApp?.onNativeThemeChanged) {
    try {
      return window.electronApp.onNativeThemeChanged(() => onChange());
    } catch (e) {
      logger.debug("[Desktop] Electron onNativeThemeChanged failed:", e);
    }
  }

  return undefined;
}

/** @deprecated 使用 watchNativeSystemTheme */
export const watchTauriSystemTheme = watchNativeSystemTheme;

export function updateThemeColorMeta(isDark: boolean) {
  const metaDark = document.querySelector(
    'meta[name="theme-color"][media*="dark"]',
  );
  const metaLight = document.querySelector(
    'meta[name="theme-color"][media*="light"]',
  );
  const color = isDark ? "#151515" : "#fafafa";
  metaDark?.setAttribute("content", color);
  metaLight?.setAttribute("content", color);
}
