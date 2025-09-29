import { ChatSession, ChatMessage } from "../store/chat";

// 流式更新优化工具
export class StreamUpdateOptimizer {
  private pendingUpdates = new Map<
    string,
    {
      session: ChatSession;
      messageId: string;
      content: string;
      lastUpdate: number;
    }
  >();

  private updateTimer: NodeJS.Timeout | null = null;
  // 降低批量延迟以获得更细粒度的“逐字”体验，同时保持性能
  private readonly BATCH_DELAY = 20; // 20ms 批量更新延迟（原为 100ms）

  constructor(private onBatchUpdate: (updates: Map<string, any>) => void) {}

  // 优化的流式内容更新
  updateStreamingMessage(
    sessionId: string,
    messageId: string,
    content: string,
    session: ChatSession,
  ) {
    const key = `${sessionId}-${messageId}`;

    // 计算与上次缓存内容的增量长度
    const prev = this.pendingUpdates.get(key)?.content ?? "";
    const deltaLen = Math.max(0, content.length - prev.length);

    // 缓存更新
    this.pendingUpdates.set(key, {
      session,
      messageId,
      content,
      lastUpdate: Date.now(),
    });

    // 防抖批量更新
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    // 非常小的增量（<=2 个字符）时，立即刷新，近似“逐字吐出”
    if (deltaLen > 0 && deltaLen <= 2) {
      // 使用微任务或最小延迟，避免阻塞当前调用栈
      setTimeout(() => this.flushUpdates(), 0);
      return;
    }

    this.updateTimer = setTimeout(() => {
      this.flushUpdates();
    }, this.BATCH_DELAY);
  }

  // 立即刷新更新（在流结束时调用）
  flushUpdates() {
    if (this.pendingUpdates.size === 0) return;

    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    this.onBatchUpdate(new Map(this.pendingUpdates));
    this.pendingUpdates.clear();
  }

  // 清理资源
  destroy() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.pendingUpdates.clear();
  }
}

// 轻量级消息更新工具
export function createLightweightMessageUpdate(
  session: ChatSession,
  messageIndex: number,
  newContent: string,
): Partial<ChatSession> {
  // 避免深拷贝，只创建必要的浅拷贝
  const newMessages = [...session.messages];
  const targetMessage = { ...newMessages[messageIndex] };
  targetMessage.content = newContent;
  newMessages[messageIndex] = targetMessage;

  return {
    messages: newMessages,
    lastUpdate: Date.now(),
  };
}

// 优化的状态合并工具
export function mergeSessionUpdates(
  baseSession: ChatSession,
  ...updates: Partial<ChatSession>[]
): ChatSession {
  let result = baseSession;

  for (const update of updates) {
    result = { ...result, ...update };
  }

  return result;
}
