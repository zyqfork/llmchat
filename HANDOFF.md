# HANDOFF — llmchat 项目交接文档

## 项目状态：可继续开发

所有更改已提交（最新 commit: `68cfada4`），当前工作区有未提交的优先级 2 改动（见下方表格）。以下按优先级列出已处理和待完成事项。

---

## ✅ 本次完成内容

| 事项 | 状态 | 说明 |
|------|------|------|
| 🔴 发送按钮尺寸问题 | ✅ 已修复 | CSS 特异性冲突：`.chat-input-send` → `.chat-input-panel .chat-input-send` |
| 🔴 思考过程样式不一致 | ✅ 已修复 | 完成后的 `PiThinkingBlock` 改为复用流式的 `ThinkCollapse`（antd Collapse），样式/行为完全统一 |
| 🔴 思考内容展开溢出 | ✅ 已修复 | SCSS 嵌套类名与 JS 键不匹配（`pi-thinking-text` vs `pi-thinking-block-text`），`<pre>` 落到默认 `white-space: pre` 不换行；嵌套类移至顶层 |
| 🟡 2.1 `@lobehub/icons` 替换 | ⏸ 进行中 | 31 图标类型仅 13 个有本地 SVG，替换范围较大 |
| 🟡 2.2 `estimateTokenLength` 精确化 | ✅ 已完成 | 改为词边界分组估算（字母 3.5/1 token、数字 3/1、Unicode 2/字符），测试同步更新 |
| 🟡 2.3 `getModelCapabilities` 冗余 | ✅ 已完成 | 移除正则启发式后备 `getEnhancedModelCapabilities`，配置外模型默认无能力 |
| 🟢 3.1 核心 Store 纯函数测试 | ✅ 完成 | 20 个测试（`chat-utils.test.ts`） |
| 🟢 3.2 LLM Adapter 测试 | ✅ 完成 | 31 个测试（`llm-adapter.test.ts`） |

---

## 🔴 优先级 1：发送按钮尺寸问题（✅ 已修复）

**问题**：ChatInputBox 中的发送按钮变得"非常大"（占满输入面板高度）。

**根因**：CSS 模块加载顺序导致层叠冲突。
- `.icon-button` 定义 `position: relative`（`button.module.scss`）
- `.chat-input-send` 定义 `position: absolute`（`chat.module.scss`）
- 两者特异性相同（0-1-0），最终生效取决于样式表加载顺序
- 当 button 模块的 CSS 后于 chat 模块加载时（静态导出中确认为此顺序），`position: relative` 胜出
- 按钮脱离绝对定位，成为 flex 容器（`chat-input-panel-inner`）的 flex 项目
- `align-items: stretch` 默认值使按钮纵伸到容器全高 → "变得非常大"

**修复**：将 `.chat-input-send` 改为 `.chat-input-panel .chat-input-send`，特异性从 0-1-0 提升至 0-2-0，`position: absolute` 在任何加载顺序下都胜出。

**验证**：
- `yarn tsc --noEmit` ✅
- `yarn export` 构建成功，编译后 CSS 中 selector 正确为双类选择器 ✅
- 81 测试全部通过 ✅

---

## 🟡 优先级 2：代码库优化

### 2.1 `@lobehub/icons` 替换（⏸ 进行中）
- **现状**：引入了 860KB 的 `@lobehub/icons` 包，实际只用 ~12 个图标
- **方案**：改用 `app/icons/llm-icons/` 中的直接 SVG 导入
- **文件**：`app/utils/lobehub-icons.tsx`
- **阻碍**：31 个 `ModelIconType` 仅 13 个有本地 SVG（claude/deepseek/doubao/gemini/gemma/grok/meta/mistral/moonshot/ollama/openai/qwen/default），需补齐 18+ 个 SVG 或为缺失的厂商提供回退图标

### 2.2 `estimateTokenLength` 精确化（✅ 已完成）
- `app/utils/token.ts` 由逐字符启发式改为词边界分组估算：
  - 英文字母词：`length / 3.5 + 0.5`（约每 3.5 字母 1 token）
  - 数字串：`length / 3.0 + 0.25`
  - 中文/日文等 Unicode：`2.0 / 字符`
  - 标点：`0.2 / 字符`，结果向上取整
- `app/utils/token.test.ts` 同步更新为 6 个测试（单调性、CJK > ASCII、非空 > 0 等）
- 未引入 `tiktoken`（+3MB bundle 不划算，启发式已足够上下文管理使用）

