import { isCorsError } from "@earendil-works/pi-web-ui/utils/proxy-utils";
import {
  DEFAULT_MODELS,
  getAllProviders,
  getProviderConfig,
} from "../constant";
import { type CustomProvider, useAccessStore } from "../store/access";
import { fetch as appFetch } from "../utils/fetch";
import { logger } from "../utils/logger";
import { loadPiModelsByProvider } from "../utils/pi-ai-resolver";
import type { LLMModel } from "./api";

const CUSTOM_PROVIDER_AUTH_HEADER: Record<string, string> = {
  anthropic: "x-api-key",
  google: "x-goog-api-key",
};

type CustomModelEntry = string | { id?: string; name?: string };
type CustomModelsPayload =
  | CustomModelEntry[]
  | { data?: CustomModelEntry[]; models?: CustomModelEntry[] };

export interface ModelFetchResponse {
  models: LLMModel[];
  success: boolean;
  error?: string;
}

function modelFetchErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (isCorsError(error)) {
    return `${msg}（可能是跨域/CORS，请检查控制台代理或同源配置）`;
  }
  return msg;
}

function modelFetchFailure(error: unknown): ModelFetchResponse {
  return { models: [], success: false, error: modelFetchErrorMessage(error) };
}

function modelFetchFailureWithMessage(error: string): ModelFetchResponse {
  return { models: [], success: false, error };
}

function modelFetchSuccess(models: LLMModel[]): ModelFetchResponse {
  return { models, success: true };
}

function toLlmModel(
  name: string,
  index: number,
  providerId: string,
  providerName: string,
): LLMModel {
  return {
    name,
    displayName: name,
    available: true,
    sorted: index,
    provider: {
      id: providerId,
      providerName,
      providerType: providerId.startsWith("custom_") ? "custom" : providerId,
      sorted: 0,
    },
  };
}

function resolveProviderConfig(provider: string) {
  return (
    getProviderConfig(provider) ||
    getAllProviders().find((p) => p.name === provider)
  );
}

function getLocalCatalogModels(
  providerId: string,
  providerName: string,
): LLMModel[] {
  return DEFAULT_MODELS.filter(
    (model) =>
      model.provider?.id === providerId ||
      model.provider?.providerName === providerName,
  ).map((model, index) => ({
    ...model,
    available: true,
    sorted: model.sorted ?? index,
    provider: {
      id: providerId,
      providerName,
      providerType: providerId,
      sorted: model.provider?.sorted ?? 0,
    },
  }));
}

async function getPiCatalogModels(providerId: string): Promise<LLMModel[]> {
  try {
    return (await loadPiModelsByProvider(providerId)).map((model, index: number) => {
      const name = String(model.id);
      return {
        ...toLlmModel(name, index, providerId, providerId),
        displayName: model.name || name,
      };
    });
  } catch (error) {
    logger.warn(
      `[ModelFetch] Failed to read pi-ai model catalog for ${providerId}:`,
      error,
    );
    return [];
  }
}

function normalizeCustomModelName(
  providerId: string,
  rawName: unknown,
): string {
  const name = String(rawName);
  if (providerId === "google" && name.startsWith("models/")) {
    return name.replace("models/", "");
  }
  return name;
}

function normalizeCustomModels(
  data: CustomModelsPayload,
  providerId: string,
  providerName: string,
): LLMModel[] {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.models)
        ? data.models
        : [];

  return source
    .map((model, index: number) => {
      const rawName =
        typeof model === "string" ? model : (model.id ?? model.name);
      if (!rawName) return null;
      const name = normalizeCustomModelName(providerId, rawName);
      return toLlmModel(name, index, providerId, providerName);
    })
    .filter((model): model is LLMModel => model !== null);
}

function buildAuthHeaders(
  authHeaderName: string,
  apiKey: string,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    [authHeaderName]:
      authHeaderName.toLowerCase() === "authorization"
        ? `Bearer ${apiKey}`
        : apiKey,
  };
}

function getCustomProviderAuthHeader(providerType: string): string {
  return CUSTOM_PROVIDER_AUTH_HEADER[providerType] || "Authorization";
}

function normalizeCustomProviderEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) throw new Error("Missing endpoint URL");
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function buildCustomProviderModelsUrl(baseUrl: string): string {
  return `${normalizeCustomProviderEndpoint(baseUrl).replace(/\/+$/, "")}/models`;
}

function getCustomProviderRequestConfig(customProvider: CustomProvider): {
  url: string;
  headers: Record<string, string>;
} {
  const apiKey = customProvider.apiKey;
  const baseUrl = customProvider.endpoint;
  if (!apiKey) throw new Error("Missing API key");
  if (!baseUrl) throw new Error("Missing endpoint URL");
  return {
    url: buildCustomProviderModelsUrl(baseUrl),
    headers: buildAuthHeaders(
      getCustomProviderAuthHeader(customProvider.type),
      apiKey,
    ),
  };
}

async function fetchCustomModelsPayload(
  customProvider: CustomProvider,
): Promise<CustomModelsPayload> {
  const request = getCustomProviderRequestConfig(customProvider);
  const response = await appFetch(request.url, {
    method: "GET",
    headers: request.headers,
  });
  if (!response.ok) {
    let detail = response.statusText || "";
    try {
      const text = (await response.text()).trim();
      if (text) detail = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    } catch {
      // ignore
    }
    throw new Error(
      detail ? `HTTP ${response.status}: ${detail}` : `HTTP ${response.status}`,
    );
  }
  return (await response.json()) as CustomModelsPayload;
}

async function fetchCustomProviderModels(
  customProvider: CustomProvider,
): Promise<ModelFetchResponse> {
  try {
    return modelFetchSuccess(
      normalizeCustomModels(
        await fetchCustomModelsPayload(customProvider),
        customProvider.id,
        customProvider.name,
      ),
    );
  } catch (error) {
    logger.warn(
      `[ModelFetch] Failed to fetch custom provider models (${customProvider.name || customProvider.id}):`,
      error,
    );
    return modelFetchFailure(error);
  }
}

async function fetchBuiltinProviderModels(
  provider: string,
): Promise<ModelFetchResponse> {
  const providerConfig = resolveProviderConfig(provider);
  if (!providerConfig) {
    return modelFetchFailureWithMessage(`Unsupported provider ${provider}`);
  }

  const modelsFromPi = await getPiCatalogModels(providerConfig.id);
  const models =
    modelsFromPi.length > 0
      ? modelsFromPi
      : getLocalCatalogModels(providerConfig.id, providerConfig.name);
  if (models.length > 0) return modelFetchSuccess(models);

  return modelFetchFailureWithMessage(
    `No model catalog available for provider ${provider}`,
  );
}

export async function fetchModels(
  provider: string,
): Promise<ModelFetchResponse> {
  try {
    if (provider.startsWith("custom_")) {
      const customProvider = useAccessStore
        .getState()
        .customProviders.find((item) => item.id === provider);
      if (!customProvider) {
        return modelFetchFailureWithMessage(
          `Custom provider ${provider} not found`,
        );
      }
      return fetchCustomProviderModels(customProvider);
    }
    return await fetchBuiltinProviderModels(provider);
  } catch (error) {
    logger.error(`[ModelFetch] Failed to fetch models for ${provider}:`, error);
    return modelFetchFailure(error);
  }
}
