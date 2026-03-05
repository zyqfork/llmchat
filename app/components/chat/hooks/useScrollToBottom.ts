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
  const scrollDomToBottom = useCallback(() => {
    const dom = scrollRef.current;
    if (dom) {
      requestAnimationFrame(() => {
        const targetTop = dom.scrollHeight;
        const delta = Math.abs(dom.scrollTop - targetTop);
        if (delta > 1) {
          dom.scrollTo(0, targetTop);
        }
      });
    }
  }, [scrollRef]);

  useEffect(() => {
    if (autoScroll && !detach) {
      scrollDomToBottom();
    }
  }, [autoScroll, detach, scrollTrigger, scrollDomToBottom]);

  useEffect(() => {
    if (!forceFollow || !autoScroll || detach) return;
    scrollDomToBottom();
    const duration = 800;
    const start = Date.now();
    let rafId: number;
    const tick = () => {
      if (Date.now() - start > duration) return;
      scrollDomToBottom();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [forceFollow, scrollTrigger, scrollDomToBottom, autoScroll, detach]);

  const lastMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > lastMessagesLength.current && !detach) {
      scrollDomToBottom();
    }
    lastMessagesLength.current = messages.length;
  }, [messages.length, detach, scrollDomToBottom, scrollTrigger]);

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollDomToBottom,
  };
}
