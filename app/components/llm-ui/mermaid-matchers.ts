import { regexMatcher } from "@llm-ui/shared";
import type { LLMOutputMatcher } from "@llm-ui/react";
import { MERMAID_KEYWORDS } from "./preview-lang-map";

const ALL_MERMAID_LANGS = ["mermaid", ...MERMAID_KEYWORDS];
const LANGS_PATTERN = ALL_MERMAID_LANGS.join("|");

export const findCompleteMermaidBlock: LLMOutputMatcher = regexMatcher(
  new RegExp(`\`\`\`(${LANGS_PATTERN})\\s*\\n?([\\s\\S]*?)\`\`\``, "i"),
);

export const findPartialMermaidBlock: LLMOutputMatcher = (llmOutput) => {
  let lastIndex = -1;
  let matchedLang = "";

  for (const lang of ALL_MERMAID_LANGS) {
    const idx = llmOutput
      .toLowerCase()
      .lastIndexOf(`\`\`\`${lang.toLowerCase()}`);
    if (idx > lastIndex) {
      lastIndex = idx;
      matchedLang = lang;
    }
  }

  if (lastIndex === -1) {
    return undefined;
  }

  const tail = llmOutput.slice(lastIndex);
  const completeRegex = new RegExp(
    `^\`\`\`${matchedLang}\\s*\\n[\\s\\S]*?\`\`\``,
    "i",
  );
  if (completeRegex.test(tail)) {
    return undefined;
  }

  return {
    startIndex: lastIndex,
    endIndex: llmOutput.length,
    outputRaw: tail,
  };
};