### 2.3 `getModelCapabilities` 冗余（✅ 已完成）
- 移除 `getEnhancedModelCapabilities` 的正则启发式后备（`/vision|o1|claude-3/` 等易脆弱的模式匹配）
- 配置中找不到模型时默认返回空能力（`{}`），不再凭模型名猜测
- 函数本身仍保留（读取 Pi 目录 `reasoning`/`tool_call`/`input` 字段 + localStorage 用户覆盖），改动面小、行为更可预测

---

## 🟢 优先级 3：测试覆盖扩展

### 3.1 核心 Store 纯函数测试（✅ 已添加，20 个测试）
- `app/store/chat-utils.test.ts` — 测试 `createMessage`、`buildUserMessagesText`、`buildTopicPrompt`、`buildTopicRequestMessages`、`countUserMessages`、`countUserTokens`、`buildConversationTranscript`、`fillTemplateWith`
- 已将上述函数从 `function` 改为 `export function` 以便测试

### 3.2 LLM Adapter 测试（✅ 已添加，31 个测试）
- `app/client/llm-adapter.test.ts` — 测试 `getFetchUrl`、`extractSystemPrompt`、`dataUrlToPiImageContent`、`toPiUserContent`、`toTextContent`、`isOpenAIProtocolSdk`、`resolvePiApiType`、`resolveCompat`
- 已将上述辅助函数从 `function` 改为 `export function` 以便测试

### 3.3 剩余待测试文件
- `app/client/pi-agent-bridge.ts` — 已有 4 个测试，可扩展覆盖更多失败路径
- `app/client/llm-adapter.ts` — 新增 31 个测试覆盖纯函数，`streamText`/`generateText` 流程测试需模拟 Pi SDK
- `app/store/chat.ts` — 已有测试覆盖导出工具函数；`useChatStore` 核心流程（消息发送、流式接收）需模拟 `getClientApi`

### 已有测试（131 个，13 个套件）
- `app/utils/token.test.ts` (34)
- `app/client/pi-agent-bridge.test.ts` (119)
- `app/client/llm-adapter.test.ts` (31, 新增)
- `app/client/mcp-tool-executor.test.ts` (68)
- `app/components/chat/PiContentBlock.test.tsx` (98)
- `app/store/chat-mcp.test.ts` (168)
- `app/store/chat-utils.test.ts` (180, 新增)
- `utils/semver.test.ts`
- `utils/merge.test.ts`
- `utils/merge-with-update.test.ts`
- `components/emoji.test.tsx`
- `core/compaction/policy.test.ts`

### 构建验证清单

所有以下命令当前通过：
- `yarn tsc --noEmit` — TypeScript 类型检查
- `yarn test:ci --runInBand` — 131 个测试（13 个套件）
- `yarn eslint` — ESLint
- `yarn export` — 静态导出（46 页）
- `yarn build` — Standalone 构建
- `yarn electron-builder --win nsis` — Electron 桌面端（可选）
- `yarn tauri build --bundles nsis` — Tauri 桌面端（NSIS 签名未配置，可选 `--no-bundle` 绕过）

---

## 📁 关键文件索引

| 文件 | 用途 |
|------|------|
| `app/client/llm-adapter.ts` | LLM 适配器，路由 Pi Agent / 直接流式 |
| `app/client/pi-agent-bridge.ts` | Pi Agent 桥接（工具转换、事件映射） |
| `app/client/model-service.ts` | 模型目录解析（动态懒加载） |
| `app/store/chat.ts` | 聊天状态管理 + MCP 集成 |
| `app/components/chat/ChatInputBox.tsx` | 输入框 + 发送按钮 |
| `app/components/chat/ChatInput.tsx` | **死代码**，未被引用 |
| `app/components/button.tsx` | IconButton 组件 |
| `app/components/chat.module.scss` | 聊天组件样式 |
| `app/components/button.module.scss` | 按钮样式 |
| `app/config/model-config.ts` | 模型配置（思考级别、能力） |
| `app/utils/pi-ai-resolver.ts` | Pi AI 模型解析 |
| `app/mcp/actions.client.ts` | MCP 客户端运行时 |

---

## 🧩 MCP 功能流程

用户启用 MCP → `getMcpSystemPrompt()` 注入 system prompt → `getMcpTools()` 返回 Function Call 工具 → `llm-adapter.ts` 检测 `agentTools.length > 0` → `createPiAgentRun()` 创建 Pi Agent → `toAgentTools()` 转换为 Pi Agent 工具 → 模型返回 toolCall → `executeMcpToolCall()` 解析 `_mcpMeta` → `executeMcpAction()` → MCP 客户端执行 → 工具结果返回模型 → 最终回复