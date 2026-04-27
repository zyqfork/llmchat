/**
 * Lightweight compatibility helpers mirrored from @mariozechner/pi-web-ui utils.
 * We keep this local because the package currently exports only its root entry,
 * which pulls in attachment/pdfjs modules and breaks Next export builds.
 */

export function formatTokenCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.round(count / 1000)}k`;
}

export function shouldUseProxyForProvider(
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

export function applyProxyIfNeeded<
  T extends { provider: string; baseUrl?: string },
>(model: T, apiKey: string, proxyUrl?: string): T {
  if (!proxyUrl || !model.baseUrl) {
    return model;
  }
  if (!shouldUseProxyForProvider(model.provider, apiKey)) {
    return model;
  }
  return {
    ...model,
    baseUrl: `${proxyUrl}/?url=${encodeURIComponent(model.baseUrl)}`,
  };
}

export function isCorsError(error: unknown): boolean {
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
