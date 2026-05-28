"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  codeBlockLookBack,
  parseCompleteMarkdownCodeBlock,
  parsePartialMarkdownCodeBlock,
  useCodeBlockToHtml,
} from "@llm-ui/code";
import type { LLMOutputComponent } from "@llm-ui/react";
import parseHtml from "html-react-parser";
import { copyToClipboard } from "../../utils";
import { useAppConfig } from "../../store/config";
import { useChatStore } from "../../store";
import {
  getShikiTheme,
  llmUiHighlighter,
  resolveShikiLang,
} from "./shiki-highlighter";
import { HtmlPreviewPanel, MermaidPreviewPanel } from "./preview-panels";
import { getPreviewLanguage } from "./preview-utils";

export { codeBlockLookBack };

export const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const enableArtifacts =
    session.mask?.enableArtifacts !== false && config.enableArtifacts;
  const enableCodeFold =
    session.mask?.enableCodeFold !== false && config.enableCodeFold;

  const parser = blockMatch.isComplete
    ? parseCompleteMarkdownCodeBlock
    : parsePartialMarkdownCodeBlock;
  const { language, code = "" } = parser(blockMatch.output);
  const lang = language ?? "plain";
  const previewKind = getPreviewLanguage(code, language);

  const { html } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter: llmUiHighlighter,
    codeToHtmlOptions: {
      theme: getShikiTheme(),
      lang: resolveShikiLang(lang),
    },
    parser,
  });

  const [collapsed, setCollapsed] = useState(true);
  const codeRef = useRef<HTMLDivElement>(null);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      const codeHeight = codeRef.current.scrollHeight;
      setShowToggle(codeHeight > 400);
    }
  }, [html, code]);

  if (previewKind === "mermaid") {
    return (
      <MermaidPreviewPanel code={code} isStreaming={!blockMatch.isComplete} />
    );
  }

  if (previewKind === "html" && enableArtifacts) {
    return (
      <HtmlPreviewPanel code={code} isStreaming={!blockMatch.isComplete} />
    );
  }

  return (
    <div className="llm-ui-code-block">
      <div
        ref={codeRef}
        style={{
          position: "relative",
          maxHeight: enableCodeFold && collapsed ? "400px" : "none",
          overflow: enableCodeFold && collapsed ? "hidden" : "visible",
        }}
      >
        <span
          className="copy-code-button"
          onClick={() => copyToClipboard(code)}
        />
        {html ? (
          parseHtml(html)
        ) : (
          <pre>
            <code>{code}</code>
          </pre>
        )}
      </div>
      {showToggle && enableCodeFold && collapsed && (
        <div className="show-hide-button collapsed">
          <button type="button" onClick={() => setCollapsed(false)}>
            更多
          </button>
        </div>
      )}
    </div>
  );
};

export const MermaidBlock: LLMOutputComponent = ({ blockMatch }) => {
  const parser = blockMatch.isComplete
    ? parseCompleteMarkdownCodeBlock
    : parsePartialMarkdownCodeBlock;
  const { code = "" } = parser(blockMatch.output);

  return (
    <MermaidPreviewPanel code={code} isStreaming={!blockMatch.isComplete} />
  );
};

export const mermaidLookBack = codeBlockLookBack();
