/**
 * 会话滚动状态持久化：内存 + localStorage
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

const localStorage = safeLocalStorage();

export const sessionScrollStateMap = new Map<string, SessionScrollState>();

export function getPersistedSessionScrollState(
  sessionId: string,
): SessionScrollState | undefined {
  try {
    const raw = localStorage.getItem(SESSION_SCROLL_STATE_KEY(sessionId));
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
  try {
    localStorage.setItem(
      SESSION_SCROLL_STATE_KEY(sessionId),
      JSON.stringify(state),
    );
  } catch {
    // ignore storage write failures
  }
}
