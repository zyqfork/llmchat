/**
 * Expose transformMessages for app code without patching node_modules.
 * @mariozechner/pi-ai does not export ./providers/transform-messages — Turbopack respects "exports" and blocks deep imports.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@mariozechner",
  "pi-ai",
  "package.json",
);

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

const raw = fs.readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(raw);

const subpath = "./providers/transform-messages";
const prevExports = pkg.exports;
if (!prevExports || typeof prevExports !== "object") {
  console.warn("ensure-pi-ai-exports: unexpected exports field, skip");
  process.exit(0);
}

if (typeof prevExports[subpath] === "object") {
  process.exit(0);
}

pkg.exports = {
  ...prevExports,
  [subpath]: {
    types: "./dist/providers/transform-messages.d.ts",
    import: "./dist/providers/transform-messages.js",
    default: "./dist/providers/transform-messages.js",
  },
};

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`, "utf8");
console.log("ensure-pi-ai-exports: added %s to @mariozechner/pi-ai", subpath);
