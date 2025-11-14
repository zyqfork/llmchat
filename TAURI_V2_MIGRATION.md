# Tauri 2.9 升级指南

本项目已从 Tauri 1.5 升级到 Tauri 2.9。以下是主要变更和升级步骤。

## 主要变更

### 1. 依赖更新

**package.json:**
- `@tauri-apps/api`: 1.5.3 → 2.9.0
- `@tauri-apps/cli`: 1.5.11 → 2.9.4

**Cargo.toml:**
- `tauri`: 1.5.4 → 2.9
- `tauri-build`: 1.5.1 → 2.9
- 插件系统重构，所有功能现在通过独立插件提供

### 2. 配置文件变更

**tauri.conf.json** 结构完全重写：
- 使用新的 schema: `https://schema.tauri.app/config/2`
- `allowlist` 系统被移除，改用 `capabilities` 权限系统
- `build.devPath` → `build.devUrl`
- `build.distDir` → `build.frontendDist`
- `tauri.windows` → `app.windows`
- `tauri.security` → `app.security`
- `tauri.updater` → `plugins.updater`

### 3. 权限系统 (Capabilities)

Tauri 2 引入了新的权限系统，需要在 `src-tauri/capabilities/` 目录下定义权限：

```json
{
  "identifier": "default",
  "permissions": [
    "core:default",
    "shell:allow-open",
    "dialog:default",
    // ... 其他权限
  ]
}
```

### 4. Rust API 变更

**主要变更:**
- `tauri::Window` → `tauri::WebviewWindow`
- `app.get_window()` → `app.get_webview_window()`
- 所有功能通过插件系统初始化

**插件初始化:**
```rust
tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    // ... 其他插件
```

### 5. JavaScript API 变更

**导入路径变更:**
```typescript
// Tauri 1.x
const { invoke } = window.__TAURI__;

// Tauri 2.x
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
```

## 升级步骤

### 1. 安装依赖

```bash
# 删除旧的依赖
yarn install

# 或使用 npm
npm install
```

### 2. 更新 Rust 依赖

```bash
cd src-tauri
cargo update
cargo build
```

### 3. 测试应用

```bash
# 开发模式
yarn app:dev

# 构建
yarn app:build
```

## 注意事项

1. **开发者工具**: 在 Tauri 2 中，需要使用 `get_webview_window()` 而不是 `get_window()`

2. **权限配置**: 确保在 `capabilities/default.json` 中配置了所有需要的权限

3. **插件依赖**: 所有 Tauri 插件现在都是独立的 crate，需要在 `Cargo.toml` 中单独声明

4. **API 兼容性**: 前端代码中使用动态导入以保持向后兼容：
   ```typescript
   const { invoke } = await import("@tauri-apps/api/core");
   ```

## 已知问题

- 如果遇到编译错误，请确保 Rust 版本 >= 1.70
- Windows 用户可能需要更新 WebView2 运行时

## 参考资料

- [Tauri 2.0 迁移指南](https://v2.tauri.app/start/migrate/)
- [Tauri 2.0 发布说明](https://v2.tauri.app/blog/tauri-2-0/)
- [权限系统文档](https://v2.tauri.app/security/capabilities/)
