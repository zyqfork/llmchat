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
  // 增加批量延迟以避免多模型并发时的冲突
  private readonly BATCH_DELAY = 100; // 100ms 批量更新延迟，更好地处理多模型并发
  // 添加最小内容长度阈值，避免过频繁的更新
  private readonly MIN_CONTENT_LENGTH = 1; // 降低阈值，确保小更新也能及时显示
  // 添加最大等待时间，避免更新延迟过长
  private readonly MAX_WAIT_TIME = 500; // 最大等待时间500ms
  private lastFlushTime = 0;

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

    // 多模型模式下的优化：更频繁的更新以确保界面响应性
    const isMultiModel = session.multiModelMode?.enabled;

    // 关键修复：多模型模式下，确保及时的状态更新
    if (isMultiModel) {
      // 多模型模式下，任何增量都立即刷新，确保按钮状态及时更新
      if (deltaLen > 0) {
        setTimeout(() => this.flushUpdates(), 5);
        return;
      }
    }

    // 非常小的增量（<=2 个字符）时，立即刷新，近似"逐字吐出"
    if (deltaLen > 0 && deltaLen <= 2) {
      // 使用微任务或最小延迟，避免阻塞当前调用栈
      setTimeout(() => this.flushUpdates(), 0);
      return;
    }

    // 普通模式下，中等增量也立即刷新
    if (deltaLen > 0 && deltaLen <= 10) {
      setTimeout(() => this.flushUpdates(), 10);
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

    const currentTime = Date.now();
    const timeSinceLastFlush = currentTime - this.lastFlushTime;

    // 关键修复：确保更新能够及时执行，避免界面延迟
    if (timeSinceLastFlush < 30) {
      // 减少延迟时间，确保关键更新能够及时反映
      setTimeout(() => {
        this.onBatchUpdate(new Map(this.pendingUpdates));
        this.pendingUpdates.clear();
        this.lastFlushTime = Date.now();
      }, 30 - timeSinceLastFlush);
    } else {
      this.onBatchUpdate(new Map(this.pendingUpdates));
      this.pendingUpdates.clear();
      this.lastFlushTime = currentTime;
    }
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
