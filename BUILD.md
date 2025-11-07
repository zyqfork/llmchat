# 构建说明

## 普通构建（生产版本）

生产版本会启用代码压缩，移除 console 日志，不包含开发者工具：

```bash
yarn app:build
```

## 调试构建

调试版本会禁用代码压缩，保留 console 日志，启用 source maps，并自动打开开发者控制台：

```bash
yarn app:build:debug
```

### 调试构建特性

1. **禁用代码压缩**：代码不会被压缩，便于阅读和调试
2. **保留 console 日志**：所有 console.log 都会保留
3. **启用 source maps**：可以在开发者工具中看到原始代码
4. **自动打开开发者控制台**：应用启动时会自动打开 DevTools

## 环境变量

- `DEBUG_BUILD=true`：启用调试模式（Next.js 层面）
- `--features debug-devtools`：启用开发者工具（Tauri 层面）

## 构建产物

构建完成后，安装包位于：

- MSI 安装包：`src-tauri/target/release/bundle/msi/LLMChat_*.msi`
- NSIS 安装包：`src-tauri/target/release/bundle/nsis/LLMChat_*-setup.exe`
