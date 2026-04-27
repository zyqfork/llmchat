type PiSettingsStore = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
  clear(): Promise<void>;
};

type PiWebUiModule = {
  IndexedDBStorageBackend: new (config: any) => any;
  SettingsStore: new (backend: any) => PiSettingsStore;
};

class LocalStorageSettingsStore implements PiSettingsStore {
  private readonly prefix = "pi_settings_";

  private key(name: string) {
    return `${this.prefix}${name}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(this.key(key));
    if (value == null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof window === "undefined") return;
    const payload =
      typeof value === "string" ? value : JSON.stringify(value ?? null);
    window.localStorage.setItem(this.key(key), payload);
  }

  async delete(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(this.key(key));
  }

  async list(): Promise<string[]> {
    if (typeof window === "undefined") return [];
    const out: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const full = window.localStorage.key(i) || "";
      if (full.startsWith(this.prefix)) {
        out.push(full.slice(this.prefix.length));
      }
    }
    return out;
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    const keys = await this.list();
    keys.forEach((k) => window.localStorage.removeItem(this.key(k)));
  }
}

let settingsStorePromise: Promise<PiSettingsStore> | null = null;

async function loadPiWebUiStore(): Promise<PiSettingsStore> {
  if (typeof window === "undefined") {
    return new LocalStorageSettingsStore();
  }

  try {
    const mod = (await import("@mariozechner/pi-web-ui")) as PiWebUiModule;
    const backend = new mod.IndexedDBStorageBackend({
      dbName: "llmchat-storage",
      version: 1,
      stores: [{ name: "settings" }],
    });
    return new mod.SettingsStore(backend);
  } catch {
    return new LocalStorageSettingsStore();
  }
}

function getStorePromise(): Promise<PiSettingsStore> {
  if (!settingsStorePromise) {
    settingsStorePromise = loadPiWebUiStore();
  }
  return settingsStorePromise;
}

const settingsStoreFacade: PiSettingsStore = {
  async get<T>(key: string): Promise<T | null> {
    const store = await getStorePromise();
    return store.get<T>(key);
  },
  async set<T>(key: string, value: T): Promise<void> {
    const store = await getStorePromise();
    return store.set(key, value);
  },
  async delete(key: string): Promise<void> {
    const store = await getStorePromise();
    return store.delete(key);
  },
  async list(): Promise<string[]> {
    const store = await getStorePromise();
    return store.list();
  },
  async clear(): Promise<void> {
    const store = await getStorePromise();
    return store.clear();
  },
};

export function getPiSettingsStore(): PiSettingsStore {
  return settingsStoreFacade;
}
