# HANDOFF — llmchat 项目交接文档

## 项目状态：可继续开发

所有更改已提交（最新 commit: `a9fa8d9` — fix(config): correct export mode detection and dev command setup），工作区干净。以下按优先级列出已处理和待完成事项。

**测试覆盖**: 164 tests / 14 suites ✅
**TypeScript**: clean ✅
**ESLint**: clean ✅
**Export build**: 46 pages ✅
**所有检查通过**: tsc / lint / tests / export ✅

---

## 🔧 Tauri 构建签名 workaround

NSIS 安装程序签名需要 `TAURI_SIGNING_PRIVATE_KEY` 环境变量。未配置时构建失败。

**绕过方案**：使用 `--no-sign` 跳过签名：
powershell.exe -NoProfile -Command '$env:PATH = "C:\\Users\\zyq\\scoop\\apps\\rustup-gnu\\current\\.cargo\\bin;" + $env:PATH; yarn tauri build --bundles nsis --no-sign'

或者设置 `certificateThumbprint` 为 `null`（已在 `tauri.conf.json` 中配置）。

---

---

## ✅ 本次完成内容

| 事项 | 状态 | 说明 |
|------|------|------|
| 🔴 发送按钮尺寸问题 | ✅ 已修复 | CSS 特异性冲突：`.chat-input-send` → `.chat-input-panel .chat-input-send` |
| 🔴 思考过程样式不一致 | ✅ 已修复 | 完成后的 `PiThinkingBlock` 改为复用流式的 `ThinkCollapse`（antd Collapse），样式/行为完全统一 |
| 🔴 思考内容展开溢出 | ✅ 已修复 | SCSS 嵌套类名与 JS 键不匹配（`pi-thinking-text` vs `pi-thinking-block-text`），`<pre>` 落到默认 `white-space: pre` 不换行；嵌套类移至顶层 |
| 🟡 2.1 `@lobehub/icons` 替换 | ✅ 已完成 | 本地 llm-icons SVG 已移除，`emoji.tsx`/`provider-icon.tsx` 统一使用 `@lobehub/icons`（Colored/Mono 变体），减少维护两套图标集的成本 |
| 🟡 2.2 `estimateTokenLength` 精确化 | ✅ 已完成 | 改为词边界分组估算（字母 3.5/1 token、数字 3/1、Unicode 2/字符），测试同步更新 |
| 🟡 2.3 `getModelCapabilities` 冗余 | ✅ 已完成 | 移除正则启发式后备 `getEnhancedModelCapabilities`，配置外模型默认无能力 |
| 🟢 3.1 核心 Store 纯函数测试 | ✅ 完成 | 20 个测试（`chat-utils.test.ts`） |
| 🟢 3.2 LLM Adapter 测试 | ✅ 完成 | 31 个测试（`llm-adapter.test.ts`） |
| 🗑️ 死代码清理 | ✅ 已完成 | 移除未引用的 `app/components/chat/ChatInput.tsx` |
| 🏷️ 版本同步 | ✅ 已完成 | 同步应用版本至 `v2.29.0`（`package.json`, `tauri.conf.json`, `Cargo.toml`） |

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
- 164 测试全部通过（14 个套件） ✅

---

## 🟡 优先级 2：代码库优化

### 2.1 `@lobehub/icons` 替换（✅ 已完成）
- `app/icons/lm-icons/` 目录已删除（13 个本地 SVG）
- `app/components/emoji.tsx`：MODEL_ICON_MAP 改用 `@lobehub/icons`（有 Color 变体的用 `.Color`，无的用默认 mono；OpenAI 用 `.Avatar`）
- `app/components/provider-icon.tsx`：`ModelAvatar`（fallback 兜底）改用 `@lobehub/icons` 统一图标
- 新增 `app/test-shims/lobehub-icons.ts` 作为 Jest mock（避免 ESM 模块兼容 + `matchMedia` 缺失）
- `jest.config.ts` 增加 `@lobehub/icons` 的 `moduleNameMapper` 重定向
- 图标外观从原来的 30px 圆角方块品牌标变为 lobehub 的 Color/Mono 品牌标（视觉风格统一、无需维护两套图标）

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

### 3.1 核心 Store 纯函数测试（✅ 已添加，33 个测试）
- `app/store/chat-core.test.ts` — 测试 `createMessage`、`countUserMessages`、`countUserTokens`、`buildConversationTranscript`、`buildUserMessagesText`、`buildTopicPrompt`、`buildTopicRequestMessages`、`fillTemplateWith`
- 已将上述函数从 `function` 改为 `export function` 以便测试
- 额外的 `app/store/chat-utils.test.ts` 有 20 个测试
- 额外的 `app/store/chat-mcp.test.ts` 有 14 个测试

### 3.2 LLM Adapter 测试（✅ 已添加，31 个测试）
- `app/client/llm-adapter.test.ts` — 测试 `getFetchUrl`、`extractSystemPrompt`、`dataUrlToPiImageContent`、`toPiUserContent`、`toTextContent`、`isOpenAIProtocolSdk`、`resolvePiApiType`、`resolveCompat`
- 已将上述辅助函数从 `function` 改为 `export function` 以便测试

### 3.3 剩余待测试文件
- `app/client/pi-agent-bridge.ts` — 已有 4 个测试，可扩展覆盖更多失败路径
- `app/client/llm-adapter.ts` — 新增 31 个测试覆盖纯函数，`streamText`/`generateText` 流程测试需模拟 Pi SDK
- `app/store/chat.ts` — 已有测试覆盖导出工具函数；`useChatStore` 核心流程（消息发送、流式接收）需模拟 `getClientApi`

### 已有测试（164 个，14 个套件）
- `app/utils/token.test.ts` (6)
- `app/client/pi-agent-bridge.test.ts` (4)
- `app/client/llm-adapter.test.ts` (31)
- `app/client/mcp-tool-executor.test.ts` (4)
- `app/client/model-service.test.ts` (3)
- `app/store/chat-mcp.test.ts` (14)
- `app/store/chat-utils.test.ts` (20)
- `app/utils/semver.test.ts` (25)
- `app/utils/merge.test.ts` (7)
- `app/utils/merge-with-update.test.ts` (5)
- `app/components/emoji.test.tsx` (4)
- `app/components/chat/PiContentBlock.test.tsx` (6)
- `app/core/compaction/policy.test.ts` (3)

### 构建验证清单

所有以下命令当前通过：
- `yarn tsc --noEmit` — 类型检查 ✅
- `yarn test:ci --runInBand` — 164 个测试（14 个套件）✅
- `yarn eslint` — ESLint ✅
- `yarn export` — 静态导出（46 页）✅
- `yarn build` — Standalone 构建 ✅

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
| `app/test-shims/lobehub-icons.ts` | `@lobehub/icons` Jest mock（ESM 兼容） |
| `app/mcp/actions.client.ts` | MCP 客户端运行时 |

---

## 🧩 MCP 功能流程

用户启用 MCP → `getMcpSystemPrompt()` 注入 system prompt → `getMcpTools()` 返回 Function Call 工具 → `llm-adapter.ts` 检测 `agentTools.length > 0` → `createPiAgentRun()` 创建 Pi Agent → `toAgentTools()` 转换为 Pi Agent 工具 → 模型返回 toolCall → `executeMcpToolCall()` 解析 `_mcpMeta` → `executeMcpAction()` → MCP 客户端执行 → 工具结果返回模型 → 最终回复