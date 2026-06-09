/**
 * 将 Git 标签（如 v2.19、2.19.1）转为 npm/Cargo/Tauri 可用的 semver，
 * 并写入 package.json、src-tauri/tauri.conf.json、src-tauri/Cargo.toml。
 *
 * 用法：
 *   node scripts/sync-version-from-tag.mjs v2.19
 *   RELEASE_VERSION=2.19.0 node scripts/sync-version-from-tag.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function tagToSemver(raw) {
  const tag = String(raw || "").trim();
  if (!tag) {
    throw new Error("缺少版本：请传入标签参数或设置 RELEASE_VERSION");
  }
  const withoutV = tag.replace(/^v/i, "");
  const suffixMatch = withoutV.match(
    /^([0-9]+(?:\.[0-9]+){0,2})([-+][0-9A-Za-z.-]+(?:\+[0-9A-Za-z.-]+)?)?$/,
  );
  if (!suffixMatch) {
    throw new Error(`无法解析版本：${tag}`);
  }
  const core = suffixMatch[1];
  const suffix = suffixMatch[2] ?? "";
  const parts = core.split(".").filter((p) => p !== "");
  if (parts.length === 0) {
    throw new Error(`无法解析版本：${tag}`);
  }
  const maj = parts[0];
  const min = parts[1] ?? "0";
  const pat = parts[2] ?? "0";
  return `${maj}.${min}.${pat}${suffix}`;
}

function replaceJsonVersion(content, semver) {
  const next = content.replace(
    /("version"\s*:\s*")[^"]*(")/,
    `$1${semver}$2`,
  );
  if (next === content) {
    throw new Error("未找到 JSON 中的 version 字段");
  }
  return next;
}

function replaceCargoPackageVersion(content, semver) {
  const lines = content.split(/\r?\n/);
  let inPackage = false;
  let replaced = false;
  const out = lines.map((line) => {
    if (/^\s*\[package\]\s*$/.test(line)) {
      inPackage = true;
      return line;
    }
    if (/^\s*\[/.test(line)) {
      inPackage = false;
      return line;
    }
    if (inPackage && /^\s*version\s*=\s*"[^"]*"\s*$/.test(line)) {
      replaced = true;
      return line.replace(/^\s*version\s*=\s*"[^"]*"/, `version = "${semver}"`);
    }
    return line;
  });
  if (!replaced) {
    throw new Error("未在 [package] 中找到 Cargo version 字段");
  }
  return out.join("\n");
}

function main() {
  const arg = process.argv[2];
  const semver = tagToSemver(arg || process.env.RELEASE_VERSION || "");

  const pkgPath = path.join(root, "package.json");
  const tauriConfPath = path.join(root, "src-tauri", "tauri.conf.json");
  const cargoPath = path.join(root, "src-tauri", "Cargo.toml");

  fs.writeFileSync(
    pkgPath,
    replaceJsonVersion(fs.readFileSync(pkgPath, "utf8"), semver),
  );
  fs.writeFileSync(
    tauriConfPath,
    replaceJsonVersion(fs.readFileSync(tauriConfPath, "utf8"), semver),
  );
  fs.writeFileSync(
    cargoPath,
    replaceCargoPackageVersion(fs.readFileSync(cargoPath, "utf8"), semver),
  );

  console.log(`已将应用版本同步为 ${semver}`);
}

main();
