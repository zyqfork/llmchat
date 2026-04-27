export interface StorageBackend {
  get<T = unknown>(storeName: string, key: string): Promise<T | null>;
  set<T = unknown>(storeName: string, key: string, value: T): Promise<void>;
  delete(storeName: string, key: string): Promise<void>;
  keys(storeName: string, prefix?: string): Promise<string[]>;
  clear(storeName: string): Promise<void>;
  getQuotaInfo(): Promise<{ usage: number; quota: number; percent: number }>;
  requestPersistence(): Promise<boolean>;
}

export interface IndexedDBConfig {
  dbName: string;
  version: number;
  stores: Array<{
    name: string;
    keyPath?: string;
    autoIncrement?: boolean;
    indices?: Array<{
      name: string;
      keyPath: string;
      unique?: boolean;
    }>;
  }>;
}

// Adapted from @mariozechner/pi-web-ui IndexedDBStorageBackend.
export class IndexedDBStorageBackend implements StorageBackend {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(private readonly config: IndexedDBConfig) {}

  private async getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.config.dbName, this.config.version);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = () => {
          const db = request.result;
          for (const storeConfig of this.config.stores) {
            if (!db.objectStoreNames.contains(storeConfig.name)) {
              const store = db.createObjectStore(storeConfig.name, {
                keyPath: storeConfig.keyPath,
                autoIncrement: storeConfig.autoIncrement,
              });
              if (storeConfig.indices) {
                for (const indexConfig of storeConfig.indices) {
                  store.createIndex(indexConfig.name, indexConfig.keyPath, {
                    unique: indexConfig.unique,
                  });
                }
              }
            }
          }
        };
      });
    }
    return this.dbPromise;
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T = unknown>(storeName: string, key: string): Promise<T | null> {
    const db = await this.getDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const result = await this.promisifyRequest(store.get(key));
    return (result as T | undefined) ?? null;
  }

  async set<T = unknown>(
    storeName: string,
    key: string,
    value: T,
  ): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    if (store.keyPath) {
      await this.promisifyRequest(store.put(value));
    } else {
      await this.promisifyRequest(store.put(value, key));
    }
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    await this.promisifyRequest(store.delete(key));
  }

  async keys(storeName: string, prefix?: string): Promise<string[]> {
    const db = await this.getDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    if (prefix) {
      const range = IDBKeyRange.bound(prefix, `${prefix}\uffff`, false, false);
      const keys = await this.promisifyRequest(store.getAllKeys(range));
      return keys.map((k) => String(k));
    }

    const keys = await this.promisifyRequest(store.getAllKeys());
    return keys.map((k) => String(k));
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    await this.promisifyRequest(store.clear());
  }

  async getQuotaInfo(): Promise<{
    usage: number;
    quota: number;
    percent: number;
  }> {
    if (!navigator.storage?.estimate) {
      return { usage: 0, quota: 0, percent: 0 };
    }
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return {
      usage,
      quota,
      percent: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }

  async requestPersistence(): Promise<boolean> {
    if (!navigator.storage?.persist) {
      return false;
    }
    return navigator.storage.persist();
  }
}

// Adapted from @mariozechner/pi-web-ui SettingsStore.
export class SettingsStore {
  constructor(private readonly backend: StorageBackend) {}

  async get<T>(key: string): Promise<T | null> {
    return this.backend.get<T>("settings", key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.backend.set("settings", key, value);
  }

  async delete(key: string): Promise<void> {
    await this.backend.delete("settings", key);
  }

  async list(): Promise<string[]> {
    return this.backend.keys("settings");
  }

  async clear(): Promise<void> {
    await this.backend.clear("settings");
  }
}

let backendInstance: IndexedDBStorageBackend | null = null;
let settingsStoreInstance: SettingsStore | null = null;

export function getPiSettingsStore(): SettingsStore {
  if (!settingsStoreInstance) {
    backendInstance = new IndexedDBStorageBackend({
      dbName: "llmchat-storage",
      version: 1,
      stores: [{ name: "settings" }],
    });
    settingsStoreInstance = new SettingsStore(backendInstance);
  }
  return settingsStoreInstance;
}
