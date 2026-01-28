import {
  BYTEDANCE_BASE_URL,
  ApiPath,
  ModelProvider,
  ByteDance,
} from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: "ByteDance",
    modelProvider: ModelProvider.Doubao,
    allowedPaths: new Set([
      ByteDance.ChatPath,
      ByteDance.ResponsePath,
      "models",
    ]),
    chatPaths: [ByteDance.ChatPath],
    responsePaths: [ByteDance.ResponsePath],
    apiPath: ApiPath.ByteDance,
    defaultBaseURL: BYTEDANCE_BASE_URL,
    envApiKeyName: "BYTEDANCE_API_KEY",
    envBaseURLName: "BYTEDANCE_BASE_URL",
    provider: "openai-compatible",
    providerDisplayName: "bytedance-doubao",
    modelListPath: "models",
  });
}
