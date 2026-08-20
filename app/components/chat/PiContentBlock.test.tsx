/* eslint-disable @next/next/no-img-element */
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PiContentBlock } from "./PiContentBlock";

// Mock LLMMessageContent to avoid pulling in the full markdown stack
jest.mock("./LLMMessageContent", () => ({
  LLMMessageContent: ({ content }: { content: string }) => (
    <div data-testid="llm-content">{content}</div>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img alt="" {...props} />,
}));

const mockScrollRef = { current: null } as any;

const baseProps = {
  isStreamFinished: true,
  fontSize: 14,
  fontFamily: "system-ui",
  scrollRef: mockScrollRef,
  index: 0,
  totalMessages: 1,
};

describe("PiContentBlock", () => {
  test("renders text block as markdown", () => {
    const { container } = render(
      <PiContentBlock {...baseProps} block={{ type: "text", text: "Hello" }} />,
    );
    expect(container.textContent).toContain("Hello");
  });

  test("renders thinking block with think collapse style", () => {
    const { container } = render(
      <PiContentBlock
        {...baseProps}
        block={{ type: "thinking", thinking: "reasoning..." }}
      />,
    );
    // 与流式 Markdown 渲染一致：使用 antd Collapse（think-collapse）而非 details
    const collapse = container.querySelector(".ant-collapse");
    expect(collapse).toBeInTheDocument();
    // 默认折叠：标题可见，思考正文在展开后渲染（antd Collapse 懒渲染）
    expect(container.textContent).toContain("Content of Thought");
    const header = collapse?.querySelector(".ant-collapse-header");
    expect(header).toBeInTheDocument();
  });

  test("renders toolCall block with name and arguments", () => {
    const { container } = render(
      <PiContentBlock
        {...baseProps}
        block={{
          type: "toolCall",
          id: "call_1",
          name: "mcp_demo_weather",
          arguments: { city: "Shanghai" },
        }}
      />,
    );
    expect(container.textContent).toContain("weather");
    expect(container.textContent).toContain("Shanghai");
  });

  test("renders redacted thinking with notice", () => {
    const { container } = render(
      <PiContentBlock
        {...baseProps}
        block={{ type: "thinking", thinking: "", redacted: true }}
      />,
    );
    expect(container.textContent).toContain("已屏蔽");
  });

  test("renders image block", () => {
    const { container } = render(
      <PiContentBlock
        {...baseProps}
        block={{ type: "image", data: "abc", mimeType: "image/png" }}
      />,
    );
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("src")).toBe("data:image/png;base64,abc");
  });

  test("falls back to JSON for unknown block types", () => {
    const { container } = render(
      <PiContentBlock
        {...baseProps}
        block={{ type: "unknown", foo: "bar" }}
      />,
    );
    expect(container.textContent).toContain("Unknown");
    expect(container.textContent).toContain("foo");
  });
});