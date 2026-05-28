import type {
  BlockMatch,
  LLMOutputBlock,
  LLMOutputFallbackBlock,
  LLMOutputMatch,
} from "@llm-ui/react";

type InternalMatch = {
  block: LLMOutputBlock | LLMOutputFallbackBlock;
  match: LLMOutputMatch;
  llmOutput: string;
  isComplete: boolean;
  priority: number;
};

function isOverlapping(match1: LLMOutputMatch, match2: LLMOutputMatch) {
  return (
    (match1.startIndex >= match2.startIndex &&
      match1.startIndex < match2.endIndex) ||
    (match1.endIndex > match2.startIndex &&
      match1.endIndex <= match2.endIndex) ||
    (match2.startIndex >= match1.startIndex &&
      match2.startIndex < match1.endIndex) ||
    (match2.endIndex > match1.startIndex && match2.endIndex <= match1.endIndex)
  );
}

function completeMatchesForBlock({
  llmOutput,
  block,
  priority,
}: {
  llmOutput: string;
  block: LLMOutputBlock;
  priority: number;
}): InternalMatch[] {
  const matches: InternalMatch[] = [];
  let index = 0;
  while (index < llmOutput.length) {
    const nextMatch = block.findCompleteMatch(llmOutput.slice(index));
    if (nextMatch) {
      matches.push({
        block,
        match: {
          outputRaw: nextMatch.outputRaw,
          startIndex: index + nextMatch.startIndex,
          endIndex: index + nextMatch.endIndex,
        },
        llmOutput,
        isComplete: true,
        priority,
      });
      index += nextMatch.endIndex;
    } else {
      return matches;
    }
  }
  return matches;
}

function findPartialMatch({
  llmOutput,
  blocks,
  currentIndex,
}: {
  llmOutput: string;
  blocks: LLMOutputBlock[];
  currentIndex: number;
}): InternalMatch | undefined {
  for (const [priority, block] of Array.from(blocks.entries())) {
    const outputRaw = llmOutput.slice(currentIndex);
    const partialMatch = block.findPartialMatch(outputRaw);
    if (partialMatch) {
      return {
        block,
        match: {
          outputRaw: partialMatch.outputRaw,
          startIndex: partialMatch.startIndex + currentIndex,
          endIndex: partialMatch.endIndex + currentIndex,
        },
        llmOutput,
        isComplete: false,
        priority,
      };
    }
  }
  return undefined;
}

function fallbacksInGaps({
  blockMatches,
  llmOutput,
  fallbackPriority,
  fallbackBlock,
}: {
  blockMatches: InternalMatch[];
  llmOutput: string;
  fallbackPriority: number;
  fallbackBlock: LLMOutputFallbackBlock;
}): InternalMatch[] {
  const fallbacks: InternalMatch[] = [];

  blockMatches.forEach((match, index) => {
    const previousMatchEndIndex =
      index === 0 ? 0 : blockMatches[index - 1].match.endIndex;
    if (previousMatchEndIndex < match.match.startIndex) {
      const outputRaw = llmOutput.slice(
        previousMatchEndIndex,
        match.match.startIndex,
      );
      fallbacks.push({
        block: fallbackBlock,
        match: {
          startIndex: previousMatchEndIndex,
          endIndex: match.match.startIndex,
          outputRaw,
        },
        priority: fallbackPriority,
        llmOutput,
        isComplete: true,
      });
    }
  });

  const lastMatchEndIndex =
    blockMatches.length > 0
      ? blockMatches[blockMatches.length - 1].match.endIndex
      : 0;
  if (lastMatchEndIndex < llmOutput.length) {
    const outputRaw = llmOutput.slice(lastMatchEndIndex, llmOutput.length);
    fallbacks.push({
      block: fallbackBlock,
      match: {
        startIndex: lastMatchEndIndex,
        endIndex: llmOutput.length,
        outputRaw,
      },
      priority: fallbackPriority,
      llmOutput,
      isComplete: false,
    });
  }

  return fallbacks;
}

function matchesWithLookback({
  matches,
  isStreamFinished,
}: {
  matches: InternalMatch[];
  isStreamFinished: boolean;
}): BlockMatch[] {
  return matches.reduce<BlockMatch[]>((acc, match, index) => {
    const isLastMatch = index === matches.length - 1;
    const isComplete = !isLastMatch || isStreamFinished;
    const { output, visibleText } = match.block.lookBack({
      isComplete,
      visibleTextLengthTarget: Number.MAX_SAFE_INTEGER,
      isStreamFinished,
      output: match.match.outputRaw,
    });

    return [
      ...acc,
      {
        ...match.match,
        isComplete,
        block: match.block,
        priority: match.priority,
        llmOutput: match.llmOutput,
        output,
        visibleText,
        isVisible: visibleText.length > 0,
      },
    ];
  }, []);
}

/** 直接匹配全部内容，无 rAF 节流，跟随接口吐字速度 */
export function matchBlocksImmediate({
  llmOutput,
  blocks,
  fallbackBlock,
  isStreamFinished,
}: {
  llmOutput: string;
  blocks: LLMOutputBlock[];
  fallbackBlock: LLMOutputFallbackBlock;
  isStreamFinished: boolean;
}): BlockMatch[] {
  const allCompleteMatches = blocks.flatMap((block, priority) =>
    completeMatchesForBlock({ llmOutput, block, priority }),
  );

  const matches = allCompleteMatches
    .filter((match) => {
      const higherPriorityMatches = allCompleteMatches.filter(
        (m) => m.priority < match.priority,
      );
      return !higherPriorityMatches.some((m) =>
        isOverlapping(m.match, match.match),
      );
    })
    .sort((a, b) => a.match.startIndex - b.match.startIndex);

  const lastMatchEndIndex =
    matches.length > 0 ? matches[matches.length - 1].match.endIndex : 0;

  if (!isStreamFinished) {
    const partialMatch = findPartialMatch({
      llmOutput,
      currentIndex: lastMatchEndIndex,
      blocks,
    });
    if (partialMatch) {
      matches.push(partialMatch);
    }
  }

  const fallBacks = fallbacksInGaps({
    blockMatches: matches,
    llmOutput,
    fallbackPriority: blocks.length,
    fallbackBlock,
  });
  matches.push(...fallBacks);
  matches.sort((a, b) => a.match.startIndex - b.match.startIndex);

  return matchesWithLookback({ matches, isStreamFinished }).filter(
    (m) => m.isVisible,
  );
}
