import type { Api, Model } from "@earendil-works/pi-ai";
import { MODELS_DEV_CONFIG } from "../config/generated/models-config";

type PiModel = Model<Api>;
type ModelCatalog = Record<string, PiModel>;
type CatalogModule = Record<string, unknown>;

const PROVIDER_ALIASES: Record<string, string> = {
  azure: "azure-openai-responses",
};

// Keep catalogs out of the initial web bundle. Provider JSON is loaded only
// when its model list or runtime metadata is actually requested.
const CATALOG_LOADERS: Record<string, () => Promise<CatalogModule>> = {
  openai: () => import("@earendil-works/pi-ai/providers/openai.models"),
  anthropic: () => import("@earendil-works/pi-ai/providers/anthropic.models"),
  google: () => import("@earendil-works/pi-ai/providers/google.models"),
  deepseek: () => import("@earendil-works/pi-ai/providers/deepseek.models"),
  moonshotai: () => import("@earendil-works/pi-ai/providers/moonshotai.models"),
  xai: () => import("@earendil-works/pi-ai/providers/xai.models"),
  zai: () => import("@earendil-works/pi-ai/providers/zai.models"),
  "azure-openai-responses": () =>
    import("@earendil-works/pi-ai/providers/azure-openai-responses.models"),
};

const catalogCache = new Map<string, ModelCatalog>();
const loadingCache = new Map<string, Promise<ModelCatalog>>();

function normalize(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function canonicalProvider(providerId: string): string {
  const normalized = normalize(providerId);
  return PROVIDER_ALIASES[normalized] || normalized;
}

function extractCatalog(module: CatalogModule): ModelCatalog {
  const value = Object.values(module).find(
    (candidate) =>
      candidate && typeof candidate === "object" && !Array.isArray(candidate),
  );
  return (value || {}) as ModelCatalog;
}

export function resolvePiProviderId(providerId: string): string | undefined {
  const provider = canonicalProvider(providerId);
  return provider in CATALOG_LOADERS ? provider : undefined;
}

export async function loadPiModelsByProvider(
  providerId: string,
): Promise<PiModel[]> {
  const provider = resolvePiProviderId(providerId);
  if (!provider) return [];

  let catalog = catalogCache.get(provider);
  if (!catalog) {
    let loading = loadingCache.get(provider);
    if (!loading) {
      loading = CATALOG_LOADERS[provider]().then(extractCatalog);
      loadingCache.set(provider, loading);
    }
    try {
      catalog = await loading;
      catalogCache.set(provider, catalog);
    } finally {
      loadingCache.delete(provider);
    }
  }
  return Object.values(catalog);
}

/** Return an already loaded catalog without triggering asynchronous I/O. */
export function getPiModelsByProvider(providerId: string): PiModel[] {
  const provider = resolvePiProviderId(providerId);
  return provider ? Object.values(catalogCache.get(provider) || {}) : [];
}

export function findPiProviderByModel(modelId: string): string | undefined {
  const id = normalize(modelId);
  if (!id) return undefined;
  for (const [provider, catalog] of catalogCache) {
    if (Object.values(catalog).some((model) => normalize(model.id) === id)) {
      return provider;
    }
  }

  // Provider inference is synchronous in the chat API. Use the generated local
  // index until a Pi catalog has been loaded asynchronously.
  for (const [provider, config] of Object.entries(MODELS_DEV_CONFIG)) {
    const models = (config as any)?.models || {};
    if (
      Object.entries(models).some(
        ([key, model]: [string, any]) =>
          normalize(key) === id || normalize(model?.id) === id,
      )
    ) {
      return resolvePiProviderId(provider) || normalize(provider);
    }
  }
  return undefined;
}

export function findPiModelById(
  modelId: string,
  providerId?: string,
): PiModel | null {
  const id = normalize(modelId);
  if (!id) return null;
  const provider = providerId
    ? resolvePiProviderId(providerId)
    : findPiProviderByModel(id);
  if (!provider) return null;

  const catalog = catalogCache.get(provider);
  return (
    catalog?.[modelId] ||
    Object.values(catalog || {}).find((model) => normalize(model.id) === id) ||
    null
  );
}

export async function findPiModelByIdAsync(
  modelId: string,
  providerId: string,
): Promise<PiModel | null> {
  const models = await loadPiModelsByProvider(providerId);
  const id = normalize(modelId);
  return models.find((model) => normalize(model.id) === id) || null;
}
