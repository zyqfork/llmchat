# 模型图标优化和新模型支持

## 修改日期
- 初始版本：2025-12-30
- 最新更新：2025-12-30（添加 GPT-5.1/5.2、Claude 4.5、Gemini 3 支持）

## 修改内容

### 1. 统一聊天界面和模型管理列表的图标显示

#### 问题
- 聊天界面右下角的模型图标使用的是 `@lobehub/icons` 库的图标（带背景色）
- 模型管理列表使用的是项目自带的 SVG 图标
- 两者显示风格不一致，用户体验不佳

#### 解决方案
修改 `app/components/chat.tsx`，将聊天界面右下角的图标从 `ProviderIcon` 改为 `ModelProviderIcon`：

```typescript
// 修改前
<ProviderIcon
  provider={currentProviderName}
  size={16}
  modelName={currentModel}
/>

// 修改后
<ModelProviderIcon
  provider={currentProviderName}
  size={16}
  modelName={currentModel}
/>
```

同时更新 `app/components/chat.module.scss` 中的样式，使用 Grid 布局确保图标居中：

```scss
.model-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: grid;
  place-items: center;

  .no-dark {
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
  }

  svg {
    display: block !important;
    width: 16px !important;
    height: 16px !important;
  }
}
```

### 2. 修复模型管理列表图标显示问题

#### 问题
- 模型图标只显示左上角部分
- SVG 的 `viewBox` 属性在编译时被 SVGO 移除

#### 解决方案

**a. 配置 SVGR 保留 viewBox**

修改 `next.config.mjs`，配置 `@svgr/webpack` 禁用 `removeViewBox` 优化：

```javascript
config.module.rules.push({
  test: /\.svg$/,
  use: [
    {
      loader: "@svgr/webpack",
      options: {
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
          ],
        },
      },
    },
  ],
});
```

**b. 优化 CSS 样式**

修改 `app/components/model-manager.module.scss`，使用 Grid 布局确保图标完美居中：

```scss
.model-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: var(--second);
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;

  .no-dark {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
  }

  svg {
    display: block !important;
    width: 24px !important;
    height: 24px !important;
  }
}
```

### 3. 增加新模型支持

#### 更新的模型识别逻辑

修改 `app/components/provider-icon.tsx`，增加对以下新模型的支持：

1. **GPT-5 系列**
   - gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-chat

2. **Claude 4.x 系列**
   - claude-opus-4-1-20250805
   - claude-sonnet-4-20250514, claude-opus-4-20250514
   - claude-3-7-sonnet-20250219

3. **Gemini 2.x 系列**
   - gemini-2.5-pro, gemini-2.5-flash
   - gemini-2.0-flash
   - learnlm-1.5-pro-experimental

4. **DeepSeek V3 和 Reasoner**
   - deepseek-reasoner
   - deepseek-v3 (通过豆包平台)

5. **Qwen 3 系列**
   - qwen3-235b-a22b, qwen3-32b-fp8, qwen3-8b

6. **Doubao 1.5 系列**
   - doubao-1-5-pro-32k-250115
   - doubao-1-5-thinking-pro-m
   - doubao-1-5-vision-pro-32k-250115

7. **Kimi K2 系列**
   - kimi-k2, kimi-latest, kimi-thinking-preview

8. **Grok 3 系列**
   - grok-3, grok-3-fast, grok-3-mini

9. **Ollama**
   - 添加 Ollama 模型支持

10. **Mistral 系列**
    - mistral-* 前缀的模型

#### 更新的知识截止日期

在 `app/constant.ts` 中更新了 `KnowledgeCutOffDate`，为新模型添加知识截止日期：

- Gemini 系列：2024-05 到 2024-11
- Claude 系列：2023-08 到 2025-03
- DeepSeek：2024-12
- Doubao：2024-10
- Kimi：2024-10
- Qwen：2024-06 到 2024-12
- Grok：2024-10 到 2024-12

#### 更新的视觉模型识别

在 `VISION_MODEL_REGEXES` 中添加了新的视觉模型模式：

- Claude 4/5 系列
- Doubao 1.5 视觉和思考模型
- Grok 3 系列

## 测试建议

1. **图标一致性测试**
   - 检查聊天界面右下角的模型图标
   - 检查模型管理列表中的模型图标
   - 确认两者使用相同的图标风格

2. **图标显示测试**
   - 检查所有服务商的模型图标是否完整显示
   - 确认图标在容器中垂直和水平居中
   - 测试不同尺寸的图标（16px、24px、32px）

3. **新模型支持测试**
   - 添加新模型（如 GPT-5、Claude 4、Gemini 2.5）
   - 确认图标正确识别
   - 确认视觉能力正确识别
   - 确认知识截止日期正确显示

