/**
 * 高级虚拟滚动Hook - 提供更好的性能优化和用户体验
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChatMessage } from "../../../store";
import { getMessageTextContent } from "../../../utils";

interface UseVirtualScrollOptions {
  messages: ChatMessage[];
  containerHeight?: number;
  overscan?: number;
  autoScrollToBottom?: boolean;
  onScroll?: (scrollTop: number, isAtBottom: boolean) => void;
}

interface VirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement>;
  virtualizer: any; // 使用any来避免复杂的类型问题
  scrollToBottom: () => void;
  scrollToMessage: (messageId: string) => void;
  isAtBottom: boolean;
}

export function useVirtualScroll(
  options: UseVirtualScrollOptions,
): VirtualScrollResult {
  const {
    messages,
    containerHeight = 600,
    overscan = 5,
    autoScrollToBottom = true,
    onScroll,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastMessageCountRef = useRef(messages.length);

  // 智能高度估算 - 基于消息类型和内容
  const estimateSize = useCallback(
    (index: number) => {
      const message = messages[index];
      if (!message) return 100;

      const isUser = message.role === "user";

      // 获取消息文本内容
      let contentText = "";
      if (typeof message.content === "string") {
        contentText = message.content;
      } else if (message.content) {
        contentText = getMessageTextContent(message);
      }

      const contentLength = contentText.length;
      const hasImages = contentText.includes("![") || false;
      const hasCode = contentText.includes("```") || false;
      const hasTable = contentText.includes("|") || false;

      let estimatedHeight = isUser ? 60 : 80; // 基础高度

      // 文本内容高度估算（更精确）
      const lines = Math.ceil(contentLength / (isUser ? 60 : 80)); // 用户消息通常更短
      estimatedHeight += lines * 24; // 每行24px

      // 特殊内容类型的额外高度
      if (hasImages) {
        const imageCount = (contentText.match(/!\[.*?\]/g) || []).length;
        estimatedHeight += imageCount * 200;
      }

      if (hasCode) {
        const codeBlocks = (contentText.match(/```/g) || []).length / 2;
        estimatedHeight += codeBlocks * 120;
      }

      if (hasTable) {
        const tableRows = (contentText.match(/\|.*\|/g) || []).length;
        estimatedHeight += tableRows * 30;
      }

      // 流式消息的额外空间
      if (message.streaming) {
        estimatedHeight += 40;
      }

      // 高度范围限制
      return Math.max(60, Math.min(estimatedHeight, 1000));
    },
    [messages],
  );

  // 创建虚拟化器
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan,
    measureElement: (element) => {
      // 使用ResizeObserver进行精确测量
      return element?.getBoundingClientRect().height ?? estimateSize(0);
    },
  });

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: "end",
        behavior: "smooth",
      });
    }
  }, [messages.length, virtualizer]);

  // 滚动到指定消息
  const scrollToMessage = useCallback(
    (messageId: string) => {
      const index = messages.findIndex((msg) => msg.id === messageId);
      if (index !== -1) {
        virtualizer.scrollToIndex(index, {
          align: "center",
          behavior: "smooth",
        });
      }
    },
    [messages, virtualizer],
  );

  // 检测是否在底部
  const checkIsAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 50; // 50px的容差
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, []);

  // 自动滚动到底部（新消息时）
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessage = currentMessageCount > lastMessageCountRef.current;

    if (hasNewMessage && autoScrollToBottom && isAtBottom) {
      // 使用requestAnimationFrame确保DOM更新后再滚动
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [messages.length, autoScrollToBottom, isAtBottom, scrollToBottom]);

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // 容器大小变化时重新计算虚拟化
      virtualizer.measure();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [virtualizer]);

  // 监听滚动事件来更新isAtBottom状态
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const newIsAtBottom = checkIsAtBottom();
      setIsAtBottom(newIsAtBottom);

      if (onScroll) {
        onScroll(container.scrollTop, newIsAtBottom);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [checkIsAtBottom, onScroll]);

  return {
    containerRef,
    virtualizer,
    scrollToBottom,
    scrollToMessage,
    isAtBottom,
  };
}
