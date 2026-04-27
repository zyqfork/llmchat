export const KNOWN_PI_PROVIDER_MAP: Record<string, string> = {
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
  xai: "xai",
  groq: "groq",
  cerebras: "cerebras",
  openrouter: "openrouter",
  zai: "zai",
  mistral: "mistral",
  huggingface: "huggingface",
  fireworks: "fireworks",
  minimax: "minimax",
};

export function getKnownPiProvider(providerId: string): string | undefined {
  return KNOWN_PI_PROVIDER_MAP[providerId];
}
