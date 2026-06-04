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
import { MermaidPreviewPanel } from "./preview-panels";
import { getPreviewLanguage } from "./preview-utils";
import { CodePreviewShell } from "./CodePreviewShell";
import { PreviewCodeBlockRoute } from "./preview-code-route";

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

  const { html } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter: llmUiHighlighter,
    codeToHtmlOptions: {
      theme: getShikiTheme(),
      lang: resolveShikiLang(lang),
    },
    parser,
  });

  const canPreview =
    previewKind && !(previewKind === "html" && !enableArtifacts);

  if (canPreview) {
    return (
      <PreviewCodeBlockRoute
        previewKind={previewKind}
        code={code}
        language={language}
        isStreaming={!blockMatch.isComplete}
        enableArtifacts={enableArtifacts}
      />
    );
  }

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
