# 模型更新日志 - 2025年12月30日

## 概述

本次更新添加了三大主流 AI 服务商的最新模型支持：
- **OpenAI**: GPT-5.1、GPT-5.2 系列
- **Anthropic**: Claude 4.5 系列
- **Google**: Gemini 3 系列

## 详细更新内容

### 1. OpenAI 模型更新

#### GPT-5.1 系列
根据搜索结果，GPT-5.1 于 2025 年发布，是 OpenAI 的最新旗舰模型之一。

**新增模型：**
- `gpt-5.1` - 基础版本
- `gpt-5.1-instant` - 即时响应模式
- `gpt-5.1-thinking` - 思考推理模式
- `gpt-5.1-pro` - 专业增强版本
- `gpt-5.1-codex-max` - 编码专用版本（在 SWE-Bench Verified 中得分 77.9%）

**知识截止日期：** 2025-03

#### GPT-5.2 系列
GPT-5.2 于 2025 年 12 月 11 日发布，是目前 OpenAI 最强大的模型。

**新增模型：**
- `gpt-5.2` - 基础版本
- `gpt-5.2-instant` - 即时响应模式
- `gpt-5.2-thinking` - 思考推理模式
- `gpt-5.2-pro` - 专业增强版本，推理时间和计算量最高

**知识截止日期：** 2025-06

**性能亮点：**
- **SWE-Bench Pro**（软件工程）：55.6%，超越 Claude Opus 4.5 (52.0%) 和 Gemini 3 Pro (43.3%)
- **GPQA Diamond**（科学问题）：92.4%，显著超越前代模型
- **AIME 2025**（竞赛数学）：100% 满分
- 在专业知识工作方面表现卓越，被誉为迄今最强模型系列

### 2. Anthropic 模型更新

#### Claude 4.5 系列
Claude 4.5 于 2025 年 11 月发布，主要包括 Opus 和 Sonnet 两个版本。

**新增模型：**
- `claude-opus-4-5` - Opus 旗舰版本
- `claude-opus-4-5-20251125` - Opus 带日期版本（2025年11月25日）
- `claude-sonnet-4-5` - Sonnet 标准版本
- `claude-sonnet-4-5-20251121` - Sonnet 带日期版本（2025年11月21日）

**知识截止日期：** 2025-08

**性能亮点：**
- **编码能力领先**：在 SWE-Bench Verified 中得分 80.9%，超越 GPT-5.1 Codex Max (77.9%) 和 Gemini 3 Pro (76.2%)
- **世界级代理能力**：被誉为"世界上最好的编码、代理和计算机使用模型"
- **价格大幅下降**：API 价格降低约三分之二
  - 输入：从 15 美元降至 5 美元/百万 tokens
  - 输出：从 75 美元降至 25 美元/百万 tokens
- **新功能**：引入 "effort" 参数，允许在输出质量、响应时间和成本之间灵活平衡
- **安全性**：具备严格的安全过滤机制

**适用场景：**
- 需要保持代码风格统一的大型项目
- 深度研究任务
- 日常办公任务（如 PPT、Excel 使用）
- 复杂的计算机操作任务

### 3. Google 模型更新

#### Gemini 3 系列
Gemini 3 Pro 于 2025 年 11 月 19 日发布，是 Google 最先进的多模态大型语言模型。

**新增模型：**
- `gemini-3-pro` - Pro 旗舰版本
- `gemini-3-pro-001` - Pro 带版本号
- `gemini-3-flash` - Flash 快速响应版本
- `gemini-3-nano` - Nano 轻量级版本

**知识截止日期：** 2025-06

**性能亮点：**
- **LMArena 排行榜**：Elo 评分 1501 分，高居榜首
- **多模态推理领先**：
  - MMMU-Pro 测试：81%（GPT-5.1: 76%, Claude 4.5: 68%）
  - 在视觉推理和图像理解方面显著提升
- **数学能力突破**：
  - MathArena Apex 测试：23.4%，远超其他模型
- **科学推理卓越**：
  - GPQA Diamond：91.9% 准确率
  - "人类终极考试"得分率：37.5%
  - 展现博士水平的推理能力
- **多模态原生支持**：
  - 具备原生多模态、推理和智能体等多种能力
  - 在交通灯模拟编程测试中，生成的 Python 代码在物理规律遵循和动画精细度上优于 GPT-4.5 和 Claude 3.7
- **上下文窗口**：计划扩展至 200 万 tokens

**适用场景：**
- 教育领域
- 自动化开发
- 复杂的科学研究
- 多模态应用（图像+文本）

### 4. 图像生成相关

#### Nano Banana（Gemini 2.5 Flash Image）
虽然不在主要模型列表中，但值得注意的是 Google 于 2025 年 8 月推出了 Nano Banana，一个 AI 图像生成与编辑工具，在社群中因其 3D 公仔风格照片而引发风潮。

## 视觉能力更新

在 `VISION_MODEL_REGEXES` 中新增以下识别规则：
- `/gemini-3/` - Gemini 3 系列全系支持多模态

所有新增的 GPT-5.x、Claude 4.5、Gemini 3 系列模型均支持视觉能力。

## 技术实现细节

### 修改的文件

