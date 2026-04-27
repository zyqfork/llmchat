export function formatTokenCountCompat(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.round(count / 1000)}k`;
}

export function shouldUseProxyForProviderCompat(
  provider: string,
  apiKey: string,
): boolean {
  switch ((provider || "").toLowerCase()) {
    case "zai":
      return true;
    case "anthropic":
      return apiKey.startsWith("sk-ant-oat") || apiKey.startsWith("{");
    case "openai-codex":
      return true;
    case "openai":
    case "google":
    case "groq":
    case "openrouter":
    case "cerebras":
    case "xai":
    case "ollama":
    case "lmstudio":
    case "github-copilot":
      return false;
    default:
      return false;
  }
}

export function isCorsErrorCompat(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  if (error.name === "TypeError" && message.includes("failed to fetch")) {
    return true;
  }
  if (error.name === "NetworkError") {
    return true;
  }
  return message.includes("cors") || message.includes("cross-origin");
}
