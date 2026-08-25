import { useChatStore, createMessage } from "./chat";
import { useAppConfig } from "./config";
import { createDefaultMask } from "./mask";
import {
  removeModelThinkingBudget,
  saveModelThinkingBudget,
} from "../config/model-thinking";

describe("useChatStore state management", () => {
  beforeEach(() => {
    useChatStore.getState().clearSessions();
  });

  test("initializes with default session", () => {
    const store = useChatStore.getState();
    expect(store.sessions.length).toBe(1);
    expect(store.currentSessionIndex).toBe(0);
    const session = store.currentSession();
    expect(session).toBeDefined();
    expect(session.messages).toEqual([]);
  });

  test("creates a new session and sets it as current", () => {
    const store = useChatStore.getState();
    const initialCount = store.sessions.length;

    store.newSession();
    const nextState = useChatStore.getState();

    expect(nextState.sessions.length).toBe(initialCount + 1);
    expect(nextState.currentSessionIndex).toBe(0);
  });

  test("new sessions use the model default without changing an existing session override", () => {
    const model = "o1-pro";
    const previousConfig = { ...useAppConfig.getState().modelConfig };

    try {
      useAppConfig.setState({
        modelConfig: {
          ...previousConfig,
          model: model as any,
          providerName: "openai",
          thinkingBudget: -1,
        },
      });
      saveModelThinkingBudget(model, 0);

      const store = useChatStore.getState();
      store.newSession(createDefaultMask());
      const firstSession = useChatStore.getState().currentSession();
      expect(firstSession.mask.modelConfig.thinkingBudget).toBe(0);

      store.updateTargetSession(firstSession, (session) => {
        session.mask.modelConfig.thinkingBudget = 4096;
        session.mask.syncGlobalConfig = false;
      });

      useChatStore.getState().newSession(createDefaultMask());
      const state = useChatStore.getState();
      expect(state.currentSession().mask.modelConfig.thinkingBudget).toBe(0);
      expect(
        state.sessions.find((session) => session.id === firstSession.id)?.mask
          .modelConfig.thinkingBudget,
      ).toBe(4096);
    } finally {
      removeModelThinkingBudget(model);
      useAppConfig.setState({ modelConfig: previousConfig });
    }
  });

  test("selects a session by index", () => {
    const store = useChatStore.getState();
    store.newSession();
    store.newSession();

    expect(useChatStore.getState().sessions.length).toBe(3);

    store.selectSession(1);
    expect(useChatStore.getState().currentSessionIndex).toBe(1);

    store.selectSession(2);
    expect(useChatStore.getState().currentSessionIndex).toBe(2);
  });

  test("updates target session correctly", () => {
    const store = useChatStore.getState();
    const customTopic = "Custom Topic Test";
    const current = store.currentSession();

    store.updateTargetSession(current, (session) => {
      session.topic = customTopic;
    });

    const updated = useChatStore.getState().currentSession();
    expect(updated.topic).toBe(customTopic);
  });

  test("moves session order", () => {
    const store = useChatStore.getState();
    store.newSession();
    const state1 = useChatStore.getState();
    const firstId = state1.sessions[0].id;
    const secondId = state1.sessions[1].id;

    store.moveSession(0, 1);
    const state2 = useChatStore.getState();

    expect(state2.sessions[0].id).toBe(secondId);
    expect(state2.sessions[1].id).toBe(firstId);
  });

  test("deletes a session and ensures at least one session remains", () => {
    const store = useChatStore.getState();
    store.newSession();
    expect(useChatStore.getState().sessions.length).toBe(2);

    store.deleteSession(0);
    expect(useChatStore.getState().sessions.length).toBe(1);

    // Deleting the last session recreates a new empty session
    store.deleteSession(0);
    const state = useChatStore.getState();
    expect(state.sessions.length).toBe(1);
    expect(state.sessions[0].messages).toEqual([]);
  });

  test("updates stat when adding user message", () => {
    const store = useChatStore.getState();
    const session = store.currentSession();
    const msg = createMessage({
      role: "user",
      content: "Hello testing stat",
    });

    store.updateStat(msg, session);
    const updated = useChatStore.getState().currentSession();
    expect(updated.stat.charCount).toBe("Hello testing stat".length);
  });

  test("prevents deleting pinned session", () => {
    const store = useChatStore.getState();
    store.newSession();
    const session = store.currentSession();

    store.updateTargetSession(session, (s) => {
      s.pinned = true;
    });

    store.deleteSession(0);
    // Session count remains 2 because pinned session is protected
    expect(useChatStore.getState().sessions.length).toBe(2);
  });

  test("clears messages on resetSession", () => {
    const store = useChatStore.getState();
    const session = store.currentSession();
    const msg = createMessage({
      role: "user",
      content: "Hello",
    });

    store.updateTargetSession(session, (s) => {
      s.messages.push(msg);
    });
    expect(useChatStore.getState().currentSession().messages.length).toBe(1);

    store.resetSession(useChatStore.getState().currentSession());
    expect(useChatStore.getState().currentSession().messages.length).toBe(0);
  });

  test("sets and gets lastInput", () => {
    const store = useChatStore.getState();
    store.setLastInput("draft prompt text");
    expect(useChatStore.getState().lastInput).toBe("draft prompt text");
  });
});
