/**
 * 删除 `.next` 缓存，避免路由删除/重命名后仍残留旧的 dev types（如 validator 引用已不存在的 page）。
 * 在 `yarn export` / `yarn electron:build` 前执行，防止 `Cannot find module '.../app/test-icons/page.js'` 一类错误。
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const nextDir = join(root, ".next");
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next");
}
