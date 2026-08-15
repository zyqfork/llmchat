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
  // 批量延迟：流式期间把相邻 token 合并到同一个 50ms 窗口内一次性 flush，
  // 避免每 token 一次 setState 触发整棵组件树重渲染。
  private readonly BATCH_DELAY = 50;
  private lastFlushTime = 0;
  // 为每个模型维护独立的更新队列
  private modelUpdateQueues = new Map<string, any[]>();

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

    // 合并到最近的批量窗口：先清掉上一个定时器，保证同一窗口内只有一个 flush。
    // 慢速流（>20 token/s 间隔）仍会在 50ms 内显示新内容，感知延迟可忽略。
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
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
