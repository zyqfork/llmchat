import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThinkingPanel } from "./ThinkingPanel";

const mockSession = {
  mask: {
    syncGlobalConfig: true,
    modelConfig: {
      model: "o1-pro",
      providerName: "openai",
      thinkingBudget: -1,
    },
  },
};

const mockUpdateTargetSession = jest.fn(
  (session: typeof mockSession, updater: (value: typeof mockSession) => void) =>
    updater(session),
);

jest.mock("../../icons/close.svg", () => ({
  __esModule: true,
  default: () => <span aria-hidden="true">×</span>,
}));

jest.mock("../../store", () => ({
  useChatStore: () => ({
    currentSession: () => mockSession,
    updateTargetSession: mockUpdateTargetSession,
  }),
}));

jest.mock("../../config/model-config", () => ({
  getModelThinkingOptions: () => [
    { level: "dynamic", value: -1 },
    { level: "off", value: 0 },
  ],
}));

jest.mock("../../locales", () => ({
  __esModule: true,
  default: {
    Chat: {
      Thinking: {
        Title: "思考深度",
        Dynamic: "动态思考",
        DynamicDesc: "自动决定",
        Off: "关闭思考",
        OffDesc: "不进行思考",
        Light: "轻度思考",
        LightDesc: "",
        Medium: "中度思考",
        MediumDesc: "",
        Deep: "深度思考",
        DeepDesc: "",
        VeryDeep: "极深思考",
        VeryDeepDesc: "",
        Notice: "提示",
      },
    },
  },
}));

describe("ThinkingPanel", () => {
  beforeEach(() => {
    mockSession.mask.syncGlobalConfig = true;
    mockSession.mask.modelConfig.thinkingBudget = -1;
    mockUpdateTargetSession.mockClear();
  });

  test("keeps a session thinking selection from being overwritten by global config", () => {
    const onClose = jest.fn();
    render(<ThinkingPanel showPanel onClose={onClose} />);

    fireEvent.click(screen.getByText("关闭思考"));

    expect(mockSession.mask.modelConfig.thinkingBudget).toBe(0);
    expect(mockSession.mask.syncGlobalConfig).toBe(false);
    expect(mockUpdateTargetSession).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
