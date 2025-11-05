# 迁移修复

## 问题

编译时出现错误：
1. Next.js 找不到 `./utils/stream` 模块
2. Rust 编译错误（已解决）

## 修复的文件

### 额外需要迁移的文件（2 个）

1. ✅ `app/utils/chat.ts`
   ```typescript
   // 旧
   import { fetch as tauriFetch } from "./stream";
   
   // 新
   import { fetch as tauriFetch } from "./fetch";
   ```

2. ✅ `app/utils.ts`
   ```typescript
   // 旧
   import { fetch as tauriStreamFetch } from "./utils/stream";
   
   // 新
   import { fetch as tauriStreamFetch } from "./utils/fetch";
   ```

### Rust 后端

3. ✅ `src-tauri/src/main.rs`
   - 保留旧模块引用（兼容性）
   - 添加新的 fetch 模块
   - 注册新命令

## 完整的迁移文件列表

现在总共迁移了 **14 个文件**：

### 大模型平台（9 个）
1. ✅ app/client/platforms/openai.ts
2. ✅ app/client/platforms/anthropic.ts
3. ✅ app/client/platforms/alibaba.ts
4. ✅ app/client/platforms/bytedance.ts
5. ✅ app/client/platforms/deepseek.ts
6. ✅ app/client/platforms/moonshot.ts
7. ✅ app/client/platforms/ollama.ts
8. ✅ app/client/platforms/siliconflow.ts
9. ✅ app/client/platforms/xai.ts

### 云同步（2 个）
10. ✅ app/utils/cloud/webdav.ts
11. ✅ app/utils/cloud/upstash.ts

### MCP（1 个）
12. ✅ app/mcp/transport-factory.ts

### 工具函数（2 个）
13. ✅ app/utils/chat.ts
14. ✅ app/utils.ts

## 现在可以编译了

```bash
yarn app:dev
```

应该可以正常编译和运行了！

## 验证

启动后检查：
- ✅ 没有编译错误
- ✅ 应用正常启动
- ✅ 大模型对话正常
- ✅ 云同步正常
- ✅ MCP 连接正常

## 旧文件

确认一切正常后，可以删除这 4 个旧文件：
- ❌ app/utils/stream.ts
- ❌ app/utils/tauri-proxy.ts
- ❌ src-tauri/src/stream.rs
- ❌ src-tauri/src/proxy_command.rs
