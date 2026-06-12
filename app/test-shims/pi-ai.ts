const OPENAI_MODEL = {
  id: "gpt-4o-mini",
  name: "gpt-4o-mini",
  provider: "openai",
  context: 128000,
  cost: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
  },
  input: ["text"],
  output: ["text"],
};

export function getProviders() {
  return ["openai"];
}

export function getModels(provider?: string) {
  return !provider || provider === "openai" ? [OPENAI_MODEL] : [];
}

export function getModel(provider: string, modelId: string) {
  return getModels(provider).find((model) => model.id === modelId);
}

export function isContextOverflow() {
  return false;
}

export function completeSimple(): never {
  throw new Error("completeSimple is not available in Jest shim");
}

export function streamSimple(): never {
  throw new Error("streamSimple is not available in Jest shim");
}
