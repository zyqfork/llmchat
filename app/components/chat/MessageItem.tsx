/**
 * 优化的消息组件 - 使用 React.memo 避免不必要的重渲染
 */
import React from "react";
import { ChatMessage } from "../../store";
import styles from "../chat.module.scss";

interface MessageItemProps {
  message: ChatMessage;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onCopy?: (message: ChatMessage) => void;
}

export const MessageItem = React.memo(
  function MessageItem(props: MessageItemProps) {
    const { message, onEdit, onDelete, onCopy } = props;

    return (
      <div className={styles["chat-message"]}>
        {/* 消息内容渲染逻辑 */}
        {/* TODO: 从 chat.tsx 迁移消息渲染逻辑 */}
      </div>
    );
  },
  // 自定义比较函数 - 只在消息内容变化时重新渲染
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.isError === nextProps.message.isError &&
      prevProps.message.streaming === nextProps.message.streaming
    );
  },
);
