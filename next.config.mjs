import webpack from "webpack";
import path from "path";
import crypto from "crypto";

const mode = process.env.BUILD_MODE === "export" ? "export" : "standalone";
const disableChunk = false;
// 检查是否是调试构建
const isDebugBuild = process.env.DEBUG_BUILD === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 根据构建模式决定是否启用压缩
  swcMinify: !isDebugBuild,

  // 编译器优化
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
    forceSwcTransforms: true,
    // 优化包导入（减少打包体积）
    optimizePackageImports: [
      "@lobehub/icons",
      "lodash-es",
      "react-icons",
      "framer-motion",
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

  webpack(config, { dev, isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    if (disableChunk) {
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      );
    }

    config.resolve.fallback = {
      child_process: false,
    };

    if (mode === "export") {
      // In static export builds, alias server-action module to a client-safe stub
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "../mcp/actions": path.resolve("app/mcp/actions.client.ts"),
        "app/mcp/actions": path.resolve("app/mcp/actions.client.ts"),
      };
    }

    // Ignore optional native deps used by ws in rt-client
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      bufferutil: false,
      "utf-8-validate": false,
    };

    // 生产环境优化
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        // 根据构建模式决定是否压缩
        minimize: !isDebugBuild,
        moduleIds: "deterministic",
        runtimeChunk: "single",
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // React 框架代码单独打包
            framework: {
              name: "framework",
              chunks: "all",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // 大型库单独打包
            lib: {
              test(module) {
                return (
                  module.size() > 160000 &&
                  /node_modules[/\\]/.test(module.identifier())
                );
              },
              name(module) {
                const hash = crypto
                  .createHash("sha1")
                  .update(module.identifier())
                  .digest("hex")
                  .substring(0, 8);
                return `lib-${hash}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // 公共组件
            commons: {
              name: "commons",
              minChunks: 2,
              priority: 20,
            },
          },
        },
      };
    }

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
