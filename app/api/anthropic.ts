import { ServiceProvider, ModelProvider } from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

const providerConfig = ServiceProvider.Anthropic;
const ALLOWD_PATH = new Set([providerConfig.endpoints.chat, "complete"]);
const CHAT_PATHS = [providerConfig.endpoints.chat, "complete"];

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: providerConfig.name,
    modelProvider: ModelProvider.Claude,
    allowedPaths: ALLOWD_PATH,
    chatPaths: CHAT_PATHS,
    apiPath: providerConfig.apiPath,
    defaultBaseURL: providerConfig.defaultBaseUrl,
    envApiKeyName: providerConfig.envApiKeyName,
    envBaseURLName: providerConfig.envBaseUrlName,
    provider: providerConfig.sdkType,
    authHeaderName: providerConfig.authHeaderName,
  });
}
