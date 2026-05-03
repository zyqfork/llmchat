/**
 * 将 Tauri 应用图标同步到 electron/resources（与 src-tauri/icons 一致）。
 * electron-builder 主配置已直接使用 src-tauri/icons/icon.png。
 */
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcFile = path.join(__dirname, "..", "src-tauri", "icons", "icon.png");
const outDir = path.join(__dirname, "..", "electron", "resources");
const outFile = path.join(outDir, "icon.png");

await mkdir(outDir, { recursive: true });
await copyFile(srcFile, outFile);

console.log(`Copied ${srcFile} -> ${outFile}`);
