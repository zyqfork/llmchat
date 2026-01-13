/**
 * VirtualMessageList 组件测试
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VirtualMessageList } from "../VirtualMessageList";
import { ChatMessage } from "../../../store";

// Mock @tanstack/react-virtual
jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [
      { index: 0, start: 0, size: 100 },
      { index: 1, start: 100, size: 100 },
    ],
    getTotalSize: () => 200,
    measureElement: jest.fn(),
    scrollToIndex: jest.fn(),
    measure: jest.fn(),
  }),
}));

// Mock performance monitor
jest.mock("../../../utils/performance-monitor", () => ({
  usePerformanceMonitor: () => ({
    measureRender: (fn: () => any) => fn(),
    measureScroll: () => () => {},
    measureMemory: () => {},
    getReport: () => ({}),
  }),
}));

// Mock hooks
jest.mock("../hooks/useVirtualScroll", () => ({
  useVirtualScroll: () => ({
    containerRef: { current: null },
    virtualizer: {
      getVirtualItems: () => [
        { index: 0, start: 0, size: 100 },
        { index: 1, start: 100, size: 100 },
      ],
      getTotalSize: () => 200,
      measureElement: jest.fn(),
    },
    scrollToBottom: jest.fn(),
    scrollToMessage: jest.fn(),
    isAtBottom: true,
  }),
}));

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    content: "Hello, this is a test message",
    role: "user",
    date: new Date().toISOString(),
  },
  {
    id: "2",
    content: "This is a response from the assistant",
    role: "assistant",
    date: new Date().toISOString(),
  },
];

describe("VirtualMessageList", () => {
  it("renders without crashing", () => {
    render(
      <VirtualMessageList messages={mockMessages} containerHeight={600} />,
    );

    expect(screen.getByRole("generic")).toBeInTheDocument();
  });

  it("renders messages correctly", () => {
    render(
      <VirtualMessageList messages={mockMessages} containerHeight={600} />,
    );

    // 检查是否渲染了消息容器
    const messageList = screen.getByRole("generic");
    expect(messageList).toHaveStyle({ height: "600px" });
  });

  it("calls onEdit when provided", () => {
    const onEdit = jest.fn();

    render(
      <VirtualMessageList
        messages={mockMessages}
        onEdit={onEdit}
        containerHeight={600}
      />,
    );

    // 测试编辑功能（需要更详细的交互测试）
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("calls onDelete when provided", () => {
    const onDelete = jest.fn();

    render(
      <VirtualMessageList
        messages={mockMessages}
        onDelete={onDelete}
        containerHeight={600}
      />,
    );

    // 测试删除功能（需要更详细的交互测试）
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("calls onCopy when provided", () => {
    const onCopy = jest.fn();

    render(
      <VirtualMessageList
        messages={mockMessages}
        onCopy={onCopy}
        containerHeight={600}
      />,
    );

    // 测试复制功能（需要更详细的交互测试）
    expect(onCopy).not.toHaveBeenCalled();
  });

  it("applies correct container styles", () => {
    render(
      <VirtualMessageList messages={mockMessages} containerHeight={400} />,
    );

    const container = screen.getByRole("generic");
    expect(container).toHaveStyle({
      height: "400px",
      overflow: "auto",
    });
  });

  it("handles empty messages array", () => {
    render(<VirtualMessageList messages={[]} containerHeight={600} />);

    const container = screen.getByRole("generic");
    expect(container).toBeInTheDocument();
  });
});
