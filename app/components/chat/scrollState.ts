/**
 * 会话滚动状态持久化：内存 + localStorage
 *
 * localStorage 写入做了节流（首写立即落盘，后续写合并到 500ms 内的最后一次），
 * 避免滚动高频事件触发同步 JSON.stringify + setItem 导致掉帧。
 */
import { safeLocalStorage } from "@/app/utils";

export type SessionScrollState = {
  scrollTop: number;
  bottomOffset: number;
  msgRenderIndex: number;
  hitBottom: boolean;
};

const SESSION_SCROLL_STATE_KEY = (sessionId: string) =>
  `session_scroll_state_${sessionId}`;

const storage = safeLocalStorage();

const WRITE_THROTTLE_MS = 500;

// 尚未落盘的待写状态（保持最新值，节流窗口内只写一次）
const pendingWrites = new Map<string, SessionScrollState>();
// 各会话最近一次实际写入的时间
const lastWriteTime = new Map<string, number>();
const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const sessionScrollStateMap = new Map<string, SessionScrollState>();

function writeToStorage(sessionId: string, state: SessionScrollState) {
  try {
    storage.setItem(
      SESSION_SCROLL_STATE_KEY(sessionId),
      JSON.stringify(state),
    );
    lastWriteTime.set(sessionId, Date.now());
  } catch {
    // ignore storage write failures
  }
}

function schedulePersist(sessionId: string, state: SessionScrollState) {
  pendingWrites.set(sessionId, state);
  const now = Date.now();
  const last = lastWriteTime.get(sessionId) ?? 0;
  const elapsed = now - last;

  if (elapsed >= WRITE_THROTTLE_MS) {
    if (persistTimers.has(sessionId)) {
      clearTimeout(persistTimers.get(sessionId));
      persistTimers.delete(sessionId);
    }
    pendingWrites.delete(sessionId);
    writeToStorage(sessionId, state);
    return;
  }

  const existing = persistTimers.get(sessionId);
  if (existing) {
    clearTimeout(existing);
  }
  persistTimers.set(
    sessionId,
    setTimeout(() => {
      persistTimers.delete(sessionId);
      const latest = pendingWrites.get(sessionId);
      pendingWrites.delete(sessionId);
      if (latest) {
        writeToStorage(sessionId, latest);
      }
    }, WRITE_THROTTLE_MS - elapsed),
  );
}

export function getPersistedSessionScrollState(
  sessionId: string,
): SessionScrollState | undefined {
  try {
    const raw = storage.getItem(SESSION_SCROLL_STATE_KEY(sessionId));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as SessionScrollState;
    if (
      typeof parsed?.scrollTop !== "number" ||
      typeof parsed?.bottomOffset !== "number" ||
      typeof parsed?.msgRenderIndex !== "number" ||
      typeof parsed?.hitBottom !== "boolean"
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export function persistSessionScrollState(
  sessionId: string,
  state: SessionScrollState,
) {
  schedulePersist(sessionId, state);
}

/** 强制把所有待写状态立即落盘（页面隐藏/关闭时调用） */
export function flushPendingSessionScrollStates() {
  persistTimers.forEach((timer) => clearTimeout(timer));
  persistTimers.clear();
  pendingWrites.forEach((state, sessionId) => {
    writeToStorage(sessionId, state);
  });
  pendingWrites.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushPendingSessionScrollStates);
}