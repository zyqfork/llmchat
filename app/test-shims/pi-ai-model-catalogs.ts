const MODEL = {
  id: "gpt-4o-mini",
  name: "gpt-4o-mini",
  provider: "openai",
  api: "openai-responses",
  reasoning: false,
  contextWindow: 128000,
  maxTokens: 16384,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  input: ["text"],
};

export const OPENAI_MODELS = { [MODEL.id]: MODEL };
export const ANTHROPIC_MODELS = {};
export const GOOGLE_MODELS = {};
export const DEEPSEEK_MODELS = {};
export const MOONSHOTAI_MODELS = {};
export const XAI_MODELS = {};
export const ZAI_MODELS = {};
export const AZURE_OPENAI_RESPONSES_MODELS = {};
