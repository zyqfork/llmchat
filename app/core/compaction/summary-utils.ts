export interface SummaryInputMessage {
  role: "system" | "user" | "assistant";
  isError?: boolean;
}

export interface SummaryInputResult {
  userMessages: string;
  confirmedAssistantMessages: string;
  userMessageCount: number;
  userTokens: number;
  confirmedAssistantTokens: number;
}

export function isLowValueAssistantMessage(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    return true;
  }

  if (trimmed.length <= 6) {
    return true;
  }

  const genericReply =
    /^(好的|好|可以|没问题|谢谢|不客气|抱歉|了解|明白|收到|欢迎|你好|嗨|嗯|ok|okay)[\s.!?。！？]*$/i;

  return genericReply.test(trimmed);
}

export function isUserConfirmationMessage(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    return false;
  }

  if (/(不|别|不要|不是|错|不对|不行|别这样)/i.test(trimmed)) {
    return false;
  }

  if (/[?？]/.test(trimmed)) {
    return false;
  }

  if (/(但是|不过|然而|可是|只是)/i.test(trimmed)) {
    return false;
  }

  if (trimmed.length > 20) {
    return false;
  }

  const confirmation =
    /^(好的?|可以|行|没问题|确认|对|是的|没错|就这样|按这个|按此|照这个|照此|听你的|继续|ok|okay)[\s.!。！]*$/i;

  return confirmation.test(trimmed);
}

function buildPromptWithUserMessages(
  instruction: string,
  userMessages: string,
  previousSummary?: string,
) {
  let output = instruction;

  if (output.includes("{{previous_summary}}")) {
    output = output.replace("{{previous_summary}}", previousSummary ?? "");
  } else if (previousSummary && previousSummary.trim().length > 0) {
    output = `${output}\n\n已有语义状态：\n${previousSummary}`;
  }

  if (output.includes("{{user_messages}}")) {
    return output.replace("{{user_messages}}", userMessages);
  }

  if (!userMessages) {
    return output;
  }

  return `${output}\n\n用户发言：\n${userMessages}`;
}

export function buildSummaryPrompt(
  instruction: string,
  userMessages: string,
  confirmedAssistantMessages: string,
  previousSummary?: string,
) {
  let output = buildPromptWithUserMessages(
    instruction,
    userMessages,
    previousSummary,
  );

  if (output.includes("{{assistant_messages}}")) {
    return output.replace("{{assistant_messages}}", confirmedAssistantMessages);
  }

  if (!confirmedAssistantMessages) {
    return output;
  }

  return `${output}\n\n用户确认的助手结论：\n${confirmedAssistantMessages}`;
}

export function collectSummaryInputs<T extends SummaryInputMessage>(
  messages: T[],
  startIndex: number,
  getContent: (message: T) => string,
  estimateTokens: (content: string) => number,
): SummaryInputResult {
  const userLines: string[] = [];
  const confirmedAssistantLines: string[] = [];
  let userMessageCount = 0;
  let userTokens = 0;
  let confirmedAssistantTokens = 0;
  let pendingAssistant: string | null = null;
  const rangeStart = Math.max(0, startIndex - 1);

  for (let i = rangeStart; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || msg.isError || msg.role === "system") {
      continue;
    }
    const content = getContent(msg).trim();
    if (!content) {
      continue;
    }

    if (msg.role === "assistant") {
      pendingAssistant = content;
      continue;
    }

    if (msg.role === "user") {
      if (i >= startIndex) {
        userLines.push(content);
        userMessageCount += 1;
        userTokens += estimateTokens(content);
      }

      if (
        pendingAssistant &&
        i >= startIndex &&
        isUserConfirmationMessage(content) &&
        !isLowValueAssistantMessage(pendingAssistant)
      ) {
        confirmedAssistantLines.push(pendingAssistant);
        confirmedAssistantTokens += estimateTokens(pendingAssistant);
      }

      pendingAssistant = null;
    }
  }

  return {
    userMessages: userLines.join("\n"),
    confirmedAssistantMessages: confirmedAssistantLines.join("\n"),
    userMessageCount,
    userTokens,
    confirmedAssistantTokens,
  };
}
