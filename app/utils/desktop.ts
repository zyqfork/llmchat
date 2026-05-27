import { getClientConfig } from "../config/client";
import {
  getDesktopRuntime,
  DesktopRuntime,
  isElectronApp,
  isTauriApp,
} from "./fetch";
import { logger } from "./logger";

/** 是否运行在 Tauri / Electron 桌面环境（含 electron:dev） */
export function isDesktopRuntime(): boolean {
  return getDesktopRuntime() !== DesktopRuntime.Browser;
}

/**
 * 是否为桌面客户端场景（打包 isApp 或运行时桌面壳）
 * 用于布局、Analytics、访问码等桌面专属逻辑
 */
export function isDesktopApp(): boolean {
  const cfg = getClientConfig();
  if (cfg?.isApp) return true;
  if (typeof window !== "undefined" && window.electronApp?.isDesktopClient) {
    return true;
  }
  return isDesktopRuntime();
}

/** 在系统默认浏览器中打开外链 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url || /^javascript:/i.test(url)) return;

  try {
    if (isTauriApp()) {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
      return;
    }
    if (isElectronApp() && window.electronApp?.openExternal) {
      await window.electronApp.openExternal(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (e) {
    logger.debug("[Desktop] openExternalUrl failed:", e);
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
