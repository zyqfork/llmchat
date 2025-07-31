import { isWebSearchModel } from "./model-capabilities";

/**
 * 获取 Gemini 模型的搜索工具配置
 * 参考 Cherry Studio 的实现
 */
export function getGeminiSearchTools(
  modelName: string,
  enableWebSearch: boolean,
): any[] {
  const tools: any[] = [];

  if (!enableWebSearch || !isWebSearchModel(modelName)) {
    return tools;
  }

  // 根据模型版本选择合适的搜索工具
  if (modelName.includes("gemini-1.5")) {
    // Gemini 1.5 使用旧版 google_search_retrieval
    const tool = {
      google_search_retrieval: {
        dynamic_retrieval_config: {
          mode: "MODE_DYNAMIC",
          dynamic_threshold: 0.7,
        },
      },
    };
    tools.push(tool);
  } else {
    // Gemini 2.0+ 使用新版 google_search (注意：REST API 使用下划线格式)
    const tool = {
      google_search: {},
    };
    tools.push(tool);
  }

  return tools;
}

/**
 * 获取模型支持的所有工具配置
 */
export function getModelTools(
  modelName: string,
  options: {
    enableWebSearch?: boolean;
  },
): any[] {
  const tools: any[] = [];

  // 添加搜索工具
  if (options.enableWebSearch) {
    const searchTools = getGeminiSearchTools(modelName, true);
    tools.push(...searchTools);
  }

  return tools;
}
