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

  private updateTimer: ReturnType<typeof setTimeout> | null = null;
  // 固定刷新窗口：约 60 FPS，尽量与浏览器绘制节奏一致。使用 throttle
  // 而非 debounce，既避免高速 token 饿死刷新，也减少 30 FPS 的顿挫感。
  private readonly FLUSH_INTERVAL = 16;
  private lastFlushTime = Number.NEGATIVE_INFINITY;

  constructor(private onBatchUpdate: (updates: Map<string, any>) => void) {}

  // 优化的流式内容更新
  updateStreamingMessage(
    sessionId: string,
    messageId: string,
    content: string,
    session: ChatSession,
  ) {
    const key = `${sessionId}-${messageId}`;

    // 缓存更新
    this.pendingUpdates.set(key, {
      session,
      messageId,
      content,
      lastUpdate: Date.now(),
    });

    // 首个 chunk 立即显示；之后只安排一次尾随刷新。新 token 只更新
    // pendingUpdates 中的最新快照，不会推迟已经安排好的刷新时间。
    const elapsed = Date.now() - this.lastFlushTime;
    if (elapsed >= this.FLUSH_INTERVAL) {
      this.flushUpdates();
    } else {
      this.scheduleFlush(this.FLUSH_INTERVAL - elapsed);
    }
  }

  private scheduleFlush(delay: number) {
    if (this.updateTimer) return;

    this.updateTimer = setTimeout(() => {
      this.updateTimer = null;
      this.flushUpdates();
    }, Math.max(0, delay));
  }

  // 立即刷新更新（流结束、停止或报错时调用）
  flushUpdates() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.pendingUpdates.size === 0) return;

    // 先清空共享队列再回调，避免回调期间进入的新更新被误清除。
    const updates = new Map(this.pendingUpdates);
    this.pendingUpdates.clear();
    this.lastFlushTime = Date.now();
    this.onBatchUpdate(updates);

    // 回调期间若产生了新内容，继续按固定窗口安排，不丢失更新。
    if (this.pendingUpdates.size > 0) {
      this.scheduleFlush(this.FLUSH_INTERVAL);
    }
  }

  // 清理资源
  destroy() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    this.pendingUpdates.clear();
    this.lastFlushTime = Number.NEGATIVE_INFINITY;
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
