import {
  ANTHROPIC_BASE_URL,
  Anthropic,
  ApiPath,
  ModelProvider,
} from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

const ALLOWD_PATH = new Set([Anthropic.ChatPath, Anthropic.ChatPath1]);
const CHAT_PATHS = [Anthropic.ChatPath, Anthropic.ChatPath1];

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: "Anthropic",
    modelProvider: ModelProvider.Claude,
    allowedPaths: ALLOWD_PATH,
    chatPaths: CHAT_PATHS,
    apiPath: ApiPath.Anthropic,
    defaultBaseURL: ANTHROPIC_BASE_URL,
    envApiKeyName: "ANTHROPIC_API_KEY",
    envBaseURLName: "ANTHROPIC_BASE_URL",
    provider: "anthropic",
    authHeaderName: "x-api-key",
  });
}
