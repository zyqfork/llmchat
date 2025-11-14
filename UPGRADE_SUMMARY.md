# Tauri 升级总结

## ✅ 升级完成

您的项目已成功从 **Tauri 1.5** 升级到 **Tauri 2.9.2**！

## 📋 已修改的文件

### Rust 后端
1. **src-tauri/Cargo.toml**
   - 更新 tauri 到 2.9
   - 添加所有插件依赖（shell, dialog, clipboard-manager, fs, notification, http, window-state, updater, process）

2. **src-tauri/src/main.rs**
   - 使用新的插件初始化系统
   - `Window` → `WebviewWindow`
   - `get_window()` → `get_webview_window()`

3. **src-tauri/src/fetch.rs**
   - 所有 `tauri::Window` 改为 `tauri::WebviewWindow`

4. **src-tauri/tauri.conf.json**
   - 完全重写为 Tauri 2 格式
   - 使用新的 schema
   - 移除 allowlist，改用 capabilities

5. **src-tauri/capabilities/default.json** (新建)
   - 定义应用权限

### 前端代码
1. **package.json**
   - `@tauri-apps/api`: 1.5.3 → 2.9.0
   - `@tauri-apps/cli`: 1.5.11 → 2.9.4

2. **app/utils/fetch.ts**
   - 使用动态导入 `@tauri-apps/api/core` 和 `@tauri-apps/api/event`
   - 更新 listen API 调用

3. **app/utils.ts**
   - 剪贴板: 使用 `@tauri-apps/plugin-clipboard-manager`
   - 对话框: 使用 `@tauri-apps/plugin-dialog`
   - 文件系统: 使用 `@tauri-apps/plugin-fs`
   - 更新器: 使用 `@tauri-apps/plugin-updater` 和 `@tauri-apps/plugin-process`

4. **app/components/exporter.tsx**
   - 更新文件保存功能使用新的插件 API

5. **app/store/update.ts**
   - 更新通知功能使用 `@tauri-apps/plugin-notification`

6. **app/global.d.ts**
   - 简化 `__TAURI__` 类型定义为 boolean

### 文档
1. **TAURI_V2_MIGRATION.md** - 详细迁移指南
2. **upgrade-tauri.md** - 升级说明
3. **test-tauri-upgrade.bat** - Windows 测试脚本
4. **test-tauri-upgrade.sh** - Linux/Mac 测试脚本

## 🚀 下一步操作

### 1. 安装依赖
```bash
# Windows
yarn install

# 或使用测试脚本
test-tauri-upgrade.bat
```

```bash
# Linux/Mac
yarn install

# 或使用测试脚本
chmod +x test-tauri-upgrade.sh
./test-tauri-upgrade.sh
```

### 2. 测试开发模式
```bash
yarn app:dev
```

### 3. 构建应用
```bash
yarn app:build
```

## 🔑 关键变更

### API 导入变化
```typescript
// ❌ Tauri 1.x
const { invoke } = window.__TAURI__;

// ✅ Tauri 2.x
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
```

### 插件系统
所有功能现在通过独立插件提供：
- `@tauri-apps/plugin-dialog`
- `@tauri-apps/plugin-fs`
- `@tauri-apps/plugin-clipboard-manager`
- `@tauri-apps/plugin-notification`
- `@tauri-apps/plugin-updater`
- `@tauri-apps/plugin-process`
- `@tauri-apps/plugin-shell`
- `@tauri-apps/plugin-http`
- `@tauri-apps/plugin-window-state`

### 权限系统
Tauri 2 使用新的 capabilities 系统，权限在 `src-tauri/capabilities/default.json` 中定义。

## ⚠️ 注意事项

1. **Rust 版本**: 确保 Rust >= 1.70
   ```bash
   rustc --version
   rustup update
   ```

2. **WebView2 (Windows)**: 可能需要更新 WebView2 运行时

3. **权限配置**: 如果某些功能不工作，检查 capabilities 配置

4. **yarn.lock**: 运行 `yarn install` 后会自动更新

## 📚 参考资料

- [Tauri 2.0 官方迁移指南](https://v2.tauri.app/start/migrate/)
- [Tauri 2.0 API 文档](https://v2.tauri.app/reference/)
- [插件文档](https://v2.tauri.app/plugin/)
- [权限系统](https://v2.tauri.app/security/capabilities/)

## 🐛 问题排查

如果遇到问题，请查看：
1. `TAURI_V2_MIGRATION.md` - 详细的迁移说明
2. `upgrade-tauri.md` - 常见问题和解决方案
3. 运行测试脚本检查环境配置

---

升级完成！如有问题，请参考上述文档或查看 Tauri 官方文档。
