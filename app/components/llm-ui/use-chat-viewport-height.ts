"use client";

import { useEffect, useState } from "react";

const CHAT_VIEWPORT_SELECTOR = "[data-chat-viewport]";

export function useChatViewportHeight(fallback = 480) {
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    const el = document.querySelector(
      CHAT_VIEWPORT_SELECTOR,
    ) as HTMLElement | null;
    if (!el) return;

    const update = () => {
      setHeight(el.clientHeight);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
}
