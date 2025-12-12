// 模型流式配置
// 用于控制模型是否使用流式响应

/**
 * 获取模型的流式配置
 * @param modelName 模型名称
 * @returns 是否使用流式，默认为 true（流式）
 */
export function getModelStreamConfig(modelName: string): boolean {
  // 检查是否在浏览器环境中
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const streamKey = `model_stream_${modelName}`;
    const streamConfig = localStorage.getItem(streamKey);
    if (streamConfig !== null) {
      try {
        return JSON.parse(streamConfig);
      } catch (e) {
        console.warn(`Failed to parse stream config for ${modelName}:`, e);
      }
    }
  }

  // 默认返回 true（流式）
  return true;
}

/**
 * 保存模型的流式配置
 * @param modelName 模型名称
 * @param stream 是否使用流式
 */
export function saveModelStreamConfig(
  modelName: string,
  stream: boolean,
): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const streamKey = `model_stream_${modelName}`;
    localStorage.setItem(streamKey, JSON.stringify(stream));
  }
}

/**
 * 删除模型的流式配置（恢复默认）
 * @param modelName 模型名称
 */
export function removeModelStreamConfig(modelName: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const streamKey = `model_stream_${modelName}`;
    localStorage.removeItem(streamKey);
  }
}
