import {
  SILICONFLOW_BASE_URL,
  ApiPath,
  ModelProvider,
  SiliconFlow,
} from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: "SiliconFlow",
    modelProvider: ModelProvider.SiliconFlow,
    allowedPaths: new Set([
      SiliconFlow.ChatPath,
      SiliconFlow.ResponsePath,
      SiliconFlow.ListModelPath,
    ]),
    chatPaths: [SiliconFlow.ChatPath],
    responsePaths: [SiliconFlow.ResponsePath],
    apiPath: ApiPath.SiliconFlow,
    defaultBaseURL: SILICONFLOW_BASE_URL,
    envApiKeyName: "SILICONFLOW_API_KEY",
    envBaseURLName: "SILICONFLOW_BASE_URL",
    provider: "openai-compatible",
    providerDisplayName: "siliconflow",
    modelListPath: SiliconFlow.ListModelPath,
  });
}
