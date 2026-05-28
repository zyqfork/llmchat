"use client";

import React, { useMemo } from "react";
import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
} from "@llm-ui/code";
import { markdownLookBack } from "@llm-ui/markdown";
import { MarkdownBlock } from "./markdown-block";
import { CodeBlock, MermaidBlock, mermaidLookBack } from "./code-blocks";
import {
  findCompleteMermaidBlock,
  findPartialMermaidBlock,
} from "./mermaid-matchers";
import { matchBlocksImmediate } from "./block-matching";

export function LlmMarkdownRenderer(props: {
  content: string;
  isStreamFinished: boolean;
}) {
  const { content, isStreamFinished } = props;

  const blocks = useMemo(
    () => [
      {
        component: MermaidBlock,
        findCompleteMatch: findCompleteMermaidBlock,
        findPartialMatch: findPartialMermaidBlock,
        lookBack: mermaidLookBack,
      },
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    [],
  );

  const fallbackBlock = useMemo(
    () => ({
      component: MarkdownBlock,
      lookBack: markdownLookBack(),
    }),
    [],
  );

  const blockMatches = useMemo(
    () =>
      matchBlocksImmediate({
        llmOutput: content,
        blocks,
        fallbackBlock,
        isStreamFinished,
      }),
    [content, isStreamFinished, blocks, fallbackBlock],
  );

  return (
    <>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return (
          <Component
            key={`${index}-${blockMatch.startIndex}-${blockMatch.isComplete ? "done" : "stream"}`}
            blockMatch={blockMatch}
          />
        );
      })}
    </>
  );
}
