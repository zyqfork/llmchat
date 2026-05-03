import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../../store";

export function useScrollToBottom(
  scrollRef: RefObject<HTMLDivElement | null>,
  detach: boolean = false,
  messages: ChatMessage[],
  initialAutoScroll: boolean = true,
  scrollTrigger?: string,
  forceFollow: boolean = false,
) {
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);
  const settleRafRef = useRef<number | null>(null);
  const followRafRef = useRef<number | null>(null);
  const cancelPendingAutoScroll = useCallback(() => {
    if (settleRafRef.current != null) {
      cancelAnimationFrame(settleRafRef.current);
      settleRafRef.current = null;
    }
    if (followRafRef.current != null) {
      cancelAnimationFrame(followRafRef.current);
      followRafRef.current = null;
    }
  }, []);
  const autoScrollLockedRef = useRef(false);
  const lockAutoScroll = useCallback(() => {
    autoScrollLockedRef.current = true;
    cancelPendingAutoScroll();
  }, [cancelPendingAutoScroll]);
  const unlockAutoScroll = useCallback(() => {
    autoScrollLockedRef.current = false;
  }, []);
  const isAutoScrollLocked = useCallback(() => autoScrollLockedRef.current, []);
  const scrollDomToBottom = useCallback(() => {
    if (autoScrollLockedRef.current) return;
    if (settleRafRef.current != null) return;
    const dom = scrollRef.current;
    if (dom) {
      // Coalesce streaming updates: at most one bottom-alignment per frame.
      settleRafRef.current = requestAnimationFrame(() => {
        settleRafRef.current = null;
        if (autoScrollLockedRef.current) return;
        const maxTop = Math.max(0, dom.scrollHeight - dom.clientHeight);
        const delta = Math.abs(dom.scrollTop - maxTop);
        if (delta > 0.5) {
          // Pixel-smooth follow: approach bottom progressively instead of snapping.
          const direction = maxTop > dom.scrollTop ? 1 : -1;
          const easedStep = Math.max(0.8, Math.min(24, delta * 0.28));
          const nextTop = dom.scrollTop + direction * easedStep;
          if (Math.abs(maxTop - nextTop) <= 0.8) {
            dom.scrollTop = maxTop;
          } else {
            dom.scrollTop = nextTop;
            // Keep following on next frame until fully settled at bottom.
            scrollDomToBottom();
          }
        }
      });
    }
  }, [scrollRef]);

  useEffect(() => {
    if (autoScroll && !detach && !autoScrollLockedRef.current) {
      scrollDomToBottom();
    }
  }, [autoScroll, detach, scrollTrigger, scrollDomToBottom]);

  useEffect(() => {
    if (!forceFollow || !autoScroll || detach || autoScrollLockedRef.current)
      return;
    scrollDomToBottom();
    const duration = 800;
    const start = Date.now();
    const tick = () => {
      if (Date.now() - start > duration || autoScrollLockedRef.current) {
        followRafRef.current = null;
        return;
      }
      scrollDomToBottom();
      followRafRef.current = requestAnimationFrame(tick);
    };
    followRafRef.current = requestAnimationFrame(tick);
    return cancelPendingAutoScroll;
  }, [
    forceFollow,
    scrollTrigger,
    scrollDomToBottom,
    autoScroll,
    detach,
    cancelPendingAutoScroll,
  ]);

  const lastMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (
      messages.length > lastMessagesLength.current &&
      !detach &&
      !autoScrollLockedRef.current
    ) {
      scrollDomToBottom();
    }
    lastMessagesLength.current = messages.length;
  }, [messages.length, detach, scrollDomToBottom, scrollTrigger]);

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    lockAutoScroll,
    unlockAutoScroll,
    isAutoScrollLocked,
    cancelPendingAutoScroll,
    scrollDomToBottom,
  };
}
