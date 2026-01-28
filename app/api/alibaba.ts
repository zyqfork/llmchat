import {
  ALIBABA_BASE_URL,
  ApiPath,
  ModelProvider,
  Alibaba,
} from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: "Alibaba",
    modelProvider: ModelProvider.Qwen,
    allowedPaths: new Set([Alibaba.ChatPath, Alibaba.ResponsePath, "models"]),
    chatPaths: [Alibaba.ChatPath],
    responsePaths: [Alibaba.ResponsePath],
    apiPath: ApiPath.Alibaba,
    defaultBaseURL: ALIBABA_BASE_URL,
    envApiKeyName: "ALIBABA_API_KEY",
    envBaseURLName: "ALIBABA_BASE_URL",
    provider: "openai-compatible",
    providerDisplayName: "alibaba-qwen",
    modelListPath: "models",
  });
}
