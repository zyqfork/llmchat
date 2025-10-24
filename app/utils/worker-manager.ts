/**
 * Worker 管理器 - 统一管理 Web Workers
 */

class WorkerManager {
  private workers: Map<string, Worker> = new Map();

  getWorker(name: string, workerPath: string): Worker {
    if (!this.workers.has(name)) {
      const worker = new Worker(new URL(workerPath, import.meta.url));
      this.workers.set(name, worker);
    }
    return this.workers.get(name)!;
  }

  terminateWorker(name: string) {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
  }

  terminateAll() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers.clear();
  }
}

export const workerManager = new WorkerManager();

// Token 计算 Worker 包装
export function createTokenizerWorker() {
  const worker = workerManager.getWorker(
    "tokenizer",
    "../workers/tokenizer.worker.ts",
  );

  return {
    estimateTokens(text: string): Promise<number> {
      return new Promise((resolve, reject) => {
        const handler = (e: MessageEvent) => {
          if (e.data.type === "result") {
            worker.removeEventListener("message", handler);
            resolve(e.data.tokenCount);
          } else if (e.data.type === "error") {
            worker.removeEventListener("message", handler);
            reject(new Error(e.data.message));
          }
        };

        worker.addEventListener("message", handler);
        worker.postMessage({ type: "estimate", data: { text } });
      });
    },

    batchEstimate(
      texts: string[],
    ): Promise<Array<{ text: string; tokens: number }>> {
      return new Promise((resolve, reject) => {
        const handler = (e: MessageEvent) => {
          if (e.data.type === "batchResult") {
            worker.removeEventListener("message", handler);
            resolve(e.data.results);
          } else if (e.data.type === "error") {
            worker.removeEventListener("message", handler);
            reject(new Error(e.data.message));
          }
        };

        worker.addEventListener("message", handler);
        worker.postMessage({ type: "batch", data: { texts } });
      });
    },

    terminate() {
      workerManager.terminateWorker("tokenizer");
    },
  };
}
