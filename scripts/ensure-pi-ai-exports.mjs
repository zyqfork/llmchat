/**
 * Patch pi-ai package metadata/runtime for the app build.
 * @earendil-works/pi-ai does not export ./providers/transform-messages — Turbopack respects "exports" and blocks deep imports.
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

if (typeof prevExports[subpath] !== "object") {
  pkg.exports = {
    ...prevExports,
    [subpath]: {
      types: "./dist/providers/transform-messages.d.ts",
      import: "./dist/providers/transform-messages.js",
      default: "./dist/providers/transform-messages.js",
    },
  };

  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`, "utf8");
  console.log(
    "ensure-pi-ai-exports: added %s to @earendil-works/pi-ai",
    subpath,
  );
}

function patchEnvApiKeys(envApiKeysPath) {
  if (!fs.existsSync(envApiKeysPath)) return;

  const envApiKeysRaw = fs.readFileSync(envApiKeysPath, "utf8");
  const dynamicImportLine =
    "const dynamicImport = (specifier) => import(__rewriteRelativeImportExtension(specifier));";
  const patchedDynamicImportLine =
    "const dynamicImport = (_specifier) => Promise.resolve({});";

  if (envApiKeysRaw.includes(dynamicImportLine)) {
    fs.writeFileSync(
      envApiKeysPath,
      envApiKeysRaw.replace(dynamicImportLine, patchedDynamicImportLine),
      "utf8",
    );
    console.log(
      "ensure-pi-ai-exports: disabled dynamic node imports in env-api-keys",
    );
  }
}

patchEnvApiKeys(path.join(path.dirname(pkgPath), "dist", "env-api-keys.js"));
patchEnvApiKeys(
  path.join(
    __dirname,
    "..",
    "node_modules",
    "@earendil-works",
    "pi-web-ui",
    "node_modules",
    "@earendil-works",
    "pi-ai",
    "dist",
    "env-api-keys.js",
  ),
);
