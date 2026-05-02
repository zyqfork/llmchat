const ENV_MAP: Record<string, string[]> = {
  "github-copilot": ["COPILOT_GITHUB_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"],
  anthropic: ["ANTHROPIC_OAUTH_TOKEN", "ANTHROPIC_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  "azure-openai-responses": ["AZURE_OPENAI_API_KEY"],
  deepseek: ["DEEPSEEK_API_KEY"],
  google: ["GEMINI_API_KEY"],
  "google-vertex": ["GOOGLE_CLOUD_API_KEY"],
  groq: ["GROQ_API_KEY"],
  cerebras: ["CEREBRAS_API_KEY"],
  xai: ["XAI_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  "vercel-ai-gateway": ["AI_GATEWAY_API_KEY"],
  zai: ["ZAI_API_KEY"],
  mistral: ["MISTRAL_API_KEY"],
  minimax: ["MINIMAX_API_KEY"],
  "minimax-cn": ["MINIMAX_CN_API_KEY"],
  moonshotai: ["MOONSHOT_API_KEY"],
  "moonshotai-cn": ["MOONSHOT_API_KEY"],
  huggingface: ["HF_TOKEN"],
  fireworks: ["FIREWORKS_API_KEY"],
  opencode: ["OPENCODE_API_KEY"],
  "opencode-go": ["OPENCODE_API_KEY"],
  "kimi-coding": ["KIMI_API_KEY"],
  "cloudflare-workers-ai": ["CLOUDFLARE_API_KEY"],
  "cloudflare-ai-gateway": ["CLOUDFLARE_API_KEY"],
  xiaomi: ["XIAOMI_API_KEY"],
};

export function findEnvKeys(provider: string): string[] | undefined {
  const envVars = ENV_MAP[provider];
  if (!envVars) return undefined;
  const found = envVars.filter((envVar) => !!process.env[envVar]);
  return found.length > 0 ? found : undefined;
}

export function getEnvApiKey(provider: string): string | undefined {
  const envKeys = findEnvKeys(provider);
  if (envKeys?.[0]) {
    return process.env[envKeys[0]];
  }

  if (provider === "amazon-bedrock") {
    if (
      process.env.AWS_PROFILE ||
      (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
      process.env.AWS_BEARER_TOKEN_BEDROCK ||
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
      process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI ||
      process.env.AWS_WEB_IDENTITY_TOKEN_FILE
    ) {
      return "<authenticated>";
    }
  }

  return undefined;
}
