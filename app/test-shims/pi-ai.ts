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

export function isContextOverflow(message: any): boolean {
  if (!message || message.stopReason !== "error" || !message.errorMessage) {
    return false;
  }
  const msg = String(message.errorMessage);
  const overflowPatterns = [
    /exceeds the context window/i,
    /prompt is too long/i,
    /maximum context length/i,
    /token limit exceeded/i,
    /context window exceeds limit/i,
    /exceeds the available context size/i,
    /too many tokens/i,
    /request_too_large/i,
  ];
  const nonOverflowPatterns = [
    /rate limit/i,
    /too many requests/i,
  ];
  if (nonOverflowPatterns.some((p) => p.test(msg))) return false;
  return overflowPatterns.some((p) => p.test(msg));
}

export function getSupportedThinkingLevels() {
  return ["off", "low", "medium", "high"];
}

export function createProvider(config: any) {
  return config;
}

export class EventStream<T = any, R = any> {
  private queue: T[] = [];
  private resolvers: Array<(value: IteratorResult<T, R>) => void> = [];
  private isEnded = false;
  private endResult?: R;

  constructor(
    private isEnd?: (event: T) => boolean,
    private getResult?: (event: T) => R,
  ) {}

  push(event: T) {
    if (this.isEnded) return;
    if (this.isEnd && this.isEnd(event)) {
      this.isEnded = true;
      this.endResult = this.getResult ? this.getResult(event) : undefined;
      const res = this.resolvers.shift();
      if (res) res({ done: true, value: this.endResult as any });
      return;
    }
    const res = this.resolvers.shift();
    if (res) {
      res({ done: false, value: event });
    } else {
      this.queue.push(event);
    }
  }

  end(result?: R) {
    this.isEnded = true;
    this.endResult = result;
    const res = this.resolvers.shift();
    if (res) res({ done: true, value: result as any });
  }

  [Symbol.asyncIterator](): AsyncIterator<T, R> {
    return {
      next: () => {
        if (this.queue.length > 0) {
          return Promise.resolve({ done: false, value: this.queue.shift()! });
        }
        if (this.isEnded) {
          return Promise.resolve({ done: true, value: this.endResult as any });
        }
        return new Promise((resolve) => this.resolvers.push(resolve));
      },
    };
  }
}

export function createModels() {
  return {
    setProvider() {},
    streamSimple(): never {
      throw new Error("streamSimple is not available in Jest shim");
    },
    completeSimple(): never {
      throw new Error("completeSimple is not available in Jest shim");
    },
  };
}

export function completeSimple(): never {
  throw new Error("completeSimple is not available in Jest shim");
}

export function streamSimple(): never {
  throw new Error("streamSimple is not available in Jest shim");
}
