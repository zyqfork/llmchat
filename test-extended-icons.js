/**
 * 测试扩展后的图标匹配逻辑
 */

// 模拟扩展后的 ICON_CONFIG
const ICON_CONFIG = {
  // 原有配置
  openai: {
    modelPatterns: ["gpt-3", "gpt-4", "gpt-5", "o1", "o3", "o4", "chatgpt", "dall-e", "dalle", "text-embedding", "ada"],
    providerNames: ["openai"],
    description: "OpenAI 系列"
  },
  deepseek: {
    modelPatterns: ["deepseek"],
    providerNames: ["deepseek"],
    description: "DeepSeek 系列"
  },
  claude: {
    modelPatterns: ["claude"],
    providerNames: ["anthropic"],
    description: "Anthropic Claude 系列"
  },
  qwen: {
    modelPatterns: ["qwen", "qwq", "qvq", "text-embedding-v2", "通义"],
    providerNames: ["alibaba", "alibaba cloud", "阿里巴巴", "阿里云", "通义"],
    description: "阿里云通义千问系列"
  },
  meta: {
    modelPatterns: ["llama", "code-llama", "codellama"],
    providerNames: ["meta", "facebook"],
    description: "Meta LLaMA 系列"
  },
  
  // 新增配置
  chatglm: {
    modelPatterns: ["chatglm", "glm", "zhipu", "智谱", "清言", "qingyan"],
    providerNames: ["zai", "zhipu", "智谱", "智谱ai", "zhipuai"],
    description: "智谱 ChatGLM 系列"
  },
  doubao: {
    modelPatterns: ["doubao", "豆包", "bytedance", "字节", "抖音", "^ep-"], // ^ep- 开头的火山引擎模型
    providerNames: ["bytedance", "字节跳动", "字节", "抖音", "doubao", "豆包", "火山引擎", "volcengine"],
    description: "字节跳动豆包/火山引擎系列"
  },
  mistral: {
    modelPatterns: ["mistral", "mixtral", "codestral", "pixtral"],
    providerNames: ["mistral", "mistral ai"],
    description: "Mistral AI 系列"
  },
  yi: {
    modelPatterns: ["^yi-", "01-ai"],
    providerNames: ["01-ai", "零一万物", "01.ai"],
    description: "零一万物 Yi 系列"
  },
  minimax: {
    modelPatterns: ["minimax", "abab"],
    providerNames: ["minimax", "海螺ai"],
    description: "MiniMax 海螺AI"
  },
  stepfun: {
    modelPatterns: ["^step-", "stepfun"],
    providerNames: ["stepfun", "阶跃星辰"],
    description: "阶跃星辰 Step 系列"
  },
  baichuan: {
    modelPatterns: ["baichuan"],
    providerNames: ["baichuan", "百川智能"],
    description: "百川智能系列"
  },
  iflytek: {
    modelPatterns: ["spark", "讯飞星火"],
    providerNames: ["iflytek", "科大讯飞", "讯飞"],
    description: "科大讯飞星火系列"
  },
  tencent: {
    modelPatterns: ["hunyuan", "混元"],
    providerNames: ["tencent", "腾讯", "腾讯云"],
    description: "腾讯混元系列"
  },
  groq: {
    modelPatterns: ["groq"], // 硬件加速平台
    providerNames: ["groq"],
    description: "Groq 硬件加速平台"
  },
  fireworks: {
    modelPatterns: ["fireworks"],
    providerNames: ["fireworks", "fireworks ai"],
    description: "Fireworks AI 平台"
  }
};

function getModelIconType(modelName) {
  if (!modelName) return null;
  
  const lowerModelName = modelName.toLowerCase();
  
  // 按照模式长度排序，优先匹配更具体的模式
  const sortedConfigs = Object.entries(ICON_CONFIG).sort((a, b) => {
    const maxLengthA = Math.max(...a[1].modelPatterns.map(p => p.length));
    const maxLengthB = Math.max(...b[1].modelPatterns.map(p => p.length));
    return maxLengthB - maxLengthA; // 降序排列，长的优先
  });
  
  for (const [iconType, config] of sortedConfigs) {
    if (config.modelPatterns.some(pattern => {
      const lowerPattern = pattern.toLowerCase();
      // 处理以 ^ 开头的模式（表示字符串开头匹配）
      if (lowerPattern.startsWith('^')) {
        const actualPattern = lowerPattern.substring(1);
        return lowerModelName.startsWith(actualPattern);
      }
      // 普通包含匹配
      return lowerModelName.includes(lowerPattern);
    })) {
      return iconType;
    }
  }
  
  return null;
}

function getProviderIconType(providerName) {
  if (!providerName) return null;
  
  const lowerProviderName = providerName.toLowerCase();
  
  for (const [iconType, config] of Object.entries(ICON_CONFIG)) {
    if (config.providerNames.some(name => 
      lowerProviderName === name.toLowerCase()
    )) {
      return iconType;
    }
  }
  
  return null;
}

console.log("🎯 测试扩展后的图标匹配逻辑（包含特殊匹配规则）");
console.log("=" .repeat(80));

