export interface SummaryInputMessage {
  role: "system" | "user" | "assistant";
  isError?: boolean;
  isCompressedContextPrompt?: boolean;
  content?: any;
  tools?: Array<{
    id: string;
    type?: string;
    function?: {
      name: string;
      arguments?: string;
    };
    content?: string;
    isError?: boolean;
    errorMsg?: string;
  }>;
}

export interface SummaryInputResult {
  userMessages: string;
  userMessageCount: number;
  userTokens: number;
}

export interface CompactionCursorState<T extends SummaryInputMessage> {
  messages: T[];
  clearContextIndex?: number;
  compressedContextIndex?: number;
  lastSummarizeIndex?: number;
  memoryPrompt?: string;
}

const TOOL_RESULT_MAX_CHARS = 2000;

export const DEFAULT_COMPACTION_SYSTEM_PROMPT = `You are a context summarization assistant. Your task is to read a conversation between a user and an AI assistant, then produce a structured summary following the exact format specified.

Do NOT continue the conversation. Do NOT respond to any questions in the conversation. ONLY output the structured summary.`;

export const DEFAULT_COMPACTION_INITIAL_PROMPT = `The messages above are a conversation to summarize. Create a structured context checkpoint summary that another LLM will use to continue the work.

Use this EXACT format:

## Goal
[What is the user trying to accomplish? Can be multiple items if the session covers different tasks.]

## Constraints & Preferences
- [Any constraints, preferences, or requirements mentioned by user]
- [Or "(none)" if none were mentioned]

## Progress
### Done
- [x] [Completed tasks/changes]

### In Progress
- [ ] [Current work]

### Blocked
- [Issues preventing progress, if any]

## Key Decisions
- **[Decision]**: [Brief rationale]

## Next Steps
1. [Ordered list of what should happen next]

## Critical Context
- [Any data, examples, or references needed to continue]
- [Or "(none)" if not applicable]

Keep each section concise. Preserve exact file paths, function names, and error messages.`;

export const DEFAULT_COMPACTION_UPDATE_PROMPT = `The messages above are NEW conversation messages to incorporate into the existing summary provided in <previous-summary> tags.

Update the existing structured summary with new information. RULES:
- PRESERVE all existing information from the previous summary
- ADD new progress, decisions, and context from the new messages
- UPDATE the Progress section: move items from "In Progress" to "Done" when completed
- UPDATE "Next Steps" based on what was accomplished
- PRESERVE exact file paths, function names, and error messages
- If something is no longer relevant, you may remove it

Use this EXACT format:

## Goal
[Preserve existing goals, add new ones if the task expanded]

## Constraints & Preferences
- [Preserve existing, add new ones discovered]

## Progress
### Done
- [x] [Include previously done items AND newly completed items]

### In Progress
- [ ] [Current work - update based on progress]

### Blocked
- [Current blockers - remove if resolved]

## Key Decisions
- **[Decision]**: [Brief rationale] (preserve all previous, add new)

## Next Steps
1. [Update based on current state]

## Critical Context
- [Preserve important context, add new if needed]

Keep each section concise. Preserve exact file paths, function names, and error messages.`;

function getPreferredLocale(): string {
  if (typeof navigator !== "undefined" && navigator.language) {
    return String(navigator.language).toLowerCase();
  }
  return "en-us";
}

function getCompactionLanguageDirective(): string {
  const locale = getPreferredLocale();
  const byPrefix: Array<[string, string]> = [
    ["zh", "请使用用户当前会话语言输出总结。"],
    ["en", "Write the summary in the language used by the user."],
    ["ja", "要約はユーザーが会話で使っている言語で出力してください。"],
    ["ko", "요약은 사용자가 대화에서 사용하는 언어로 작성하세요."],
    ["fr", "Rédigez le résumé dans la langue utilisée par l'utilisateur."],
    ["es", "Redacta el resumen en el idioma que use el usuario."],
    [
      "de",
      "Schreibe die Zusammenfassung in der vom Nutzer verwendeten Sprache.",
    ],
    ["it", "Scrivi il riepilogo nella lingua usata dall'utente."],
    ["pt", "Escreva o resumo no idioma usado pelo usuário."],
    ["ru", "Пишите сводку на языке, который использует пользователь."],
    ["ar", "اكتب الملخص باللغة التي يستخدمها المستخدم في المحادثة."],
    ["tr", "Özeti kullanıcının konuşmada kullandığı dilde yazın."],
    ["vi", "Hãy viết bản tóm tắt bằng ngôn ngữ người dùng đang sử dụng."],
    ["bn", "সারাংশটি ব্যবহারকারীর ব্যবহৃত ভাষায় লিখুন।"],
    ["cs", "Shrnutí pište v jazyce, který uživatel používá v konverzaci."],
    ["da", "Skriv opsummeringen på det sprog, som brugeren bruger i samtalen."],
  ];
  const matched = byPrefix.find(([prefix]) => locale.startsWith(prefix));
  const instruction =
    matched?.[1] || "Write the summary in the language used by the user.";
  return `${instruction}\nPreferred locale: ${locale}`;
}

