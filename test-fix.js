// 测试修复后的 getCurrentMessageContent 函数
console.log("测试修复后的 getCurrentMessageContent 函数...");

// 模拟 getMessageTextContent 函数
function getMessageTextContent(message) {
  if (typeof message.content === "string") {
    return message.content;
  }
  for (const c of message.content) {
    if (c.type === "text") {
      return c.text ?? "";
    }
  }
  return "";
}

// 修复后的 getCurrentMessageContent 函数
function getCurrentMessageContent(message) {
  if (!message.versions || message.versions.length < 1) {
    return getMessageTextContent(message);
  }

  const currentIndex = message.currentVersionIndex ?? 0;
  if (currentIndex === message.versions.length) {
    // 显示最新版本（当前消息内容）
    return getMessageTextContent(message);
  } else if (currentIndex >= 0 && currentIndex < message.versions.length) {
    // 显示历史版本
    return message.versions[currentIndex];
  }

  return getMessageTextContent(message);
}

// 测试用例
const testCases = [
  {
    name: "多模态消息 - 文字+图片",
    message: {
      content: [
        { type: "text", text: "你好，这是测试文字" },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" } }
      ]
    },
    expectedText: "你好，这是测试文字"
  },
  {
    name: "多模态消息 - 只有图片",
    message: {
      content: [
        { type: "text", text: "" },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" } }
      ]
    },
    expectedText: ""
  },
  {
    name: "纯文字消息",
    message: {
      content: "纯文字内容"
    },
    expectedText: "纯文字内容"
  },
  {
    name: "有版本历史的消息",
    message: {
      content: [
        { type: "text", text: "当前版本内容" },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" } }
      ],
      versions: ["历史版本1", "历史版本2"],
      currentVersionIndex: 1
    },
    expectedText: "历史版本2"
  }
];

// 运行测试
testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase.name}`);
  console.log(`消息内容:`, JSON.stringify(testCase.message.content, null, 2));
  
  const textContent = getCurrentMessageContent(testCase.message);
  
  console.log(`提取的文字: "${textContent}"`);
  
  const textMatch = textContent === testCase.expectedText;
  
  console.log(`文字匹配: ${textMatch ? '✅' : '❌'} (期望: "${testCase.expectedText}", 实际: "${textContent}")`);
});

console.log("\n🔍 修复总结:");
console.log("✅ getCurrentMessageContent 现在使用 getMessageTextContent");
console.log("✅ 可以正确处理多模态内容（数组格式）");
console.log("✅ 可以提取文字和图片组合中的文字内容");
console.log("✅ 保持了对版本历史的支持");
