/**
 * 优化的消息组件 - 使用 React.memo 避免不必要的重渲染
 */
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChatMessage, useAppConfig, useChatStore } from "../../store";
import {
  getMessageImages,
  getMessageTextContent,
  isThinkingModel,
  wrapThinkingPart,
} from "../../utils";
import { IconButton } from "../button";
import { Avatar } from "../emoji";
import { MaskAvatar } from "../mask";
import Locale from "../../locales";
import styles from "../chat.module.scss";

// 动态导入Markdown组件以优化性能
const Markdown = dynamic(async () => (await import("../markdown")).Markdown, {
  loading: () => <div className={styles["loading-icon"]}>...</div>,
});

// 导入图标
import EditIcon from "../../icons/rename.svg";
import CopyIcon from "../../icons/copy.svg";
import DeleteIcon from "../../icons/clear.svg";
import LoadingIcon from "../../icons/three-dots.svg";

interface MessageItemProps {
  message: ChatMessage;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onCopy?: (message: ChatMessage) => void;
  showActions?: boolean;
  isContext?: boolean;
  fontSize?: number;
}

export const MessageItem = React.memo(
  function MessageItem(props: MessageItemProps) {
    const {
      message,
      onEdit,
      onDelete,
      onCopy,
      showActions = true,
      isContext = false,
      fontSize = 14,
    } = props;

    const config = useAppConfig();
    const chatStore = useChatStore();
    const session = chatStore.currentSession();

    // 计算显示状态
    const shouldShowActions =
      showActions &&
      !((message as any).preview || (message.content?.length ?? 0) === 0) &&
      !isContext;

    const showTyping = (message as any).preview || message.streaming;
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";

    // 获取消息内容
    const messageContent = useMemo(() => {
      if (typeof message.content === "string") {
        return message.content;
      }
      return getMessageTextContent(message);
    }, [message.content]);

    // 处理思考模型的内容
    const processedContent = useMemo(() => {
      if (isAssistant && isThinkingModel(message.modelKey || "")) {
        return wrapThinkingPart(messageContent);
      }
      return messageContent;
    }, [messageContent, message.modelKey, isAssistant]);

    // 获取消息图片
    const messageImages = useMemo(() => getMessageImages(message), [message]);

    // 渲染头像
    const renderAvatar = () => {
      if (isUser) {
        return <Avatar avatar={config.avatar} />;
      } else {
        return (
          <MaskAvatar
            avatar={session.mask.avatar}
            modelKey={message.modelKey}
            model={message.model}
          />
        );
      }
    };

    // 渲染操作按钮
    const renderActions = () => {
      if (!shouldShowActions) return null;

      return (
        <div className={styles["chat-message-actions"]}>
          <div className={styles["chat-input-actions"]}>
            {onCopy && (
              <IconButton
                icon={<CopyIcon />}
                onClick={() => onCopy(message)}
                title={Locale.Chat.Actions.Copy}
              />
            )}
            {onEdit && isUser && (
              <IconButton
                icon={<EditIcon />}
                onClick={() => onEdit(message)}
                title={Locale.Chat.Actions.Edit}
              />
            )}
            {onDelete && (
              <IconButton
                icon={<DeleteIcon />}
                onClick={() => onDelete(message)}
                title={Locale.Chat.Actions.Delete}
              />
            )}
          </div>
        </div>
      );
    };

    // 渲染统计信息
    const renderStats = () => {
      if (!isAssistant || !message.statistic) return null;

      const { completionTokens, totalReplyLatency } = message.statistic;
      if (!completionTokens || !totalReplyLatency) return null;

      const tps = (completionTokens / (totalReplyLatency / 1000)).toFixed(2);

      return <span className={styles["chat-message-tps"]}>{tps} tokens/s</span>;
    };

    // 渲染版本信息
    const renderVersionInfo = () => {
      if (!isAssistant || !message.versions || message.versions.length < 1) {
        return null;
      }

      const currentIndex = message.currentVersionIndex ?? 0;
      const totalVersions = (message.versions?.length ?? 0) + 1;

      return (
        <span className={styles["chat-message-version"]}>
          {currentIndex + 1}/{totalVersions}
        </span>
      );
    };

    return (
      <div
        className={`${styles["chat-message"]} ${
          isUser
            ? styles["chat-message-user"]
            : styles["chat-message-assistant"]
        }`}
      >
        <div className={styles["chat-message-container"]}>
          {/* 消息头部 */}
          <div className={styles["chat-message-header"]}>
            <div className={styles["chat-message-avatar"]}>
              {renderAvatar()}
            </div>

            {/* 编辑按钮（仅用户消息） */}
            {isUser && onEdit && (
              <div className={styles["chat-message-edit"]}>
                <IconButton
                  icon={<EditIcon />}
                  onClick={() => onEdit(message)}
                  title={Locale.Chat.Actions.Edit}
                />
              </div>
            )}

            {/* 操作按钮 */}
            {renderActions()}
          </div>

          {/* 输入状态指示器 */}
          {showTyping && (
            <div className={styles["chat-message-status"]}>
              {Locale.Chat.Typing}
            </div>
          )}

          {/* 消息内容 */}
          <div className={styles["chat-message-item"]}>
            <Markdown
              key={message.streaming ? "loading" : "done"}
              content={processedContent}
              loading={
                ((message as any).preview || message.streaming) &&
                (!message.content ||
                  (typeof message.content === "string" &&
                    message.content.length === 0)) &&
                !isUser
              }
              fontSize={fontSize}
              defaultShow={true}
            />

            {/* 单张图片显示 */}
            {messageImages.length === 1 && (
              <Image
                className={styles["chat-message-item-image"]}
                src={messageImages[0]}
                alt=""
                width={250}
                height={250}
                priority={false}
              />
            )}

            {/* 多张图片显示 */}
            {messageImages.length > 1 && (
              <div className={styles["chat-message-item-images"]}>
                {messageImages.map((image, index) => (
                  <Image
                    key={index}
                    className={styles["chat-message-item-image-multi"]}
                    src={image}
                    alt=""
                    width={120}
                    height={120}
                    priority={false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 音频播放器 */}
          {message?.audio_url && (
            <div className={styles["chat-message-audio"]}>
              <audio src={message.audio_url} controls />
            </div>
          )}

          {/* 消息底部信息 */}
          <div className={styles["chat-message-action-date"]}>
            {renderVersionInfo()}
            {renderStats()}
            {message.date && (
              <span className={styles["chat-message-date"]}>
                {new Date(message.date).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
  // 自定义比较函数 - 只在关键属性变化时重新渲染
  (prevProps, nextProps) => {
    const prev = prevProps.message;
    const next = nextProps.message;

    return (
      prev.id === next.id &&
      prev.content === next.content &&
      prev.isError === next.isError &&
      prev.streaming === next.streaming &&
      (prev as any).preview === (next as any).preview &&
      prev.date === next.date &&
      prev.currentVersionIndex === next.currentVersionIndex &&
      prevProps.fontSize === nextProps.fontSize &&
      prevProps.showActions === nextProps.showActions &&
      prevProps.isContext === nextProps.isContext
    );
  },
);
