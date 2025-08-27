import { StateStorage } from "zustand/middleware";
import { get, set, del, clear } from "idb-keyval";
import { safeLocalStorage } from "@/app/utils";
import { initSmartStorage } from "./debounced-storage";
import { initStorageMigration } from "./storage-migration";

const localStorage = safeLocalStorage();

class IndexedDBStorage implements StateStorage {
  public async getItem(name: string): Promise<string | null> {
    try {
      const value = (await get(name)) || localStorage.getItem(name);
      return value;
    } catch (error) {
      return localStorage.getItem(name);
    }
  }

  public async setItem(name: string, value: string): Promise<void> {
    try {
      await set(name, value);
    } catch (error) {
      localStorage.setItem(name, value);
    }
  }

  public async removeItem(name: string): Promise<void> {
    try {
      await del(name);
    } catch (error) {
      localStorage.removeItem(name);
    }
  }

  public async clear(): Promise<void> {
    try {
      await clear();
    } catch (error) {
      localStorage.clear();
    }
  }
}

export const indexedDBStorage = new IndexedDBStorage();

// 初始化智能存储管理器
export const smartStorageManager = initSmartStorage(indexedDBStorage);

// 初始化存储迁移（应用启动时自动执行）
if (typeof window !== "undefined") {
  // 延迟执行，确保页面加载完成
  setTimeout(() => {
    initStorageMigration().catch(console.error);
  }, 1000);
}
