import {
  DEEPSEEK_BASE_URL,
  ApiPath,
  ModelProvider,
  DeepSeek,
} from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: "DeepSeek",
    modelProvider: ModelProvider.DeepSeek,
    allowedPaths: new Set([
      DeepSeek.ChatPath,
      DeepSeek.ResponsePath,
      DeepSeek.ListModelPath,
    ]),
    chatPaths: [DeepSeek.ChatPath],
    responsePaths: [DeepSeek.ResponsePath],
    apiPath: ApiPath.DeepSeek,
    defaultBaseURL: DEEPSEEK_BASE_URL,
    envApiKeyName: "DEEPSEEK_API_KEY",
    envBaseURLName: "DEEPSEEK_BASE_URL",
    provider: "openai-compatible",
    providerDisplayName: "deepseek",
    modelListPath: DeepSeek.ListModelPath,
  });
}
