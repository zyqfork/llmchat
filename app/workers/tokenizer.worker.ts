/**
 * Token 计算 Worker - 将密集计算移到后台线程
 */

// 简单的 token 估算（实际项目中应使用 tiktoken 等库）
function estimateTokens(text: string): number {
  // 简化版本：英文按空格分词，中文按字符计数
  const englishWords = text.match(/[a-zA-Z]+/g)?.length || 0;
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const otherChars = text.length - englishWords - chineseChars;

  return Math.ceil(englishWords * 1.3 + chineseChars * 1.5 + otherChars * 0.5);
}

// 监听主线程消息
self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case "estimate":
      const tokenCount = estimateTokens(data.text);
      self.postMessage({ type: "result", tokenCount });
      break;

    case "batch":
      const results = data.texts.map((text: string) => ({
        text,
        tokens: estimateTokens(text),
      }));
      self.postMessage({ type: "batchResult", results });
      break;

    default:
      self.postMessage({ type: "error", message: "Unknown command" });
  }
};

export {};
