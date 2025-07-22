import { getEnhancedModelCapabilities, hasCapability } from "../app/config/model-capabilities";

describe("Model Capabilities", () => {
  test("should detect vision capabilities correctly", () => {
    // OpenAI 视觉模型
    expect(getEnhancedModelCapabilities("gpt-4o").vision).toBe(true);
    expect(getEnhancedModelCapabilities("gpt-4o-mini").vision).toBe(true);
    expect(getEnhancedModelCapabilities("gpt-4-turbo").vision).toBe(true);
    
    // Claude 视觉模型
    expect(getEnhancedModelCapabilities("claude-3-5-sonnet-20241022").vision).toBe(true);
    expect(getEnhancedModelCapabilities("claude-3-haiku-20240307").vision).toBe(true);
    
    // Gemini 视觉模型
    expect(getEnhancedModelCapabilities("gemini-2.0-flash").vision).toBe(true);
    expect(getEnhancedModelCapabilities("gemini-1.5-pro").vision).toBe(true);
    expect(getEnhancedModelCapabilities("gemini-1.5-flash").vision).toBe(true);
    expect(getEnhancedModelCapabilities("gemini-1.5-flash-8b").vision).toBe(true);
    
    // 非视觉模型
    expect(getEnhancedModelCapabilities("gpt-3.5-turbo").vision).toBe(false);
    expect(getEnhancedModelCapabilities("text-embedding-3-large").vision).toBe(false);
  });

  test("should detect reasoning capabilities correctly", () => {
    // OpenAI 推理模型
    expect(getEnhancedModelCapabilities("o1-preview").reasoning).toBe(true);
    expect(getEnhancedModelCapabilities("o1-mini").reasoning).toBe(true);
    expect(getEnhancedModelCapabilities("o3").reasoning).toBe(true);
    expect(getEnhancedModelCapabilities("o3-mini").reasoning).toBe(true);
    
    // DeepSeek 推理模型
    expect(getEnhancedModelCapabilities("deepseek-r1").reasoning).toBe(true);
    expect(getEnhancedModelCapabilities("deepseek-reasoner").reasoning).toBe(true);
    
    // Qwen 推理模型
    expect(getEnhancedModelCapabilities("qwq-32b").reasoning).toBe(true);
    expect(getEnhancedModelCapabilities("qvq-32b").reasoning).toBe(true);

    // Gemini 推理模型
    expect(getEnhancedModelCapabilities("gemini-2.5-pro-exp-03-25").reasoning).toBe(true);
    expect(getEnhancedModelCapabilities("gemini-2.5-pro-preview-03-25").reasoning).toBe(true);

    // 非推理模型
    expect(getEnhancedModelCapabilities("gpt-4o").reasoning).toBe(false);
    expect(getEnhancedModelCapabilities("claude-3-5-sonnet-20241022").reasoning).toBe(false);
    expect(getEnhancedModelCapabilities("gemini-2.0-flash").reasoning).toBe(false);
    expect(getEnhancedModelCapabilities("gemini-1.5-pro").reasoning).toBe(false);
  });

  test("should detect web capabilities correctly", () => {
    // 有联网能力的模型
    expect(getEnhancedModelCapabilities("gpt-4o").web).toBe(true);
    expect(getEnhancedModelCapabilities("gemini-2.0-flash").web).toBe(true);
    expect(getEnhancedModelCapabilities("gemini-2.5-flash").web).toBe(true);
    expect(getEnhancedModelCapabilities("claude-3-5-sonnet-20241022").web).toBe(true);
    expect(getEnhancedModelCapabilities("grok-3").web).toBe(true);
    expect(getEnhancedModelCapabilities("kimi-k2").web).toBe(true);

    // 无联网能力的模型
    expect(getEnhancedModelCapabilities("gpt-3.5-turbo").web).toBe(false);
    expect(getEnhancedModelCapabilities("claude-3-haiku-20240307").web).toBe(false);
    expect(getEnhancedModelCapabilities("gemini-1.5-pro").web).toBe(false);
    expect(getEnhancedModelCapabilities("gemini-1.5-flash").web).toBe(false);
  });

  test("should detect embedding capabilities correctly", () => {
    // 嵌入模型
    expect(getEnhancedModelCapabilities("text-embedding-3-large").embedding).toBe(true);
    expect(getEnhancedModelCapabilities("text-embedding-3-small").embedding).toBe(true);
    expect(getEnhancedModelCapabilities("text-embedding-ada-002").embedding).toBe(true);
    expect(getEnhancedModelCapabilities("doubao-embedding-large-text-240915").embedding).toBe(true);
    expect(getEnhancedModelCapabilities("qwen3-embedding-8b").embedding).toBe(true);
    expect(getEnhancedModelCapabilities("BAAI/bge-m3").embedding).toBe(true);
    
    // 非嵌入模型
    expect(getEnhancedModelCapabilities("gpt-4o").embedding).toBe(undefined);
    expect(getEnhancedModelCapabilities("claude-3-5-sonnet-20241022").embedding).toBe(undefined);
  });

  test("should detect tool capabilities correctly", () => {
    // 有工具调用能力的模型
    expect(getEnhancedModelCapabilities("gpt-4o").tools).toBe(true);
    expect(getEnhancedModelCapabilities("claude-3-5-sonnet-20241022").tools).toBe(true);
    expect(getEnhancedModelCapabilities("gemini-2.0-flash").tools).toBe(true);
    expect(getEnhancedModelCapabilities("deepseek-v3").tools).toBe(true);
    
    // 无工具调用能力的模型
    expect(getEnhancedModelCapabilities("o1-preview").tools).toBe(false);
    expect(getEnhancedModelCapabilities("o3-mini").tools).toBe(true); // o3-mini 有工具能力
    expect(getEnhancedModelCapabilities("deepseek-r1").tools).toBe(false);
    expect(getEnhancedModelCapabilities("text-embedding-3-large").tools).toBe(false);
  });

  test("hasCapability function should work correctly", () => {
    expect(hasCapability("gpt-4o", "vision")).toBe(true);
    expect(hasCapability("gpt-4o", "web")).toBe(true);
    expect(hasCapability("gpt-4o", "reasoning")).toBe(false);
    expect(hasCapability("gpt-4o", "tools")).toBe(true);
    
    expect(hasCapability("o1-preview", "reasoning")).toBe(true);
    expect(hasCapability("o1-preview", "tools")).toBe(false);
    
    expect(hasCapability("text-embedding-3-large", "embedding")).toBe(true);
    expect(hasCapability("text-embedding-3-large", "vision")).toBe(false);
  });

  test("should handle unknown models with heuristic detection", () => {
    // 测试启发式检测
    const unknownVisionModel = getEnhancedModelCapabilities("some-unknown-vision-model");
    expect(unknownVisionModel.vision).toBe(true);
    
    const unknownReasoningModel = getEnhancedModelCapabilities("some-unknown-reasoning-model");
    expect(unknownReasoningModel.reasoning).toBe(true);
    
    const unknownEmbeddingModel = getEnhancedModelCapabilities("some-unknown-embedding-model");
    expect(unknownEmbeddingModel.embedding).toBe(true);
    
    const unknownModel = getEnhancedModelCapabilities("some-completely-unknown-model");
    expect(unknownModel.tools).toBe(true); // 大部分模型都有工具能力
  });
});
