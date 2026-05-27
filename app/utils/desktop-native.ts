import { useEffect } from "react";
import { isDesktopApp, openExternalUrl } from "./desktop";
import { getDesktopRuntime, DesktopRuntime } from "./fetch";
import { handleDesktopGlobalKeyDown } from "./desktop-shortcuts";
import {
  syncNativeWindowTheme,
  updateThemeColorMeta,
  watchNativeSystemTheme,
  watchSystemColorScheme,
} from "./desktop-theme";
import { logger } from "./logger";
import { Theme, useAppConfig } from "../store/config";

let installed = false;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

function isMacOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

/** 桌面客户端（Tauri / Electron）DOM 级原生体验增强 */
export function installDesktopNativeEnhancements() {
  if (typeof window === "undefined" || installed) return;

  const runtime = getDesktopRuntime();
  if (runtime === DesktopRuntime.Browser) return;
  installed = true;

  const root = document.documentElement;
  root.classList.add("desktop-app");
  if (runtime === DesktopRuntime.Tauri) {
    root.classList.add("desktop-tauri");
  }
  if (runtime === DesktopRuntime.Electron) {
    root.classList.add("desktop-electron");
  }
  if (isMacOS()) {
    root.classList.add("desktop-macos");
  }

  document.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener("keydown", (e) => {
    if (handleDesktopGlobalKeyDown(e)) return;
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === "=" || key === "+" || key === "-" || key === "0") {
      e.preventDefault();
    }
  });

  document.addEventListener("auxclick", (e) => {
    if (e.button === 1) e.preventDefault();
  });

  document.addEventListener("contextmenu", (e) => {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
  });

  document.addEventListener("dragover", (e) => {
    if (!e.dataTransfer?.types.includes("Files")) return;
    const hasDropZone = (e.target as HTMLElement)?.closest(
      "[data-desktop-drop-zone]",
    );
    if (!hasDropZone) e.preventDefault();
  });
  document.addEventListener("drop", (e) => {
    if (!e.dataTransfer?.types.includes("Files")) return;
    const hasDropZone = (e.target as HTMLElement)?.closest(
      "[data-desktop-drop-zone]",
    );
    if (!hasDropZone) e.preventDefault();
  });

  // 桌面端外链统一走系统浏览器
  document.addEventListener("click", (e) => {
    const anchor = (e.target as HTMLElement)?.closest("a[href]");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("/")) return;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (!/^https?:\/\//i.test(href)) return;
    e.preventDefault();
    void openExternalUrl(href);
  });

  logger.debug("[Desktop] Native enhancements installed", { runtime });
}

/** 桌面打包版默认全屏布局（含 electron:dev） */
export function shouldUseDesktopLayout(): boolean {
  return isDesktopApp();
}

/** 桌面端主题与 Tauri 窗口主题同步 */
export function useDesktopThemeSync() {
  const config = useAppConfig();

  useEffect(() => {
    if (getDesktopRuntime() === DesktopRuntime.Browser) return;

    void syncNativeWindowTheme(config.theme as Theme);

    if (config.theme !== Theme.Auto) return;

    document.body.classList.add("theme-auto");
    const stopWatch = watchSystemColorScheme(updateThemeColorMeta);

    let stopNativeWatch: (() => void) | undefined;
    void watchNativeSystemTheme(() => {
      updateThemeColorMeta(
        window.matchMedia("(prefers-color-scheme: dark)").matches,
      );
    }).then((unlisten) => {
      stopNativeWatch = unlisten;
    });

    return () => {
      document.body.classList.remove("theme-auto");
      stopWatch();
      stopNativeWatch?.();
    };
  }, [config.theme]);
}
