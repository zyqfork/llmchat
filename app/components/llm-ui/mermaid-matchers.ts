import { regexMatcher } from "@llm-ui/shared";
import type { LLMOutputMatcher } from "@llm-ui/react";

export const findCompleteMermaidBlock: LLMOutputMatcher = regexMatcher(
  /```mermaid\s*\n?([\s\S]*?)```/,
);

export const findPartialMermaidBlock: LLMOutputMatcher = (llmOutput) => {
  const fenceIndex = llmOutput.lastIndexOf("```mermaid");
  if (fenceIndex === -1) {
    return undefined;
  }
  const tail = llmOutput.slice(fenceIndex);
  if (/```mermaid\s*\n[\s\S]*?```/.test(tail)) {
    return undefined;
  }
  return {
    startIndex: fenceIndex,
    endIndex: llmOutput.length,
    outputRaw: tail,
  };
};
