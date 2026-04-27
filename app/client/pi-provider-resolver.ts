type PiAiModule = {
  getProviders?: () => string[];
  getModels?: (provider: string) => Array<{ id?: string; name?: string }>;
};

const FALLBACK_ALIASES: Record<string, string> = {
  openai: "openai",
  anthropic: "anthropic",
  google: "google",
  xai: "xai",
  groq: "groq",
  cerebras: "cerebras",
  openrouter: "openrouter",
  zai: "zai",
  mistral: "mistral",
  huggingface: "huggingface",
  fireworks: "fireworks",
  minimax: "minimax",
};

let cachedProvidersPromise: Promise<Set<string>> | null = null;
let cachedModelToProviderPromise: Promise<Map<string, string>> | null = null;

async function getPiProviders(): Promise<Set<string>> {
  if (!cachedProvidersPromise) {
    cachedProvidersPromise = (async () => {
      try {
        const mod = (await import("@mariozechner/pi-ai")) as PiAiModule;
        const providers = mod.getProviders?.() ?? [];
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

  const fallback = FALLBACK_ALIASES[normalized];
  if (fallback && (providers.size === 0 || providers.has(fallback))) {
    return fallback;
  }

  return undefined;
}

async function getModelToProviderMap(): Promise<Map<string, string>> {
  if (!cachedModelToProviderPromise) {
    cachedModelToProviderPromise = (async () => {
      const map = new Map<string, string>();
      try {
        const mod = (await import("@mariozechner/pi-ai")) as PiAiModule;
        const providers = mod.getProviders?.() ?? [];
        for (const provider of providers) {
          const pid = String(provider || "").toLowerCase();
          if (!pid) continue;
          const models = mod.getModels?.(provider) ?? [];
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
