import {
  MOONSHOT_BASE_URL,
  ApiPath,
  ModelProvider,
  Moonshot,
} from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: "Moonshot",
    modelProvider: ModelProvider.Moonshot,
    allowedPaths: new Set([Moonshot.ChatPath, Moonshot.ResponsePath, "models"]),
    chatPaths: [Moonshot.ChatPath],
    responsePaths: [Moonshot.ResponsePath],
    apiPath: ApiPath.Moonshot,
    defaultBaseURL: MOONSHOT_BASE_URL,
    envApiKeyName: "MOONSHOT_API_KEY",
    envBaseURLName: "MOONSHOT_BASE_URL",
    provider: "openai-compatible",
    providerDisplayName: "moonshot",
    modelListPath: "models",
  });
}
