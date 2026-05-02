import { NextResponse } from "next/server";
import { getAllProviders } from "../../constant";

// 从环境变量获取配置
function getServerConfig() {
  const accessCode = process.env.ACCESS_CODE || "";

  // 动态获取所有厂商的环境变量配置
  const providers = getAllProviders();
  const providerConfigs: Record<string, any> = {};
  const envValues: string[] = [];

  providers.forEach((provider) => {
    const apiKey = process.env[provider.envApiKeyName] || "";
    const baseUrl = provider.envBaseUrlName
      ? process.env[provider.envBaseUrlName] || ""
      : "";

    // 收集环境变量值用于检查是否有配置
    if (apiKey) envValues.push(apiKey);
    if (baseUrl) envValues.push(baseUrl);

    // 构建配置对象
    providerConfigs[provider.id] = {
      hasApiKey: !!apiKey,
      hasBaseUrl: !!baseUrl,
    };

    // Azure 特殊处理 - 需要 API 版本
    if (provider.id === "azure") {
      const apiVersion = process.env.AZURE_API_VERSION || "";
      if (apiVersion) envValues.push(apiVersion);
      providerConfigs[provider.id].hasApiVersion = !!apiVersion;
    }
  });

  // 如果设置了任何服务商环境变量，强制启用访问码
  const hasProviderConfig = envValues.some((value) => !!value);

  const needCode = !!accessCode || hasProviderConfig;

  return {
    needCode,
    hideUserApiKey: false,
    disableGPT4: false,
    hideBalanceQuery: false,
    disableFastLink: false,
    customModels: "",
    defaultModel: "",
    visionModels: "",
    // 告诉前端是否设置了服务器端访问码（不暴露实际访问码）
    hasServerAccessCode: !!accessCode,
    // 告诉前端是否设置了服务商环境变量配置（不暴露实际配置）
    hasServerProviderConfig: hasProviderConfig,
    // 各服务商服务器配置状态（动态生成）
    serverProviders: providerConfigs,
  };
}

// 纯前端应用的默认配置
const DANGER_CONFIG = getServerConfig();

declare global {
  type DangerConfig = typeof DANGER_CONFIG;
}

async function handle() {
  return NextResponse.json(DANGER_CONFIG);
}

export const GET = handle;
export const POST = handle;

export const runtime = "nodejs";
export const dynamic = "force-static";
