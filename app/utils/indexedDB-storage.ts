import { StateStorage } from "zustand/middleware";
import { safeLocalStorage } from "@/app/utils";
import { getPiSettingsStore } from "./pi-storage";

const localStorage = safeLocalStorage();

class PiSettingsBackedStorage implements StateStorage {
  private readonly settingsStore = getPiSettingsStore();

  async getItem(name: string): Promise<string | null> {
    try {
      const value = await this.settingsStore.get<string>(name);
      if (typeof value === "string") {
        return value;
      }
    } catch {
      // fall through to localStorage fallback
    }
    return localStorage.getItem(name);
  }

  async setItem(name: string, value: string): Promise<void> {
    try {
      await this.settingsStore.set(name, value);
      return;
    } catch {
      localStorage.setItem(name, value);
    }
  }

  async removeItem(name: string): Promise<void> {
    try {
      await this.settingsStore.delete(name);
      return;
    } catch {
      localStorage.removeItem(name);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.settingsStore.clear();
    } catch {
      // ignore and still clear fallback storage
    }
    localStorage.clear();
  }
}

export const indexedDBStorage = new PiSettingsBackedStorage();
