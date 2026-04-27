const OPENAI_PREFIXES = ["gpt-", "o1-", "chatgpt-"];

export function inferProviderIdByModel(model: string): string {
  if (OPENAI_PREFIXES.some((prefix) => model.startsWith(prefix))) {
    return "openai";
  }
  if (model.startsWith("claude-")) return "anthropic";
  if (model.startsWith("gemini-") || model.startsWith("learnlm-")) {
    return "google";
  }
  if (model.startsWith("qwen-") || model.includes("qwen")) return "alibaba";
  if (model.startsWith("moonshot-") || model.startsWith("kimi-")) {
    return "moonshotai";
  }
  if (model.startsWith("deepseek-")) return "deepseek";
  if (model.startsWith("grok-")) return "xai";
  if (model.includes("siliconflow") || model.includes("/")) {
    return "siliconflow";
  }
  if (model.includes("ollama")) return "ollama";
  return "openai";
}
