/**
 * 虚拟滚动消息列表 - 优化长对话性能
 * 使用 @tanstack/react-virtual 实现高性能虚拟滚动
 */
import React, {
  useMemo,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useCallback,
} from "react";
import { ChatMessage } from "../../store";
import { MessageItem } from "./MessageItem";
import { useVirtualScroll } from "./hooks/useVirtualScroll";
import { usePerformanceMonitor } from "../../utils/performance-monitor";
import styles from "../chat.module.scss";

interface VirtualMessageListProps {
  messages: ChatMessage[];
  containerHeight?: number;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onCopy?: (message: ChatMessage) => void;
  onScroll?: (scrollTop: number, isAtBottom: boolean) => void;
  autoScrollToBottom?: boolean;
  fontSize?: number;
  overscan?: number;
}

export interface VirtualMessageListRef {
  scrollToBottom: () => void;
  scrollToMessage: (messageId: string) => void;
  isAtBottom: boolean;
  getPerformanceReport: () => any;
}

export const VirtualMessageList = forwardRef<
  VirtualMessageListRef,
  VirtualMessageListProps
>(function VirtualMessageList(props, ref) {
  const {
    messages,
    containerHeight = 600,
    onEdit,
    onDelete,
    onCopy,
    onScroll,
    autoScrollToBottom = true,
    fontSize = 14,
    overscan = 5,
  } = props;

  // 性能监控
  const { measureRender, measureScroll, measureMemory, getReport } =
    usePerformanceMonitor("VirtualMessageList");

  // 使用虚拟滚动Hook
  const {
    containerRef,
    virtualizer,
    scrollToBottom,
    scrollToMessage,
    isAtBottom,
  } = useVirtualScroll({
    messages,
    containerHeight,
    overscan,
    autoScrollToBottom,
    onScroll: (scrollTop, isAtBottom) => {
      // 测量滚动性能
      const scrollMeasurer = measureScroll();
      scrollMeasurer(scrollTop);

      // 调用原始回调
      onScroll?.(scrollTop, isAtBottom);
    },
  });

  // 创建滚动处理函数
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      // 测量滚动性能
      const scrollMeasurer = measureScroll();
      scrollMeasurer(e.currentTarget.scrollTop);

      // 调用原始回调
      if (onScroll) {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        onScroll(scrollTop, isAtBottom);
      }
    },
    [measureScroll, onScroll],
  );

  // 暴露方法给父组件
  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom,
      scrollToMessage,
      isAtBottom,
      getPerformanceReport: getReport,
    }),
    [scrollToBottom, scrollToMessage, isAtBottom, getReport],
  );

  // 获取虚拟项目
  const virtualItems = virtualizer.getVirtualItems();

  // 性能优化：只在消息变化时重新计算
  const memoizedMessages = useMemo(() => messages, [messages]);

  // 定期测量内存使用情况
  useEffect(() => {
    const interval = setInterval(() => {
      measureMemory();
    }, 10000); // 每10秒测量一次

    return () => clearInterval(interval);
  }, [measureMemory]);

  // 渲染虚拟项目（使用性能监控）
  const renderVirtualItems = useMemo(() => {
    return measureRender(() => {
      return virtualItems.map((virtualItem: any) => {
        const message = memoizedMessages[virtualItem.index];
        if (!message) return null;

        return (
          <div
            key={message.id}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            className={styles["virtual-message-item"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
              willChange: "transform",
            }}
          >
            <MessageItem
              message={message}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={onCopy}
              fontSize={fontSize}
              showActions={true}
              isContext={false}
            />
          </div>
        );
      });
    });
  }, [
    virtualItems,
    memoizedMessages,
    virtualizer.measureElement,
    onEdit,
    onDelete,
    onCopy,
    fontSize,
    measureRender,
  ]);

  return (
    <div
      ref={containerRef}
      className={styles["chat-message-list"]}
      style={{
        height: containerHeight,
        overflow: "auto",
        contain: "strict", // CSS containment 优化
        scrollBehavior: "smooth", // 平滑滚动
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {renderVirtualItems}
      </div>

      {/* 滚动到底部按钮 */}
      {!isAtBottom && messages.length > 10 && (
        <button
          className={styles["scroll-to-bottom-btn"]}
          onClick={scrollToBottom}
          title="滚动到底部"
          aria-label="滚动到底部"
        >
          ↓
        </button>
      )}
    </div>
  );
});
