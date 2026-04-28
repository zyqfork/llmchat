import { getModels, getProviders } from "@mariozechner/pi-ai";

let cachedProvidersPromise: Promise<Set<string>> | null = null;
let cachedModelToProviderPromise: Promise<Map<string, string>> | null = null;

async function getPiProviders(): Promise<Set<string>> {
  if (!cachedProvidersPromise) {
    cachedProvidersPromise = (async () => {
      try {
        const providers = getProviders();
        return new Set(providers.map((p) => p.toLowerCase()));
      } catch {
        return new Set<string>();
      }
    })();
  }
  return cachedProvidersPromise;
}

export async function resolvePiProviderId(
  providerId: string,
): Promise<string | undefined> {
  const normalized = String(providerId || "").toLowerCase();
  if (!normalized) return undefined;

  const providers = await getPiProviders();
  if (providers.has(normalized)) {
    return normalized;
  }

  return undefined;
}

async function getModelToProviderMap(): Promise<Map<string, string>> {
  if (!cachedModelToProviderPromise) {
    cachedModelToProviderPromise = (async () => {
      const map = new Map<string, string>();
      try {
        const providers = getProviders();
        for (const provider of providers) {
          const pid = String(provider || "").toLowerCase();
          if (!pid) continue;
          const models = getModels(provider);
          for (const model of models) {
            const id = String(model?.id || "").toLowerCase();
            if (!id) continue;
            if (!map.has(id)) {
              map.set(id, pid);
            }
          }
        }
      } catch {
        // ignore and return empty map
      }
      return map;
    })();
  }
  return cachedModelToProviderPromise;
}

export async function resolvePiProviderByModel(
  modelId: string,
): Promise<string | undefined> {
  const model = String(modelId || "")
    .trim()
    .toLowerCase();
  if (!model) return undefined;
  const map = await getModelToProviderMap();
  return map.get(model);
}
