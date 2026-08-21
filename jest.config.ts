import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.js", "**/*.test.ts", "**/*.test.jsx", "**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "[/\\\\]node_modules[/\\\\](?!(@earendil-works|@mariozechner|@lobehub|antd-style|lucide-react|polished|es-toolkit)[/\\\\])",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@lobehub/icons$": "<rootDir>/app/test-shims/lobehub-icons.ts",
    "^@earendil-works/pi-web-ui/utils/format$":
      "<rootDir>/app/test-shims/pi-web-ui-format.ts",
    "^@earendil-works/pi-web-ui/utils/proxy-utils$":
      "<rootDir>/app/test-shims/pi-web-ui-proxy-utils.ts",
    "^@earendil-works/pi-web-ui/storage/backends/indexeddb-storage-backend$":
      "<rootDir>/app/test-shims/pi-web-ui-indexeddb-storage-backend.ts",
    "^@earendil-works/pi-web-ui/storage/stores/settings-store$":
      "<rootDir>/app/test-shims/pi-web-ui-settings-store.ts",
    "^@earendil-works/pi-ai$": "<rootDir>/app/test-shims/pi-ai.ts",
    "^@earendil-works/pi-ai/compat$": "<rootDir>/app/test-shims/pi-ai.ts",
    "^@earendil-works/pi-ai/api/(openai-completions|openai-responses|azure-openai-responses|anthropic-messages|google-generative-ai)\\.lazy$":
      "<rootDir>/app/test-shims/pi-ai-lazy-api.ts",
    "^@earendil-works/pi-ai/api/transform-messages$":
      "<rootDir>/app/test-shims/pi-ai-transform-messages.ts",
    "^@earendil-works/pi-ai/providers/transform-messages$":
      "<rootDir>/app/test-shims/pi-ai-transform-messages.ts",
    "^@earendil-works/pi-ai/providers/.+\\.models$":
      "<rootDir>/app/test-shims/pi-ai-model-catalogs.ts",
    "^@earendil-works/pi-agent-core$":
      "<rootDir>/app/test-shims/pi-agent-core.ts",
    "^nanoid$": "<rootDir>/app/test-shims/nanoid.ts",
    "^react-markdown$": "<rootDir>/app/test-shims/react-markdown.tsx",
    "^rehype-raw$": "<rootDir>/app/shims/empty-module.ts",
    "^rehype-katex$": "<rootDir>/app/shims/empty-module.ts",
    "^rehype-sanitize$": "<rootDir>/app/test-shims/rehype-sanitize.ts",
    "^remark-breaks$": "<rootDir>/app/shims/empty-module.ts",
    "^remark-gfm$": "<rootDir>/app/shims/empty-module.ts",
    "^remark-math$": "<rootDir>/app/shims/empty-module.ts",
    "^@modelcontextprotocol/sdk/client/(index|sse|streamableHttp)\\.js$":
      "<rootDir>/app/test-shims/mcp-sdk.ts",
  },
  injectGlobals: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
