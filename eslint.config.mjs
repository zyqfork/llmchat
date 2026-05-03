import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

/**
 * Next.js 16 移除了 `next lint`，改用 ESLint 9 扁平配置。
 * 以下规则与现有代码库暂不兼容，先关闭以免阻塞 CI；后续可分批打开并修复。
 */
export default defineConfig([
  ...nextVitals,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@mariozechner/pi-web-ui",
              message:
                "请使用子路径导入（如 @mariozechner/pi-web-ui/utils/format），避免根入口在服务端牵出 pdfjs。",
            },
          ],
        },
      ],
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
    },
  },
  globalIgnores([
    "**/node_modules/**",
    ".next/**",
    "out/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "src-tauri/**",
    "next-env.d.ts",
    "public/serviceWorker.js",
    "app/mcp/mcp_config.json",
    "app/mcp/mcp_config.default.json",
  ]),
]);
