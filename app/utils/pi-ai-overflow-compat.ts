import { isContextOverflow } from "@mariozechner/pi-ai";

export function isContextOverflowErrorMessage(errorMessage: string): boolean {
  const message = errorMessage || "";
  if (!message) return false;
  return isContextOverflow({
    role: "assistant",
    content: [],
    api: "openai-completions",
    provider: "openai",
    model: "compat-overflow-check",
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason: "error",
    errorMessage: message,
    timestamp: Date.now(),
  } as any);
}
