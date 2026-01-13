/**
 * 使用虚拟滚动的聊天组件示例
 * 展示如何替换原有的分页渲染为虚拟滚动
 */
import React, { useRef, useCallback, useMemo } from "react";
import { useChatStore, useAppConfig, ChatMessage } from "../../store";
import {
  VirtualMessageList,
  VirtualMessageListRef,
} from "./VirtualMessageList";
import { copyToClipboard } from "../../utils";
import { showToast } from "../ui-lib";
import Locale from "../../locales";

interface ChatWithVirtualScrollProps {
  containerHeight?: number;
  fontSize?: number;
}

export function ChatWithVirtualScroll(props: ChatWithVirtualScrollProps) {
  const { containerHeight = 600, fontSize = 14 } = props;

  const chatStore = useChatStore();
  const config = useAppConfig();
  const session = chatStore.currentSession();
  const virtualListRef = useRef<VirtualMessageListRef>(null);

  // 获取渲染消息（替换原有的分页逻辑）
  const renderMessages = useMemo(() => {
    // 过滤掉 MCP 相关的消息（复用原有逻辑）
    const filterMcpMessages = (messages: ChatMessage[]): ChatMessage[] => {
      // 1) 先过滤掉 isMcpResponse（原始工具响应）
      const visible = messages.filter((m) => !m.isMcpResponse);
      // 2) 可以在这里添加其他过滤逻辑
      return visible;
    };

    return filterMcpMessages(session.messages).filter((msg) => {
      // 过滤掉系统消息
      if (msg.role === "system") return false;
      return true;
    });
  }, [session.messages]);

  // 消息操作处理
  const handleEditMessage = useCallback(
    (message: any) => {
      chatStore.updateTargetSession(session, (session) => {
        const index = session.messages.findIndex((m) => m.id === message.id);
        if (index >= 0) {
          session.messages[index] = { ...message };
        }
      });
    },
    [chatStore, session],
  );

  const handleDeleteMessage = useCallback(
    (message: any) => {
      chatStore.updateTargetSession(session, (session) => {
        const index = session.messages.findIndex((m) => m.id === message.id);
        if (index >= 0) {
          session.messages.splice(index, 1);
        }
      });
    },
    [chatStore, session],
  );

  const handleCopyMessage = useCallback((message: any) => {
    const textContent =
      typeof message.content === "string"
        ? message.content
        : message.content?.text || "";

    copyToClipboard(textContent);
    showToast(Locale.Copy.Success);
  }, []);

  // 滚动事件处理
  const handleScroll = useCallback((scrollTop: number, isAtBottom: boolean) => {
    // 可以在这里添加滚动相关的逻辑
    // 例如：标记消息为已读、加载更多历史消息等
    console.log(`Scroll position: ${scrollTop}, At bottom: ${isAtBottom}`);
  }, []);

  // 公开方法给父组件
  const scrollToBottom = useCallback(() => {
    virtualListRef.current?.scrollToBottom();
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    virtualListRef.current?.scrollToMessage(messageId);
  }, []);

  const getPerformanceReport = useCallback(() => {
    return virtualListRef.current?.getPerformanceReport();
  }, []);

  return (
    <div className="chat-with-virtual-scroll">
      <VirtualMessageList
        ref={virtualListRef}
        messages={renderMessages}
        containerHeight={containerHeight}
        fontSize={fontSize}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onCopy={handleCopyMessage}
        onScroll={handleScroll}
        autoScrollToBottom={true}
        overscan={5}
      />

      {/* 开发环境下的性能调试面板 */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "12px",
            zIndex: 1000,
          }}
        >
          <div>消息数量: {renderMessages.length}</div>
          <div>
            是否在底部: {virtualListRef.current?.isAtBottom ? "是" : "否"}
          </div>
          <button
            onClick={() => console.log(getPerformanceReport())}
            style={{ marginTop: "5px", fontSize: "10px" }}
          >
            输出性能报告
          </button>
        </div>
      )}
    </div>
  );
}
