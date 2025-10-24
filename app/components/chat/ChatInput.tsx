/**
 * 优化的聊天输入组件 - 使用 useCallback 缓存事件处理器
 */
import React, { useCallback, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "../chat.module.scss";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  isStreaming?: boolean;
}

export const ChatInput = React.memo(function ChatInput(props: ChatInputProps) {
  const {
    value,
    onChange,
    onSend,
    onStop,
    disabled,
    placeholder,
    isStreaming,
  } = props;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 使用 useCallback 缓存事件处理器
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (!disabled && !isStreaming) {
          onSend();
        }
      }
    },
    [disabled, isStreaming, onSend],
  );

  // 防抖的自动调整高度
  const debouncedAutoResize = useDebouncedCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, 100);

  React.useEffect(() => {
    debouncedAutoResize();
  }, [value, debouncedAutoResize]);

  return (
    <div className={styles["chat-input-container"]}>
      <textarea
        ref={textareaRef}
        className={styles["chat-input"]}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
      />
      <div className={styles["chat-input-actions"]}>
        {isStreaming ? (
          <button
            className={styles["chat-input-send"]}
            onClick={onStop}
            disabled={disabled}
          >
            停止
          </button>
        ) : (
          <button
            className={styles["chat-input-send"]}
            onClick={onSend}
            disabled={disabled || !value.trim()}
          >
            发送
          </button>
        )}
      </div>
    </div>
  );
});
