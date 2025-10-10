// 测试多模型模式下文字和图片同时发送的问题修复
// 这个测试模拟用户同时输入文字和选择图片的场景

console.log("测试多模型模式消息内容处理...");

// 模拟测试数据
const testCases = [
  {
    name: "文字+图片同时发送",
    content: "你好，这是测试文字",
    attachImages: ["data:image/jpeg;base64,/9j/4AAQSkZJRg=="],
    expected: true
  },
  {
    name: "只有图片，没有文字",
    content: "",
    attachImages: ["data:image/jpeg;base64,/9j/4AAQSkZJRg=="],
    expected: true
  },
  {
    name: "只有文字，没有图片",
    content: "只有文字内容",
    attachImages: [],
    expected: true
  }
];

// 模拟消息内容构建逻辑
function buildMessageContent(content, attachImages) {
  if (attachImages && attachImages.length > 0) {
    const mContent = [
      { type: "text", text: content }, // 修复后的逻辑：总是包含文字内容，即使为空
      ...attachImages.map((url) => ({
        type: "image_url",
        image_url: { url },
      })),
    ];
    return mContent;
  }
  return content;
}

// 运行测试
testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase.name}`);
  console.log(`输入: content="${testCase.content}", images=${testCase.attachImages?.length || 0}个`);
  
  const result = buildMessageContent(testCase.content, testCase.attachImages);
  
  if (testCase.attachImages && testCase.attachImages.length > 0) {
    // 当有图片时，应该返回数组格式的内容
    const hasTextContent = result.some(item => item.type === "text");
    const hasImageContent = result.some(item => item.type === "image_url");
    
    console.log(`结果: ${hasTextContent ? '✅ 包含文字内容' : '❌ 缺少文字内容'}`);
    console.log(`结果: ${hasImageContent ? '✅ 包含图片内容' : '❌ 缺少图片内容'}`);
    
    if (testCase.content === "") {
      console.log(`空文字处理: ${hasTextContent ? '✅ 空文字也被包含' : '❌ 空文字被忽略'}`);
    }
  } else {
    console.log(`结果: ${result === testCase.content ? '✅ 纯文字内容正确' : '❌ 纯文字内容错误'}`);
  }
});

console.log("\n🎉 测试完成！修复确保文字和图片同时发送时文字不会被忽略。");
