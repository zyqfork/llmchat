# HANDOFF — llmchat 项目交接文档

## 项目状态：可继续开发

所有更改已提交（最新 commit: `7ad54742`），工作树干净。以下按优先级列出已处理和待完成事项。

---

## ✅ 本次完成内容

| 事项 | 状态 | 说明 |
|------|------|------|
| 🔴 发送按钮尺寸问题 | ✅ 已修复 | CSS 特异性冲突：`.chat-input-send` → `.chat-input-panel .chat-input-send` |
| 🟡 2.1 `@lobehub/icons` 替换 | ⏸ 保留 | 评估后 31 图标类型仅 13 个有本地 SVG，替换范围较大 |
| 🟡 2.2 `estimateTokenLength` 精确化 | 评估后保留 | 当前启发式足以满足上下文管理需求 |
| 🟡 2.3 `getModelCapabilities` 冗余 | 评估后保留 | 涉及 18+ 引用处，改动面大；已导出内部函数测试 |
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

## 🟡 优先级 2：代码库优化（已识别但未实施）

### 2.1 `@lobehub/icons` 替换
- **现状**：引入了 860KB 的 `@lobehub/icons` 包，实际只用 ~12 个图标
- **方案**：改用 `app/icons/llm-icons/` 中的直接 SVG 导入
- **文件**：`app/utils/lobehub-icons.tsx`

### 2.2 `estimateTokenLength` 精确化
- **现状**：`app/utils/token.ts` 使用粗略字符启发式（0.25 字母 / 0.5 ASCII / 1.5 Unicode）
- **方案**：可选引入 `tiktoken`（~3MB bundle），或使用 Pi SDK 内置的 token 计数

### 2.3 `getModelCapabilities` 冗余
- **现状**：`app/config/model-config.ts` 中的 `getModelCapabilities` 复制了 Pi `Model` 类型字段（`reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`）
- **方案**：直接使用 Pi 提供的 `Model` 信息

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

### 已有测试（132 个，13 个套件）
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
- `yarn test:ci --runInBand` — 132 个测试（13 个套件）
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