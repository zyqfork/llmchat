import React, { useState } from "react";
import Image from "next/image";
import { LLMMessageContent } from "./LLMMessageContent";
import styles from "../chat.module.scss";

interface PiContentBlockProps {
  block: Record<string, any>;
  isStreamFinished: boolean;
  fontSize: number;
  fontFamily: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  index: number;
  totalMessages: number;
  isUserMessage?: boolean;
}

/**
 * Renders a single structured content block from Pi's assistant message.
 * Supports: text, thinking, toolCall, image.
 */
export function PiContentBlock({
  block,
  isStreamFinished,
  fontSize,
  fontFamily,
  scrollRef,
  index,
  totalMessages,
  isUserMessage = false,
}: PiContentBlockProps) {
  const [expanded, setExpanded] = useState(false);

  switch (block.type) {
    case "text":
      return (
        <LLMMessageContent
          content={block.text ?? ""}
          isStreamFinished={isStreamFinished}
          fontSize={fontSize}
          fontFamily={fontFamily}
          parentRef={scrollRef}
          defaultShow={index >= totalMessages - 6}
          isUserMessage={isUserMessage}
        />
      );

    case "thinking":
      return (
        <PiThinkingBlock
          thinking={block.thinking ?? ""}
          redacted={block.redacted}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      );

    case "toolCall":
      return (
        <PiToolCallBlock
          toolCall={block}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      );

    case "image":
      return (
        <div className={styles["pi-content-image"]}>
          <Image
            src={`data:${block.mimeType};base64,${block.data}`}
            alt="content"
            width={512}
            height={512}
            style={{ maxWidth: "100%", borderRadius: 8, height: "auto" }}
          />
        </div>
      );

    default:
      // Fallback: render unknown blocks as JSON
      return (
        <details className={styles["mcp-tool-call"]}>
          <summary>Unknown content block type: {block.type}</summary>
          <pre>
            <code>{JSON.stringify(block, null, 2)}</code>
          </pre>
        </details>
      );
  }
}

function PiThinkingBlock({
  thinking,
  redacted,
  expanded,
  onToggle,
}: {
  thinking: string;
  redacted?: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (redacted) {
    return (
      <details className={styles["pi-thinking-block"]} open={expanded}>
        <summary
          className={styles["pi-thinking-summary"]}
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
        >
          <span className={styles["pi-thinking-title"]}>
            🔒 思考内容已屏蔽
          </span>
        </summary>
        <div className={styles["pi-thinking-body"]}>
          <span className={styles["pi-thinking-notice"]}>
            此思考内容已被安全过滤器屏蔽。已保留加密载荷以维持多轮对话连续性。
          </span>
        </div>
      </details>
    );
  }

  return (
    <details className={styles["pi-thinking-block"]} open={expanded}>
      <summary
        className={styles["pi-thinking-summary"]}
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
      >
        <span className={styles["pi-thinking-title"]}>🤔 思考过程</span>
        <span className={styles["pi-thinking-count"]}>
          {thinking.length > 0 ? `${thinking.length} 字符` : ""}
        </span>
      </summary>
      <div className={styles["pi-thinking-body"]}>
        <pre className={styles["pi-thinking-text"]}>{thinking}</pre>
      </div>
    </details>
  );
}

function PiToolCallBlock({
  toolCall,
  expanded,
  onToggle,
}: {
  toolCall: Record<string, any>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const name = toolCall.name || "unknown";
  const args = toolCall.arguments || {};

  // Parse MCP-style tool names: mcp_<clientId>_<toolName>
  let clientName = "";
  let toolName = name;
  if (name.startsWith("mcp_")) {
    const withoutPrefix = name.slice(4);
    const firstUnderscore = withoutPrefix.indexOf("_");
    if (firstUnderscore >= 0) {
      clientName = withoutPrefix.substring(0, firstUnderscore);
      toolName = withoutPrefix.substring(firstUnderscore + 1);
    }
  }

  return (
    <details
      className={styles["mcp-tool-call"]}
      open={expanded}
    >
      <summary
        className={styles["mcp-tool-call-summary"]}
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
      >
        <span className={styles["mcp-tool-call-title"]}>
          {clientName}
          {clientName && toolName ? " / " : ""}
          {toolName}
        </span>
        <span className={styles["mcp-tool-call-desc"]}>Tool Call</span>
      </summary>
      <div className={styles["mcp-tool-call-body"]}>
        <div className={styles["mcp-tool-call-line"]}>
          <span className={styles["mcp-tool-call-key"]}>arguments</span>
          <pre className={styles["mcp-tool-call-value"]}>
            <code>{JSON.stringify(args, null, 2)}</code>
          </pre>
        </div>
        {toolCall.id && (
          <div className={styles["mcp-tool-call-line"]}>
            <span className={styles["mcp-tool-call-key"]}>id</span>
            <pre className={styles["mcp-tool-call-value"]}>
              <code>{toolCall.id}</code>
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}