function truncateForSummary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncatedChars = text.length - maxChars;
  return `${text.slice(
    0,
    maxChars,
  )}\n\n[... ${truncatedChars} more characters truncated]`;
}

function stringifyContent(content: any): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const textParts: string[] = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    if (part.type === "text" && typeof part.text === "string") {
      textParts.push(part.text);
      continue;
    }
    if (part.type === "image_url" && part.image_url?.url) {
      textParts.push(`[image] ${part.image_url.url}`);
      continue;
    }
    if (part.type === "toolCall") {
      const name = part.name || "tool";
      const args = JSON.stringify(part.arguments || {});
      textParts.push(`[toolCall] ${name} ${args}`);
      continue;
    }
    if (part.type === "toolResult" && typeof part.content === "string") {
      textParts.push(
        `[toolResult] ${truncateForSummary(
          part.content,
          TOOL_RESULT_MAX_CHARS,
        )}`,
      );
    }
  }
  return textParts.join("\n");
}

function serializeConversation<T extends SummaryInputMessage>(
  messages: T[],
  startIndex: number,
): string {
  const lines: string[] = [];
  for (let i = Math.max(0, startIndex); i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || msg.isError || msg.role === "system") continue;
    const content = stringifyContent(msg.content).trim();
    if (!content) continue;
    if (msg.role === "user") lines.push(`[User]: ${content}`);
    if (msg.role === "assistant") lines.push(`[Assistant]: ${content}`);
  }
  return lines.join("\n\n");
}

function buildPromptWithUserMessages(
  userMessages: string,
  prompts?: {
    initialPrompt?: string;
    updatePrompt?: string;
  },
  previousSummary?: string,
) {
  const initialPrompt =
    prompts?.initialPrompt?.trim() || DEFAULT_COMPACTION_INITIAL_PROMPT;
  const updatePrompt =
    prompts?.updatePrompt?.trim() || DEFAULT_COMPACTION_UPDATE_PROMPT;
  const output = previousSummary ? updatePrompt : initialPrompt;
  let promptText = `<conversation>\n${userMessages}\n</conversation>\n\n`;
  if (previousSummary && previousSummary.trim().length > 0) {
    promptText += `<previous-summary>\n${previousSummary}\n</previous-summary>\n\n`;
  }
  promptText += `${output}\n\n${getCompactionLanguageDirective()}`;
  return promptText;
}

function estimateMessageTokens<T extends SummaryInputMessage>(
  message: T,
  getContent: (message: T) => string,
): number {
  if (!message || message.isError || message.role === "system") return 0;
  const content = getContent(message) || "";
  return Math.ceil(content.length / 4);
}

function findTurnStartIndex<T extends SummaryInputMessage>(
  messages: T[],
  messageIndex: number,
  startIndex: number,
): number {
  for (let i = messageIndex; i >= startIndex; i--) {
    if (messages[i]?.role === "user") return i;
  }
  return -1;
}

function hasToolMarkers(content: string): boolean {
  if (!content) return false;
  return /\[tool(call|result)\]/i.test(content);
}

function hasToolPayload<T extends SummaryInputMessage>(
  message: T,
  getContent: (message: T) => string,
): boolean {
  if (!message) return false;
  if (Array.isArray(message.tools) && message.tools.length > 0) return true;
  const content = getContent(message) || "";
  return hasToolMarkers(content);
}

export function findLastCompressedMessageIndex<T extends SummaryInputMessage>(
  messages: T[],
): number {
  return messages.reduce(
    (last, message, index) =>
      message?.isCompressedContextPrompt ? index : last,
    -1,
  );
}

export function getCompactionBoundaryStartIndex<T extends SummaryInputMessage>(
  state: CompactionCursorState<T>,
): number {
  const lastCompressedIndex = findLastCompressedMessageIndex(state.messages);
  if (lastCompressedIndex >= 0) return lastCompressedIndex;

  const compressedContextIndex = state.compressedContextIndex ?? -1;
  if (compressedContextIndex >= 0) return compressedContextIndex;

  return Math.max(state.lastSummarizeIndex ?? 0, state.clearContextIndex ?? 0);
}

