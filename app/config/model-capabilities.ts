// 模型能力配置
export interface ModelCapabilities {
  vision?: boolean; // 视觉能力
  web?: boolean; // 联网能力
  reasoning?: boolean; // 推理能力
  tools?: boolean; // 工具调用能力
}

// 基于模型名称的能力映射
export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  // OpenAI 模型
  "gpt-4": { vision: false, web: false, reasoning: true, tools: true },
  "gpt-4-0613": { vision: false, web: false, reasoning: true, tools: true },
  "gpt-4-32k": { vision: false, web: false, reasoning: true, tools: true },
  "gpt-4-32k-0613": { vision: false, web: false, reasoning: true, tools: true },
  "gpt-4-turbo": { vision: true, web: false, reasoning: true, tools: true },
  "gpt-4-turbo-preview": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4-turbo-2024-04-09": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4-1106-preview": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4-vision-preview": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4.1": { vision: true, web: false, reasoning: true, tools: true },
  "gpt-4.1-2025-04-14": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4.1-mini": { vision: true, web: false, reasoning: true, tools: true },
  "gpt-4.1-mini-2025-04-14": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4.1-nano": { vision: true, web: false, reasoning: true, tools: true },
  "gpt-4.1-nano-2025-04-14": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4.5-preview": { vision: true, web: false, reasoning: true, tools: true },
  "gpt-4.5-preview-2025-02-27": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4o": { vision: true, web: false, reasoning: true, tools: true },
  "gpt-4o-2024-05-13": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4o-2024-08-06": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4o-2024-11-20": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "chatgpt-4o-latest": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-4o-mini": { vision: true, web: false, reasoning: true, tools: true },
  "gpt-4o-mini-2024-07-18": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "gpt-3.5-turbo": { vision: false, web: false, reasoning: false, tools: true },
  "gpt-3.5-turbo-1106": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "gpt-3.5-turbo-0125": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "dall-e-3": { vision: true, web: false, reasoning: false, tools: false },
  "o1-mini": { vision: false, web: false, reasoning: true, tools: false },
  "o1-preview": { vision: false, web: false, reasoning: true, tools: false },
  "o3-mini": { vision: false, web: false, reasoning: true, tools: false },
  o3: { vision: false, web: false, reasoning: true, tools: false },
  "o4-mini": { vision: true, web: false, reasoning: true, tools: false },

  // Google 模型
  "gemini-1.5-pro-latest": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-1.5-pro": { vision: true, web: true, reasoning: true, tools: true },
  "gemini-1.5-pro-002": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-1.5-flash-latest": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-1.5-flash-8b-latest": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-1.5-flash": { vision: true, web: true, reasoning: true, tools: true },
  "gemini-1.5-flash-8b": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-1.5-flash-002": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "learnlm-1.5-pro-experimental": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-exp-1206": { vision: true, web: true, reasoning: true, tools: true },
  "gemini-2.0-flash": { vision: true, web: true, reasoning: true, tools: true },
  "gemini-2.0-flash-exp": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-2.0-flash-lite-preview-02-05": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-2.0-flash-thinking-exp": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-2.0-flash-thinking-exp-1219": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-2.0-flash-thinking-exp-01-21": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-2.0-pro-exp": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-2.0-pro-exp-02-05": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-2.5-pro-preview-06-05": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "gemini-2.5-pro": { vision: true, web: true, reasoning: true, tools: true },

  // Anthropic 模型
  "claude-instant-1.2": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "claude-2.0": { vision: false, web: false, reasoning: true, tools: false },
  "claude-2.1": { vision: false, web: false, reasoning: true, tools: false },
  "claude-3-sonnet-20240229": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-opus-20240229": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-opus-latest": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-haiku-20240307": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-5-haiku-20241022": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-5-haiku-latest": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-5-sonnet-20240620": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-5-sonnet-20241022": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-5-sonnet-latest": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-7-sonnet-20250219": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-3-7-sonnet-latest": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-sonnet-4-20250514": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },
  "claude-opus-4-20250514": {
    vision: true,
    web: false,
    reasoning: true,
    tools: true,
  },

  // ByteDance 模型
  "Doubao-lite-4k": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "Doubao-lite-32k": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "Doubao-lite-128k": {
    vision: false,
    web: false,
    reasoning: false,
    tools: true,
  },
  "Doubao-pro-4k": { vision: true, web: false, reasoning: true, tools: true },
  "Doubao-pro-32k": { vision: true, web: false, reasoning: true, tools: true },
  "Doubao-pro-128k": { vision: true, web: false, reasoning: true, tools: true },

  // Alibaba 模型
  "qwen-turbo": { vision: false, web: false, reasoning: false, tools: true },
  "qwen-plus": { vision: false, web: false, reasoning: true, tools: true },
  "qwen-max": { vision: false, web: false, reasoning: true, tools: true },
  "qwen-max-0428": { vision: false, web: false, reasoning: true, tools: true },
  "qwen-max-0403": { vision: false, web: false, reasoning: true, tools: true },
  "qwen-max-0107": { vision: false, web: false, reasoning: true, tools: true },
  "qwen-max-longcontext": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "qwen-omni-turbo": { vision: true, web: false, reasoning: true, tools: true },
  "qwen-vl-plus": { vision: true, web: false, reasoning: true, tools: true },
  "qwen-vl-max": { vision: true, web: false, reasoning: true, tools: true },

  // Moonshot 模型
  "moonshot-v1-8k": { vision: false, web: false, reasoning: true, tools: true },
  "moonshot-v1-32k": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "moonshot-v1-128k": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },

  // DeepSeek 模型
  "deepseek-chat": { vision: false, web: false, reasoning: true, tools: true },
  "deepseek-coder": { vision: false, web: false, reasoning: true, tools: true },
  "deepseek-reasoner": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },

  // XAI 模型
  "grok-beta": { vision: false, web: true, reasoning: true, tools: true },
  "grok-2": { vision: false, web: true, reasoning: true, tools: true },
  "grok-2-1212": { vision: false, web: true, reasoning: true, tools: true },
  "grok-2-latest": { vision: false, web: true, reasoning: true, tools: true },
  "grok-vision-beta": { vision: true, web: true, reasoning: true, tools: true },
  "grok-2-vision-1212": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "grok-2-vision": { vision: true, web: true, reasoning: true, tools: true },
  "grok-2-vision-latest": {
    vision: true,
    web: true,
    reasoning: true,
    tools: true,
  },
  "grok-3-mini-fast-beta": {
    vision: false,
    web: true,
    reasoning: true,
    tools: true,
  },
  "grok-3-mini-fast": {
    vision: false,
    web: true,
    reasoning: true,
    tools: true,
  },
  "grok-3-mini-fast-latest": {
    vision: false,
    web: true,
    reasoning: true,
    tools: true,
  },
  "grok-3-mini-beta": {
    vision: false,
    web: true,
    reasoning: true,
    tools: true,
  },
  "grok-3-mini": { vision: false, web: true, reasoning: true, tools: true },
  "grok-3-mini-latest": {
    vision: false,
    web: true,
    reasoning: true,
    tools: true,
  },
  "grok-3-fast-beta": {
    vision: false,
    web: true,
    reasoning: true,
    tools: true,
  },
  "grok-3-fast": { vision: false, web: true, reasoning: true, tools: true },
  "grok-3-fast-latest": {
    vision: false,
    web: true,
    reasoning: true,
    tools: true,
  },
  "grok-3-beta": { vision: false, web: true, reasoning: true, tools: true },
  "grok-3": { vision: false, web: true, reasoning: true, tools: true },
  "grok-3-latest": { vision: false, web: true, reasoning: true, tools: true },

  // SiliconFlow 模型
  "Qwen/Qwen2.5-7B-Instruct": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "Qwen/Qwen2.5-72B-Instruct": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "deepseek-ai/DeepSeek-R1": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-ai/DeepSeek-R1-Distill-Llama-8B": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "deepseek-ai/DeepSeek-V3": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "meta-llama/Llama-3.3-70B-Instruct": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "THUDM/glm-4-9b-chat": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
  "Pro/deepseek-ai/DeepSeek-R1": {
    vision: false,
    web: false,
    reasoning: true,
    tools: false,
  },
  "Pro/deepseek-ai/DeepSeek-V3": {
    vision: false,
    web: false,
    reasoning: true,
    tools: true,
  },
};

// 获取模型能力的函数
export function getModelCapabilities(modelName: string): ModelCapabilities {
  return MODEL_CAPABILITIES[modelName] || {};
}

// 检查模型是否有特定能力
export function hasCapability(
  modelName: string,
  capability: keyof ModelCapabilities,
): boolean {
  const capabilities = getModelCapabilities(modelName);
  return capabilities[capability] === true;
}
