/**
 * 虚拟滚动消息列表 - 优化长对话性能
 */
import React, { useRef, useCallback } from "react";
import { ChatMessage } from "../../store";
import { MessageItem } from "./MessageItem";
import styles from "../chat.module.scss";

interface VirtualMessageListProps {
  messages: ChatMessage[];
  itemHeight?: number;
  containerHeight?: number;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onCopy?: (message: ChatMessage) => void;
}

export const VirtualMessageList = React.memo(function VirtualMessageList(
  props: VirtualMessageListProps,
) {
  const {
    messages,
    itemHeight = 100,
    containerHeight = 600,
    onEdit,
    onDelete,
    onCopy,
  } = props;

  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算可见范围
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endIndex = Math.min(
    messages.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 2,
  );

  const visibleMessages = messages.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;
  const totalHeight = messages.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles["chat-message-list"]}
      style={{ height: containerHeight, overflow: "auto" }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: "transform",
          }}
        >
          {visibleMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={onCopy}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