// 测试场景：各种厂商和模型的匹配
const testCases = [
  // 特殊匹配规则测试
  {
    category: "特殊匹配规则",
    cases: [
      { provider: "火山引擎", model: "ep-20241226-c4d57", expectedIcon: "doubao" },
      { provider: "ByteDance", model: "ep-20241220-kmvrc", expectedIcon: "doubao" },
      { provider: "OpenAI", model: "ep-20241201-abc123", expectedIcon: "doubao" }, // 通过OpenAI获取火山引擎模型
      { provider: "SiliconFlow", model: "yi-large", expectedIcon: "yi" },
      { provider: "Together AI", model: "step-1v-32k", expectedIcon: "stepfun" },
    ]
  },
  
  // 国内新增厂商
  {
    category: "国内新增厂商",
    cases: [
      { provider: "零一万物", model: "yi-34b-chat", expectedIcon: "yi" },
      { provider: "01.ai", model: "yi-vision", expectedIcon: "yi" },
      { provider: "海螺AI", model: "abab6.5-chat", expectedIcon: "minimax" },
      { provider: "阶跃星辰", model: "step-1v-8k", expectedIcon: "stepfun" },
      { provider: "百川智能", model: "baichuan2-turbo", expectedIcon: "baichuan" },
      { provider: "科大讯飞", model: "spark-lite", expectedIcon: "iflytek" },
      { provider: "腾讯", model: "hunyuan-pro", expectedIcon: "tencent" },
    ]
  },
  
  // 国外平台
  {
    category: "国外平台",
    cases: [
      { provider: "Groq", model: "llama-3.1-70b-versatile", expectedIcon: "meta" }, // 模型优先
      { provider: "Groq", model: "groq-model", expectedIcon: "groq" }, // 厂商匹配
      { provider: "Fireworks AI", model: "llama-v3p1-405b-instruct", expectedIcon: "meta" },
      { provider: "Fireworks", model: "fireworks-function-v1", expectedIcon: "fireworks" },
    ]
  },
  
  // 跨平台模型（模型名称优先）
  {
    category: "跨平台模型（模型名称优先）",
    cases: [
      { provider: "OpenAI", model: "deepseek-coder-v2", expectedIcon: "deepseek" },
      { provider: "SiliconFlow", model: "claude-3-5-sonnet", expectedIcon: "claude" },
      { provider: "Together AI", model: "meta-llama/Llama-3.2-90B", expectedIcon: "meta" },
      { provider: "Fireworks", model: "mistral-large-latest", expectedIcon: "mistral" },
      { provider: "Groq", model: "qwen2.5-72b-instruct", expectedIcon: "qwen" },
    ]
  },
  
  // 中文厂商名称测试
  {
    category: "中文厂商名称",
    cases: [
      { provider: "字节跳动", model: "doubao-pro-4k", expectedIcon: "doubao" },
      { provider: "阿里云", model: "qwen-max", expectedIcon: "qwen" },
      { provider: "腾讯云", model: "hunyuan-lite", expectedIcon: "tencent" },
      { provider: "百川智能", model: "baichuan2-53b", expectedIcon: "baichuan" },
      { provider: "讯飞", model: "spark-max", expectedIcon: "iflytek" },
    ]
  }
];

testCases.forEach(({ category, cases }) => {
  console.log(`\n📂 ${category}`);
  console.log("-".repeat(60));
  
  cases.forEach(({ provider, model, expectedIcon }, index) => {
    const modelIcon = getModelIconType(model);
    const providerIcon = getProviderIconType(provider);
    const finalIcon = modelIcon || providerIcon || "openai";
    
    const isCorrect = finalIcon === expectedIcon;
    const status = isCorrect ? "✅" : "❌";
    
    console.log(`${index + 1}. ${status} ${provider} → ${model}`);
    console.log(`   模型图标: ${modelIcon || "null"}`);
    console.log(`   厂商图标: ${providerIcon || "null"}`);
    console.log(`   最终图标: ${finalIcon} ${isCorrect ? "(正确)" : `(期望: ${expectedIcon})`}`);
    console.log(`   优先级: ${modelIcon ? "基于模型" : providerIcon ? "基于厂商" : "默认"}`);
    console.log("");
  });
});

console.log("=" .repeat(80));
console.log("🎉 扩展配置测试完成！支持更多厂商和特殊匹配规则。");

// 统计支持的图标类型
const supportedIcons = Object.keys(ICON_CONFIG);
console.log(`📊 当前支持 ${supportedIcons.length} 种图标类型:`);
console.log(`   ${supportedIcons.join(", ")}`);

// 特殊匹配规则统计
console.log(`\n🔍 特殊匹配规则:`);
console.log(`   • ep- 开头模型 → doubao (火山引擎)`);
console.log(`   • yi- 开头模型 → yi (零一万物)`);
console.log(`   • step- 开头模型 → stepfun (阶跃星辰)`);
console.log(`   • 支持中英文厂商名称混合匹配`);
console.log(`   • 模型名称优先级高于厂商名称`);