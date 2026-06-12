export class SettingsStore {
  private data = new Map<string, unknown>();

  setBackend(_backend: unknown) {}

  async get<T>(key: string): Promise<T | null> {
    return this.data.has(key) ? (this.data.get(key) as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async list(): Promise<string[]> {
    return [...this.data.keys()];
  }

  async clear(): Promise<void> {
    this.data.clear();
  }
}
