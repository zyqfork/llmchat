/**
 * @earendil-works/pi-web-ui only exposes "." which pulls pdfjs-dist (breaks Next server).
 * Add conditional exports for leaf modules so the app can import without the barrel.
 * Idempotent; safe if upstream adds the same keys later.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@earendil-works",
  "pi-web-ui",
  "package.json",
);

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

const raw = fs.readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(raw);

if (pkg.exports && typeof pkg.exports["./utils/format"] === "object") {
  process.exit(0);
}

const subpaths = {
  "./utils/format": {
    types: "./dist/utils/format.d.ts",
    import: "./dist/utils/format.js",
    default: "./dist/utils/format.js",
  },
  "./utils/proxy-utils": {
    types: "./dist/utils/proxy-utils.d.ts",
    import: "./dist/utils/proxy-utils.js",
    default: "./dist/utils/proxy-utils.js",
  },
  "./storage/backends/indexeddb-storage-backend": {
    types: "./dist/storage/backends/indexeddb-storage-backend.d.ts",
    import: "./dist/storage/backends/indexeddb-storage-backend.js",
    default: "./dist/storage/backends/indexeddb-storage-backend.js",
  },
  "./storage/stores/settings-store": {
    types: "./dist/storage/stores/settings-store.d.ts",
    import: "./dist/storage/stores/settings-store.js",
    default: "./dist/storage/stores/settings-store.js",
  },
  "./storage/store": {
    types: "./dist/storage/store.d.ts",
    import: "./dist/storage/store.js",
    default: "./dist/storage/store.js",
  },
};

const prev = pkg.exports;
if (!prev || typeof prev !== "object") {
  console.warn("ensure-pi-web-ui-exports: unexpected exports field, skip");
  process.exit(0);
}

pkg.exports = {
  ".": prev["."],
  "./app.css": prev["./app.css"],
  ...subpaths,
};

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`, "utf8");
console.log("ensure-pi-web-ui-exports: merged conditional exports into pi-web-ui");