1. **`app/constant.ts`**
   - 在 `openaiModels` 数组中添加 GPT-5.1 和 GPT-5.2 系列模型
   - 在 `googleModels` 数组中添加 Gemini 3 系列模型
   - 在 `anthropicModels` 数组中添加 Claude 4.5 系列模型
   - 更新 `KnowledgeCutOffDate` 映射表
   - 更新 `VISION_MODEL_REGEXES` 视觉模型识别规则

2. **`app/components/provider-icon.tsx`**
   - 图标识别逻辑已支持 GPT-5、Gemini 3、Claude 4.5
   - 通过现有的规则自动识别新模型

### 代码变更统计

- OpenAI 模型：新增 8 个模型
- Anthropic 模型：新增 4 个模型
- Google 模型：新增 4 个模型
- 知识截止日期：新增 16 个条目
- 视觉模型规则：新增 1 个正则表达式

## 测试建议

### 功能测试
1. **模型识别测试**
   - 确认新模型在模型管理器中正确显示
   - 确认模型图标正确识别和显示
   - 确认模型名称和描述正确显示

2. **视觉能力测试**
   - 确认新模型的视觉能力正确识别
   - 测试图片上传功能在新模型中是否正常工作

3. **知识截止日期测试**
   - 确认新模型的知识截止日期正确显示
   - 在系统提示词中验证日期是否正确注入

### 性能测试
1. 测试新模型的 API 调用是否正常
2. 验证流式响应是否工作正常
3. 检查 token 计数是否准确

### 兼容性测试
1. 测试与现有功能的兼容性（MCP、多模型对话等）
2. 验证导入导出功能是否支持新模型
3. 测试模型切换功能是否正常

## 性能对比表

| 基准测试 | GPT-5.2 | Claude 4.5 Opus | Gemini 3 Pro |
|---------|---------|----------------|--------------|
| SWE-Bench Pro | 55.6% | 52.0% | 43.3% |
| SWE-Bench Verified | - | 80.9% | 76.2% |
| GPQA Diamond | 92.4% | - | 91.9% |
| MMMU-Pro | 76% | 68% | 81% |
| MathArena Apex | - | - | 23.4% |
| AIME 2025 | 100% | - | - |

## 定价信息

### Claude 4.5 Opus
- **输入**：5 美元/百万 tokens
- **输出**：25 美元/百万 tokens
- **降价幅度**：约 66%（相比之前的 15/75 美元）

### GPT-5.1/5.2 和 Gemini 3
- 定价信息待官方公布
- 建议查阅各服务商的官方定价页面

## 参考资料

1. **OpenAI GPT-5.2**
   - [维基百科 - GPT-5.2](https://zh.wikipedia.org/wiki/GPT-5.2)
   - [getgpt.pro - GPT-5.2 发布公告](https://getgpt.pro/blog/gpt-5.2-release-announcement)

2. **Anthropic Claude 4.5**
   - [新浪财经 - Claude Opus 4.5 发布](https://finance.sina.com.cn/tech/roll/2025-11-25/doc-infyqumz4932247.shtml)
   - [IT Pro - Claude Opus 4.5 编码领军者](https://www.itpro.com/technology/artificial-intelligence/anthropic-announces-claude-opus-4-5-the-new-ai-coding-frontrunner)

3. **Google Gemini 3**
   - [新浪财经 - Gemini 3 Pro 发布](https://finance.sina.com.cn/tech/roll/2025-11-19/doc-infxwzqk2016225.shtml)
   - [IT Pro - Gemini 3 旗舰模型发布](https://www.itpro.com/technology/artificial-intelligence/google-launches-flagship-gemini-3-model-and-google-antigravity-a-new-agentic-ai-development-platform)

4. **模型对比**
   - [Showapi - 最新 AI 模型对比](https://www.showapi.com/news/article/692036ff4ddd79d13500a2b5)
   - [wbolt.com - Gemini 2.5 Pro vs GPT-4.5](https://www.wbolt.com/gemini-2-5-pro-vs-gpt-4-5.html)

## 注意事项

1. **API 可用性**：某些模型可能需要等待官方 API 正式发布或申请 Beta 访问权限
2. **定价变化**：模型定价可能会随时调整，请以官方最新公告为准
3. **功能限制**：某些高级功能（如 Claude 4.5 的 effort 参数）可能需要 API 更新才能支持
4. **知识截止日期**：标注的截止日期为估算值，实际可能有所不同
5. **性能数据**：基准测试分数来自各官方发布和第三方评测，实际使用效果可能因任务而异

## 下一步计划

1. 监控各服务商 API 文档更新
2. 添加对新模型特殊参数的支持（如 Claude 4.5 的 effort）
3. 收集用户反馈，优化新模型的使用体验
4. 考虑添加模型性能指标展示功能
5. 更新用户文档和使用指南

## 结语

本次更新大幅扩展了对最新 AI 模型的支持，涵盖了三大主流服务商的旗舰产品。这些新模型在编码、科学推理、多模态理解等方面都展现了显著的性能提升，将为用户提供更强大的 AI 能力。

建议用户根据具体需求选择合适的模型：
- **编码任务**：Claude Opus 4.5 表现最佳
- **科学研究**：GPT-5.2 和 Gemini 3 Pro 都有出色表现
- **多模态任务**：Gemini 3 Pro 是最佳选择
- **综合应用**：GPT-5.2 在各项指标上都很均衡
- **成本考虑**：Claude 4.5 降价后性价比显著提升