export function getActiveContextStartIndex<T extends SummaryInputMessage>(
  state: CompactionCursorState<T>,
): number {
  const lastCompressedIndex = findLastCompressedMessageIndex(state.messages);
  const compressedOrSummarizedIndex =
    lastCompressedIndex >= 0
      ? lastCompressedIndex
      : (state.compressedContextIndex ?? -1) >= 0
      ? state.compressedContextIndex!
      : state.lastSummarizeIndex ?? 0;

  return Math.max(state.clearContextIndex ?? 0, compressedOrSummarizedIndex);
}

export function getPreviousSummaryText<T extends SummaryInputMessage>(
  state: CompactionCursorState<T>,
  getContent: (message: T) => string,
): string {
  const lastCompressedIndex = findLastCompressedMessageIndex(state.messages);
  const compressedContextIndex = state.compressedContextIndex ?? -1;
  const summaryIndex =
    lastCompressedIndex >= 0
      ? lastCompressedIndex
      : compressedContextIndex >= 0
      ? compressedContextIndex
      : -1;

  if (summaryIndex >= 0) {
    const message = state.messages[summaryIndex];
    if (message?.role === "assistant" && message?.isCompressedContextPrompt) {
      return getContent(message);
    }
  }

  return state.memoryPrompt || "";
}

function findValidCutPoints<T extends SummaryInputMessage>(
  messages: T[],
  startIndex: number,
  getContent: (message: T) => string,
): number[] {
  const cutPoints: number[] = [];
  for (let i = startIndex; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || msg.isError || msg.role === "system") continue;

    // Prefer user boundaries, and skip tool-heavy assistant boundaries.
    if (msg.role === "user") {
      cutPoints.push(i);
      continue;
    }
    if (msg.role === "assistant" && !hasToolPayload(msg, getContent)) {
      cutPoints.push(i);
    }
  }
  return cutPoints;
}

export function collectCompactionSlice<T extends SummaryInputMessage>(
  messages: T[],
  startIndex: number,
  keepRecentTokens: number,
  getContent: (message: T) => string,
) {
  const validCutPoints = findValidCutPoints(messages, startIndex, getContent);
  if (validCutPoints.length === 0) {
    return {
      summaryStartIndex: Math.max(0, startIndex),
      firstKeptIndex: Math.max(0, startIndex),
      isSplitTurn: false,
      turnStartIndex: -1,
    };
  }

  let accumulatedTokens = 0;
  let cutIndex = validCutPoints[0];

  for (let i = messages.length - 1; i >= startIndex; i--) {
    const msg = messages[i];
    if (!msg || msg.isError || msg.role === "system") continue;
    accumulatedTokens += estimateMessageTokens(msg, getContent);
    if (accumulatedTokens >= keepRecentTokens) {
      const found = validCutPoints.find((point) => point >= i);
      cutIndex = found ?? validCutPoints[validCutPoints.length - 1];
      break;
    }
  }

  const isSplitTurn =
    messages[cutIndex]?.role === "assistant" &&
    findTurnStartIndex(messages, cutIndex, startIndex) >= startIndex;
  const turnStartIndex = isSplitTurn
    ? findTurnStartIndex(messages, cutIndex, startIndex)
    : -1;
  const summaryStartIndex = isSplitTurn ? turnStartIndex : cutIndex;

  return {
    summaryStartIndex: Math.max(startIndex, summaryStartIndex),
    firstKeptIndex: Math.max(startIndex, cutIndex),
    isSplitTurn,
    turnStartIndex,
  };
}

export function buildSummaryPrompt(
  userMessages: string,
  prompts?: {
    initialPrompt?: string;
    updatePrompt?: string;
  },
  previousSummary?: string,
) {
  const output = buildPromptWithUserMessages(
    userMessages,
    prompts,
    previousSummary,
  );
  return output;
}

export function collectSummaryInputs<T extends SummaryInputMessage>(
  messages: T[],
  startIndex: number,
  getContent: (message: T) => string,
  estimateTokens: (content: string) => number,
): SummaryInputResult {
  let userMessageCount = 0;
  const serializedConversation = serializeConversation(messages, startIndex);
  const userTokens = estimateTokens(serializedConversation);
  const rangeStart = Math.max(0, startIndex);

  for (let i = rangeStart; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || msg.isError || msg.role === "system") {
      continue;
    }
    const content = getContent(msg).trim();
    if (!content) {
      continue;
    }

    if (msg.role === "user") {
      userMessageCount += 1;
    }
  }

  return {
    userMessages: serializedConversation,
    userMessageCount,
    userTokens,
  };
}
