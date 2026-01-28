import { XAI_BASE_URL, ApiPath, ModelProvider, XAI } from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: "XAI",
    modelProvider: ModelProvider.XAI,
    allowedPaths: new Set([XAI.ChatPath, XAI.ResponsePath, "models"]),
    chatPaths: [XAI.ChatPath],
    responsePaths: [XAI.ResponsePath],
    apiPath: ApiPath.XAI,
    defaultBaseURL: XAI_BASE_URL,
    envApiKeyName: "XAI_API_KEY",
    envBaseURLName: "XAI_BASE_URL",
    provider: "xai", // 使用XAI官方SDK
    modelListPath: "models",
  });
}
