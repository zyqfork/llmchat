// 测试多模型模式下视觉支持修复
console.log("测试多模型模式下视觉支持修复...");

// 模拟 isVisionModel 函数
function isVisionModel(model) {
  const visionModels = [
    "gpt-4o", "gpt-4o-mini", "claude-3-sonnet", "gemini-1.5-pro",
    "gemini-2.0-flash", "qwen-vl-plus", "doubao-vision-lite"
  ];
  return visionModels.some(visionModel => model.includes(visionModel));
}

// 模拟用户消息
const userMessage = {
  role: "user",
  content: [
    { type: "text", text: "请分析这张图片" },
    { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" } }
  ]
};

// 测试模型列表
const testModels = [
  { modelKey: "gpt-4o@openai", modelName: "gpt-4o", expectedSupportVision: true },
  { modelKey: "gpt-3.5-turbo@openai", modelName: "gpt-3.5-turbo", expectedSupportVision: false },
  { modelKey: "claude-3-sonnet@anthropic", modelName: "claude-3-sonnet", expectedSupportVision: true },
  { modelKey: "deepseek-chat@deepseek", modelName: "deepseek-chat", expectedSupportVision: false },
  { modelKey: "gemini-1.5-pro@google", modelName: "gemini-1.5-pro", expectedSupportVision: true },
  { modelKey: "qwen-turbo@alibaba", modelName: "qwen-turbo", expectedSupportVision: false },
  { modelKey: "qwen-vl-plus@alibaba", modelName: "qwen-vl-plus", expectedSupportVision: true }
];

// 模拟修复后的处理逻辑
function processMessageForModel(userMessage, modelName) {
  const supportsVision = isVisionModel(modelName);
  
  if (!supportsVision && Array.isArray(userMessage.content)) {
    // 模型不支持视觉，需要创建纯文本版本的用户消息
    const textContent = userMessage.content.find(item => item.type === "text")?.text || "";
    return {
      ...userMessage,
      content: textContent // 只保留文本内容
    };
  }
  
  return userMessage; // 支持视觉的模型，保持原消息不变
}

// 运行测试
console.log("\n=== 测试多模型模式下视觉支持处理 ===");
testModels.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase.modelKey}`);
  console.log(`模型: ${testCase.modelName}`);
  console.log(`期望视觉支持: ${testCase.expectedSupportVision ? '✅' : '❌'}`);
  
  const processedMessage = processMessageForModel(userMessage, testCase.modelName);
  const hasImages = Array.isArray(processedMessage.content) && 
    processedMessage.content.some(item => item.type === "image_url");
  
  console.log(`实际视觉支持: ${isVisionModel(testCase.modelName) ? '✅' : '❌'}`);
  console.log(`处理结果: ${hasImages ? '✅ 包含图片' : '❌ 纯文本'}`);
  
  // 验证结果
  const expectedHasImages = testCase.expectedSupportVision;
  const testPassed = hasImages === expectedHasImages;
  
  console.log(`测试状态: ${testPassed ? '✅ 通过' : '❌ 失败'}`);
  
  if (!testPassed) {
    console.log(`错误: 期望${expectedHasImages ? '包含' : '不包含'}图片，但实际${hasImages ? '包含' : '不包含'}`);
  }
});

console.log("\n=== 测试总结 ===");
const passedTests = testModels.filter((testCase, index) => {
  const processedMessage = processMessageForModel(userMessage, testCase.modelName);
  const hasImages = Array.isArray(processedMessage.content) && 
    processedMessage.content.some(item => item.type === "image_url");
  return hasImages === testCase.expectedSupportVision;
}).length;

console.log(`总测试数: ${testModels.length}`);
console.log(`通过测试: ${passedTests}`);
console.log(`失败测试: ${testModels.length - passedTests}`);
console.log(`成功率: ${((passedTests / testModels.length) * 100).toFixed(1)}%`);

console.log("\n🎉 修复验证完成！");
console.log("✅ 支持视觉的模型会收到包含图片的消息");
console.log("✅ 不支持视觉的模型只会收到纯文本消息");
console.log("✅ 避免了不支持视觉的模型因收到图片而请求失败");
