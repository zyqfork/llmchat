"use client";

import {
  parseCompleteMarkdownCodeBlock,
  parsePartialMarkdownCodeBlock,
  useCodeBlockToHtml,
} from "@llm-ui/code";
import {
  getShikiTheme,
  llmUiHighlighter,
  resolveShikiLang,
} from "./shiki-highlighter";

export function wrapMarkdownCodeBlock(code: string, language: string) {
  return `\`\`\`${language}\n${code}\n\`\`\``;
}

export function useHighlightedCode(
  code: string,
  language: string,
  isComplete: boolean,
) {
  const markdownCodeBlock = wrapMarkdownCodeBlock(code, language);
  const parser = isComplete
    ? parseCompleteMarkdownCodeBlock
    : parsePartialMarkdownCodeBlock;

  const shikiLang = resolveShikiLang(language);

  const { html } = useCodeBlockToHtml({
    markdownCodeBlock,
    highlighter: llmUiHighlighter,
    codeToHtmlOptions: {
      theme: getShikiTheme(),
      lang: shikiLang,
    },
    parser,
  });

  return html;
}
