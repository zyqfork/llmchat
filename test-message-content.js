// 测试消息内容处理逻辑
console.log("测试消息内容处理...");

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

// 模拟 getMessageImages 函数
function getMessageImages(message) {
  if (typeof message.content === "string") {
    return [];
  }
  const urls = [];
  for (const c of message.content) {
    if (c.type === "image_url") {
      urls.push(c.image_url?.url ?? "");
    }
  }
  return urls;
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
    expectedText: "你好，这是测试文字",
    expectedImages: ["data:image/jpeg;base64,/9j/4AAQSkZJRg=="]
  },
  {
    name: "多模态消息 - 只有图片",
    message: {
      content: [
        { type: "text", text: "" },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64,/9j/4AAQSkZJRg==" } }
      ]
    },
    expectedText: "",
    expectedImages: ["data:image/jpeg;base64,/9j/4AAQSkZJRg=="]
  },
  {
    name: "纯文字消息",
    message: {
      content: "纯文字内容"
    },
    expectedText: "纯文字内容",
    expectedImages: []
  }
];

// 运行测试
testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase.name}`);
  console.log(`消息内容:`, JSON.stringify(testCase.message.content, null, 2));
  
  const textContent = getMessageTextContent(testCase.message);
  const imageContent = getMessageImages(testCase.message);
  
  console.log(`提取的文字: "${textContent}"`);
  console.log(`提取的图片:`, imageContent);
  
  const textMatch = textContent === testCase.expectedText;
  const imageMatch = JSON.stringify(imageContent) === JSON.stringify(testCase.expectedImages);
  
  console.log(`文字匹配: ${textMatch ? '✅' : '❌'} (期望: "${testCase.expectedText}", 实际: "${textContent}")`);
  console.log(`图片匹配: ${imageMatch ? '✅' : '❌'}`);
});

console.log("\n🔍 分析:");
console.log("1. getMessageTextContent 只返回第一个文本内容");
console.log("2. getMessageImages 返回所有图片URL");
console.log("3. 在聊天界面中，文字和图片是分开显示的");
console.log("4. 问题可能在于消息内容的保存方式，而不是显示方式");
