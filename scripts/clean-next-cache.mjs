/**
 * 删除 Next 构建缓存与静态导出目录，避免旧产物被复用。
 * - `.next`：dev / 默认 distDir
 * - `dist`：`NEXT_DIST_DIR=dist` 时的编译缓存（export 脚本使用）
 * - `out`：静态 export 输出（Tauri/Electron 打包 frontendDist）
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
for (const dir of [".next", "dist", "out"]) {
  const path = join(root, dir);
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`Removed ${dir}`);
  }
}
