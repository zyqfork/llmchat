"use client";

import React from "react";
import {
  codeBlockLookBack,
  parseCompleteMarkdownCodeBlock,
  parsePartialMarkdownCodeBlock,
  useCodeBlockToHtml,
} from "@llm-ui/code";
import type { LLMOutputComponent } from "@llm-ui/react";
import { useAppConfig } from "../../store/config";
import { useChatStore } from "../../store";
import {
  getShikiTheme,
  llmUiHighlighter,
  resolveShikiLang,
} from "./shiki-highlighter";
import {
  CsvPreviewPanel,
  EchartsPreviewPanel,
  GraphvizPreviewPanel,
  HtmlPreviewPanel,
  MarkmapPreviewPanel,
  MermaidPreviewPanel,
  PlantUmlPreviewPanel,
  VegaPreviewPanel,
  JsonPreviewPanel,
} from "./preview-panels";
import { getPreviewLanguage } from "./preview-utils";
import { CodePreviewShell } from "./CodePreviewShell";

export { codeBlockLookBack };

export const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const enableArtifacts =
    session.mask?.enableArtifacts !== false && config.enableArtifacts;

  const parser = blockMatch.isComplete
    ? parseCompleteMarkdownCodeBlock
    : parsePartialMarkdownCodeBlock;
  const { language, code = "" } = parser(blockMatch.output);
  const lang = language ?? "plain";
  const previewKind = getPreviewLanguage(code, language);

  console.log("[CodeBlock] Rendering code block:", {
    language,
    previewKind,
    codeLength: code.length,
    isComplete: blockMatch.isComplete,
  });

  const { html } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter: llmUiHighlighter,
    codeToHtmlOptions: {
      theme: getShikiTheme(),
      lang: resolveShikiLang(lang),
    },
    parser,
  });

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
  if (previewKind === "plantuml") {
    return (
      <PlantUmlPreviewPanel code={code} isStreaming={!blockMatch.isComplete} />
    );
  }
  if (previewKind === "graphviz") {
    return (
      <GraphvizPreviewPanel code={code} isStreaming={!blockMatch.isComplete} />
    );
  }
  if (previewKind === "echarts") {
    return (
      <EchartsPreviewPanel code={code} isStreaming={!blockMatch.isComplete} />
    );
  }
  if (previewKind === "vega") {
    return (
      <VegaPreviewPanel code={code} isStreaming={!blockMatch.isComplete} />
    );
  }
  if (previewKind === "markmap") {
    return (
      <MarkmapPreviewPanel code={code} isStreaming={!blockMatch.isComplete} />
    );
  }
  if (previewKind === "csv") {
    return (
      <CsvPreviewPanel
        code={code}
        language={language}
        isStreaming={!blockMatch.isComplete}
      />
    );
  }
  if (previewKind === "json") {
    return (
      <JsonPreviewPanel code={code} isStreaming={!blockMatch.isComplete} />
    );
  }

  // 普通代码块：使用 CodePreviewShell 统一样式，不支持预览
  return (
    <CodePreviewShell
      code={code}
      highlightedHtml={html}
      isStreaming={!blockMatch.isComplete}
      isRendering={false}
      isPreviewReady={false}
      preview={null}
      showZoomControls={false}
    />
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
