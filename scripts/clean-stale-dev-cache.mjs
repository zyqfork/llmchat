/**
 * 防止 dev 模式加载残留的构建产物。
 *
 * 只要执行过 `next build`（export/standalone），`.next` 在生产构建后不会留下
 * `.next/dev` 目录；而 `next dev` 启动后立刻会写 `.next/dev`。
 * 因此 `.next` 存在但缺少 `.next/dev` 时，几乎可以确定是残留的构建产物，
 * 直接清掉，避免 dev server 复用错乱的 manifest 导致页面加载失败（只转圈）。
 * 正常 dev → dev 重启会保留 `.next/dev`，缓存不受影响。
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const nextDir = join(root, ".next");

if (existsSync(nextDir) && !existsSync(join(nextDir, "dev"))) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed stale .next from a non-dev build");
}