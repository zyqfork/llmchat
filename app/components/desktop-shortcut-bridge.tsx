"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useChatStore } from "../store";
import {
  DESKTOP_SHORTCUT_EVENT,
  type DesktopShortcutAction,
} from "../utils/desktop-shortcuts";
import { getDesktopRuntime, DesktopRuntime } from "../utils/fetch";

export function DesktopShortcutBridge() {
  const navigate = useNavigate();
  const chatStore = useChatStore();

  useEffect(() => {
    if (getDesktopRuntime() === DesktopRuntime.Browser) return;

    const handler = (event: Event) => {
      const action = (event as CustomEvent<{ action: DesktopShortcutAction }>)
        .detail?.action;
      if (!action) return;

      switch (action) {
        case "open-settings":
          navigate(Path.Settings);
          break;
        case "new-chat":
          chatStore.newSession();
          navigate(Path.Chat);
          break;
        case "focus-input":
          document.getElementById("chat-input")?.focus();
          break;
        case "show-shortcuts":
          window.dispatchEvent(new CustomEvent("llmchat:show-shortcuts"));
          break;
      }
    };

    window.addEventListener(DESKTOP_SHORTCUT_EVENT, handler);
    return () => window.removeEventListener(DESKTOP_SHORTCUT_EVENT, handler);
  }, [navigate, chatStore]);

  return null;
}
