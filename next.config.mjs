import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mode = process.env.BUILD_MODE === "export" ? "export" : "standalone";
// 检查是否是调试构建
const isDebugBuild = process.env.DEBUG_BUILD === "true";
// Electron / 本地 file:// 打开静态包时，绝对路径 `/_next/...` 会指向磁盘根目录，必须用相对资源前缀
const isAppExport =
  mode === "export" && process.env.BUILD_APP === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 避免本机其他目录的 package-lock.json 被误判为 workspace 根（Next 15 文件追踪）
  outputFileTracingRoot: path.join(__dirname),

  ...(isAppExport ? { assetPrefix: "." } : {}),

  // 编译器优化（Next 15 默认使用 SWC 压缩，不再使用 swcMinify 选项）
  compiler: {
    // 生产环境移除 console（保留 error 和 warn），调试模式不移除
    removeConsole:
      !isDebugBuild && process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // 实验性功能
  experimental: {
    // 优化包导入（减少打包体积）
    optimizePackageImports: [
      "@lobehub/icons",
      "lodash-es",
    ],
  },

  // 调试模式启用 source maps
  productionBrowserSourceMaps: isDebugBuild,

  // 图片优化
  images: {
    unoptimized: mode === "export",
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: "preset-default",
                    params: {
                      overrides: {
                        removeViewBox: false,
                      },
                    },
                  },
                  {
                    name: "prefixIds",
                    params: {
                      prefixIds: true,
                      prefixClassNames: true,
                    },
                  },
                ],
              },
            },
          },
        ],
        as: "*.js",
      },
    },
    resolveAlias: {
      ...(mode === "export"
        ? {
            "../mcp/actions": "./app/mcp/actions.client.ts",
            "app/mcp/actions": "./app/mcp/actions.client.ts",
          }
        : {}),
      "@earendil-works/pi-ai/dist/env-api-keys":
        "./app/shims/pi-ai-env-api-keys.ts",
      "@earendil-works/pi-ai/dist/env-api-keys.js":
        "./app/shims/pi-ai-env-api-keys.ts",
      bufferutil: "./app/shims/empty-module.ts",
      "utf-8-validate": "./app/shims/empty-module.ts",
      child_process: "./app/shims/empty-module.ts",
      "node:child_process": "./app/shims/empty-module.ts",
      cytoscape: "./app/shims/cytoscape-default.js",
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      cytoscape: path.join(__dirname, "app/shims/cytoscape-default.js"),
    };
    return config;
  },
  output: mode,
};

const CorsHeaders = [
  { key: "Access-Control-Allow-Credentials", value: "true" },
  { key: "Access-Control-Allow-Origin", value: "*" },
  {
    key: "Access-Control-Allow-Methods",
    value: "*",
  },
  {
    key: "Access-Control-Allow-Headers",
    value: "*",
  },
  {
    key: "Access-Control-Max-Age",
    value: "86400",
  },
];

if (mode !== "export") {
  nextConfig.headers = async () => {
    return [
      {
        source: "/api/:path*",
        headers: CorsHeaders,
      },
    ];
  };

  nextConfig.rewrites = async () => {
    const ret = [
      // adjust for previous version directly using "/api/proxy/" as proxy base route
      // {
      //   source: "/api/proxy/v1/:path*",
      //   destination: "https://api.openai.com/v1/:path*",
      // },
      {
        // https://{resource_name}.openai.azure.com/openai/deployments/{deploy_name}/chat/completions
        source:
          "/api/proxy/azure/:resource_name/deployments/:deploy_name/:path*",
        destination:
          "https://:resource_name.openai.azure.com/openai/deployments/:deploy_name/:path*",
      },
      {
        source: "/api/proxy/google/:path*",
        destination: "https://generativelanguage.googleapis.com/:path*",
      },
      {
        source: "/api/proxy/openai/:path*",
        destination: "https://api.openai.com/:path*",
      },
      {
        source: "/api/proxy/anthropic/:path*",
        destination: "https://api.anthropic.com/:path*",
      },
      {
        source: "/google-fonts/:path*",
        destination: "https://fonts.googleapis.com/:path*",
      },
      {
        source: "/api/proxy/alibaba/:path*",
        destination: "https://dashscope.aliyuncs.com/api/:path*",
      }
    ];

    return {
      beforeFiles: ret,
    };
  };
}

export default nextConfig;
