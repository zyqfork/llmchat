import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../config/server";
import { createPersistStore } from "../utils/store";
import { StoreKey } from "../constant";
import { CustomProvider, CustomProviderType } from "../store/access";
import { handle as openaiHandler } from "./openai";
import { handle as googleHandler } from "./google";
import { handle as anthropicHandler } from "./anthropic";

// 获取自定义服务商配置
function getCustomProviderConfig(
  req: NextRequest,
  providerId: string,
): CustomProvider | null {
  try {
    // 从请求头获取自定义服务商配置
    const configHeader = req.headers.get("x-custom-provider-config");
    if (configHeader) {
      // 解码Base64编码的配置
      const decodedBytes = atob(configHeader);
      const decoder = new TextDecoder();
      const uint8Array = new Uint8Array(
        decodedBytes.split("").map((char) => char.charCodeAt(0)),
      );
      const configJson = decoder.decode(uint8Array);
      return JSON.parse(configJson) as CustomProvider;
    }
    return null;
  } catch (error) {
    console.error("[Custom Provider] Failed to get config:", error);
    return null;
  }
}

// 根据自定义服务商类型路由到相应的处理器
export async function handle(
  req: NextRequest,
  { params }: { params: { provider: string; path: string[] } },
) {
  console.log("[Custom Provider Route] params ", params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // 获取自定义服务商配置
  const customConfig = getCustomProviderConfig(req, params.provider);

  if (!customConfig) {
    return NextResponse.json(
      { error: "Custom provider not found or not configured" },
      { status: 404 },
    );
  }

  if (!customConfig.enabled) {
    return NextResponse.json(
      { error: "Custom provider is disabled" },
      { status: 403 },
    );
  }

  // 设置自定义配置到请求头，供下游处理器使用
  const modifiedHeaders = new Headers(req.headers);
  modifiedHeaders.set("x-custom-provider-id", params.provider);
  modifiedHeaders.set("x-custom-provider-type", customConfig.type);
  modifiedHeaders.set("x-custom-provider-api-key", customConfig.apiKey);
  if (customConfig.endpoint) {
    modifiedHeaders.set("x-custom-provider-endpoint", customConfig.endpoint);
  }

  // 创建修改后的请求
  const modifiedReq = new NextRequest(req.url, {
    method: req.method,
    headers: modifiedHeaders,
    body: req.body,
  });

  // 根据自定义服务商类型路由到相应的处理器
  switch (customConfig.type) {
    case "openai":
      return openaiHandler(modifiedReq, { params });
    case "google":
      return googleHandler(modifiedReq, { params });
    case "anthropic":
      return anthropicHandler(modifiedReq, { params });
    default:
      return NextResponse.json(
        { error: `Unsupported custom provider type: ${customConfig.type}` },
        { status: 400 },
      );
  }
}
