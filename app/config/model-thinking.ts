// 模型思考深度配置
// 用于存储每个模型默认的思考深度（-1=动态，0=关闭，>0=指定档位），
// 在模型配置弹窗中设置，作为模型级默认值应用到会话配置

/**
 * 获取模型的思考深度配置
 * @param modelName 模型名称
 * @returns 思考深度值，未配置时返回 undefined
 */
export function getModelThinkingBudget(
  modelName: string,
): number | undefined {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const budgetKey = `model_thinking_budget_${modelName}`;
    const budgetConfig = localStorage.getItem(budgetKey);
    if (budgetConfig !== null) {
      try {
        const value = JSON.parse(budgetConfig);
        if (typeof value === "number") {
          return value;
        }
      } catch (e) {
        // 静默处理解析错误
      }
    }
  }

  return undefined;
}

/**
 * 将模型级思考深度默认值应用到一份会话模型配置。
 * 未设置模型级默认值时保留调用方已有配置。
 */
export function applyModelThinkingDefault<
  T extends { model: string; thinkingBudget?: number },
>(modelConfig: T): T {
  const budget = getModelThinkingBudget(modelConfig.model);
  return budget === undefined
    ? { ...modelConfig }
    : { ...modelConfig, thinkingBudget: budget };
}

/**
 * 保存模型的思考深度配置
 * @param modelName 模型名称
 * @param budget 思考深度值（-1=动态，0=关闭，>0=指定档位）
 */
export function saveModelThinkingBudget(
  modelName: string,
  budget: number,
): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const budgetKey = `model_thinking_budget_${modelName}`;
    localStorage.setItem(budgetKey, JSON.stringify(budget));
  }
}

/**
 * 删除模型的思考深度配置（恢复默认）
 * @param modelName 模型名称
 */
export function removeModelThinkingBudget(modelName: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const budgetKey = `model_thinking_budget_${modelName}`;
    localStorage.removeItem(budgetKey);
  }
}
