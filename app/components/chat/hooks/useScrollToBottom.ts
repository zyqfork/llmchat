import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../../store";

export function useScrollToBottom(
  scrollRef: RefObject<HTMLDivElement>,
  detach: boolean = false,
  messages: ChatMessage[],
  initialAutoScroll: boolean = true,
  scrollTrigger?: string,
  forceFollow: boolean = false,
) {
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);
  const settleRaf1Ref = useRef<number | null>(null);
  const settleRaf2Ref = useRef<number | null>(null);
  const followRafRef = useRef<number | null>(null);
  const cancelPendingAutoScroll = useCallback(() => {
    if (settleRaf1Ref.current != null) {
      cancelAnimationFrame(settleRaf1Ref.current);
      settleRaf1Ref.current = null;
    }
    if (settleRaf2Ref.current != null) {
      cancelAnimationFrame(settleRaf2Ref.current);
      settleRaf2Ref.current = null;
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
    const dom = scrollRef.current;
    if (dom) {
      // 双 rAF：等 React 提交 + 浏览器布局后再读 scrollHeight，避免流式时读到旧高度
      settleRaf1Ref.current = requestAnimationFrame(() => {
        settleRaf2Ref.current = requestAnimationFrame(() => {
          settleRaf1Ref.current = null;
          settleRaf2Ref.current = null;
          if (autoScrollLockedRef.current) return;
          const targetTop = dom.scrollHeight;
          const delta = Math.abs(dom.scrollTop + dom.clientHeight - targetTop);
          if (delta > 1) {
            dom.scrollTo(0, targetTop);
          }
        });
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
  }, [forceFollow, scrollTrigger, scrollDomToBottom, autoScroll, detach]);

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
