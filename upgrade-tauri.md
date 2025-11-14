# Tauri 升级完成

## 已完成的更改

### 1. Rust 后端更新
- ✅ 更新 `Cargo.toml` 依赖到 Tauri 2.9
- ✅ 添加所有必需的插件依赖
- ✅ 更新 `main.rs` 使用新的插件系统
- ✅ 更新 `fetch.rs` 使用 `WebviewWindow` 替代 `Window`

### 2. 配置文件更新
- ✅ 重写 `tauri.conf.json` 使用 Tauri 2 格式
- ✅ 创建 `capabilities/default.json` 权限配置

### 3. 前端代码更新
- ✅ 更新 `package.json` 依赖版本
- ✅ 更新 `app/utils/fetch.ts` 使用新的 API 导入
- ✅ 更新 `app/utils.ts` 中的剪贴板、对话框、文件系统 API
- ✅ 更新 `app/components/exporter.tsx` 文件保存功能
- ✅ 更新 `app/store/update.ts` 通知功能
- ✅ 更新 `app/global.d.ts` 类型定义

## 下一步操作

### 1. 安装依赖

```bash
# 安装 Node.js 依赖
yarn install

# 或使用 npm
npm install
```

### 2. 更新 Rust 依赖

```bash
cd src-tauri
cargo update
cargo check
```

### 3. 测试应用

```bash
# 开发模式测试
yarn app:dev

# 如果遇到问题，可以先构建前端
yarn export:dev
```

### 4. 构建生产版本

```bash
# 构建应用
yarn app:build
```

## 可能遇到的问题

### 问题 1: Rust 编译错误

如果遇到 Rust 编译错误，请确保：
- Rust 版本 >= 1.70: `rustc --version`
- 更新 Rust: `rustup update`

### 问题 2: 插件导入错误

Tauri 2 的插件使用新的包名：
- `@tauri-apps/api/core` - 核心 API (invoke)
- `@tauri-apps/api/event` - 事件系统 (listen, emit)
- `@tauri-apps/plugin-dialog` - 对话框
- `@tauri-apps/plugin-fs` - 文件系统
- `@tauri-apps/plugin-clipboard-manager` - 剪贴板
- `@tauri-apps/plugin-notification` - 通知
- `@tauri-apps/plugin-updater` - 更新器
- `@tauri-apps/plugin-process` - 进程管理

### 问题 3: 权限错误

如果某些功能不工作，检查 `src-tauri/capabilities/default.json` 是否包含所需权限。

### 问题 4: Windows WebView2

Windows 用户可能需要更新 WebView2 运行时：
https://developer.microsoft.com/microsoft-edge/webview2/

## 验证升级

运行以下命令验证版本：

```bash
# 检查 Tauri CLI 版本
yarn tauri --version

# 应该显示: tauri-cli 2.9.4
```

## 回滚方案

如果需要回滚到 Tauri 1.5，可以使用 git：

```bash
git checkout HEAD -- src-tauri/Cargo.toml
git checkout HEAD -- src-tauri/tauri.conf.json
git checkout HEAD -- src-tauri/src/main.rs
git checkout HEAD -- package.json
# ... 其他文件
```

## 参考文档

- [Tauri 2.0 迁移指南](https://v2.tauri.app/start/migrate/)
- [Tauri 2.0 API 文档](https://v2.tauri.app/reference/)
- [插件文档](https://v2.tauri.app/plugin/)