## 影响范围

### 修改的文件
1. `app/components/chat.tsx` - 统一图标组件
2. `app/components/chat.module.scss` - 更新图标样式
3. `app/components/provider-icon.tsx` - 增强模型识别逻辑
4. `app/components/model-manager.module.scss` - 修复图标居中
5. `next.config.mjs` - 配置 SVGR 保留 viewBox
6. `app/constant.ts` - 更新知识截止日期和视觉模型识别

### 用户体验改进
- ✅ 聊天界面和模型管理列表图标风格统一
- ✅ 模型图标完整显示，不再只显示左上角
- ✅ 图标在容器中完美居中
- ✅ 支持最新发布的 AI 模型
- ✅ 正确识别新模型的视觉能力
- ✅ 准确显示新模型的知识截止日期

## 技术要点

1. **Grid 布局**：使用 `display: grid` 和 `place-items: center` 实现完美居中，比 Flexbox 更可靠

2. **SVGR 配置**：通过配置 SVGO 插件禁用 `removeViewBox` 优化，确保 SVG 缩放正确

3. **模型识别优先级**：
   - 优先匹配跨服务商的通用模型名称（如 llama、deepseek、qwen）
   - 再匹配服务商特定的模型前缀

4. **样式覆盖**：使用 `!important` 覆盖 SVG 内联样式，确保尺寸统一

## 最新模型支持（2025-12-30 更新）

### OpenAI 新增模型

**GPT-5.1 系列**（2025年发布）
- `gpt-5.1` - 基础版本
- `gpt-5.1-instant` - 即时模式
- `gpt-5.1-thinking` - 思考模式（推理）
- `gpt-5.1-pro` - Pro 版本
- `gpt-5.1-codex-max` - 编码专用版本

**GPT-5.2 系列**（2025年12月发布）
- `gpt-5.2` - 基础版本
- `gpt-5.2-instant` - 即时模式
- `gpt-5.2-thinking` - 思考模式（推理）
- `gpt-5.2-pro` - Pro 版本，推理时间和计算量最高

**特点：**
- 在专业知识工作方面表现卓越
- SWE-Bench Pro 得分 55.6%，领先竞争对手
- GPQA Diamond 得分 92.4%
- AIME 2025 数学竞赛满分 100%

### Anthropic 新增模型

**Claude 4.5 系列**（2025年11月发布）
- `claude-opus-4-5` - Opus 旗舰版本
- `claude-opus-4-5-20251125` - Opus 带日期版本
- `claude-sonnet-4-5` - Sonnet 版本
- `claude-sonnet-4-5-20251121` - Sonnet 带日期版本

**特点：**
- 世界上最好的编码、代理和计算机使用模型
- SWE-Bench Verified 得分 80.9%，超越 GPT-5.1
- API 价格大幅下降约三分之二
- 输入：5美元/百万tokens，输出：25美元/百万tokens
- 新增 "effort" 参数，可在质量、时间和成本之间平衡

### Google 新增模型

**Gemini 3 系列**（2025年11月发布）
- `gemini-3-pro` - Pro 旗舰版本
- `gemini-3-pro-001` - Pro 带版本号
- `gemini-3-flash` - Flash 快速版本
- `gemini-3-nano` - Nano 轻量版本

**特点：**
- 原生多模态、推理和智能体能力
- LMArena 排行榜 Elo 评分 1501 分，高居榜首
- MMMU-Pro 多模态测试得分 81%，超越 GPT-5.1 (76%) 和 Claude 4.5 (68%)
- MathArena Apex 得分 23.4%，远超其他模型
- GPQA Diamond 准确率 91.9%，展现博士水平推理能力
- 计划将上下文窗口扩展至 200 万 tokens

### 知识截止日期更新

| 模型系列 | 知识截止日期 |
|---------|------------|
| GPT-5.1 系列 | 2025-03 |
| GPT-5.2 系列 | 2025-06 |
| Claude 4.5 系列 | 2025-08 |
| Gemini 3 系列 | 2025-06 |

### 视觉能力更新

新增以下模型的视觉能力识别：
- Gemini 3 系列（全系支持多模态）
- GPT-5.1/5.2 系列（全系支持视觉）
- Claude 4.5 系列（支持视觉和代理能力）

## 后续优化建议

1. 考虑为 Gemma、Mistral 等模型添加专用图标
2. 定期更新新模型列表和知识截止日期
3. 考虑添加模型图标的缓存机制
4. 优化模型识别逻辑的性能
5. 关注各厂商 API 文档更新，及时添加新模型支持

