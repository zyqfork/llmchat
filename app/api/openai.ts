import {
  ModelProvider,
  OpenaiPath,
  OPENAI_BASE_URL,
  ApiPath,
} from "@/app/constant";
import { NextRequest } from "next/server";
import { handleProviderRequest } from "@/app/api/sdk-utils";

const ALLOWED_PATH = new Set(Object.values(OpenaiPath));

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handleProviderRequest(req, params, {
    providerName: "OpenAI",
    modelProvider: ModelProvider.GPT,
    allowedPaths: ALLOWED_PATH,
    chatPaths: [OpenaiPath.ChatPath],
    responsePaths: [OpenaiPath.ResponsePath],
    imagePaths: [OpenaiPath.ImagePath],
    speechPaths: [OpenaiPath.SpeechPath],
    apiPath: ApiPath.OpenAI,
    defaultBaseURL: OPENAI_BASE_URL,
    envApiKeyName: "OPENAI_API_KEY",
    envBaseURLName: "OPENAI_BASE_URL",
    provider: "openai",
    modelListPath: OpenaiPath.ListModelPath,
  });
}
