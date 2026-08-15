"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useChatStore } from "../store";
import { isDesktopRuntime } from "../utils/desktop";
import { isElectronApp, isTauriApp } from "../utils/fetch";
import { deepLinkToPath, parseDeepLinkUrl } from "../utils/deep-link";
import { emitDesktopShortcut } from "../utils/desktop-shortcuts";
import { logger } from "../utils/logger";

const DEEP_LINK_EVENT = "llmchat:deep-link";

function dispatchDeepLink(url: string) {
  window.dispatchEvent(new CustomEvent(DEEP_LINK_EVENT, { detail: { url } }));
}

export function DesktopLifecycle() {
  const navigate = useNavigate();
  const chatStore = useChatStore();

  useEffect(() => {
    if (!isDesktopRuntime()) return;

    const onDeepLink = (event: Event) => {
      const url = (event as CustomEvent<{ url: string }>).detail?.url;
      if (!url) return;
      const target = parseDeepLinkUrl(url);
      if (!target) return;

      logger.debug("[Desktop] Deep link:", url, target);

      if (target.type === "new-chat") {
        chatStore.newSession();
        navigate(Path.Chat);
        return;
      }
      navigate(deepLinkToPath(target));
    };

    window.addEventListener(DEEP_LINK_EVENT, onDeepLink);

    const unlisteners: Array<() => void> = [];

    void (async () => {
      if (isTauriApp()) {
        try {
          const { listen } = await import("@tauri-apps/api/event");
          const unlistenDeepLink = await listen<string>("deep-link", (event) =>
            dispatchDeepLink(event.payload),
          );
          unlisteners.push(unlistenDeepLink);

          // 取回首启时缓存的深链（防止 React 挂载完成前的事件丢失）
          const { invoke: invokeCore } = await import("@tauri-apps/api/core");
          const pending =
            (await invokeCore<string[]>("desktop_frontend_ready")) || [];
          pending.forEach((url) => dispatchDeepLink(url));

          const unlistenShortcut = await listen<string>(
            "global-shortcut",
            (event) => {
              const id = event.payload;
              if (id === "settings") emitDesktopShortcut("open-settings");
              if (id === "new-chat") emitDesktopShortcut("new-chat");
            },
          );
          unlisteners.push(unlistenShortcut);
        } catch (e) {
          logger.debug("[Desktop] Tauri event listen failed:", e);
        }
      }

      if (isElectronApp() && window.electronApp?.onDeepLink) {
        unlisteners.push(
          window.electronApp.onDeepLink((url) => dispatchDeepLink(url)),
        );
      }
    })();

    return () => {
      window.removeEventListener(DEEP_LINK_EVENT, onDeepLink);
      unlisteners.forEach((fn) => fn());
    };
  }, [navigate, chatStore]);

  return null;
}
