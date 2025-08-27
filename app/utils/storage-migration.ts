import { safeLocalStorage } from "@/app/utils";
import { indexedDBStorage } from "./indexedDB-storage";

const localStorage = safeLocalStorage();

// 需要迁移的所有配置存储键
const MIGRATION_KEYS = [
  "app-config", // StoreKey.Config - 应用配置（模型配置、主题等）
  "access-control", // StoreKey.Access - 访问控制（API密钥、提供商配置等）
  "mask-store", // StoreKey.Mask - 助手配置
  "prompt-store", // StoreKey.Prompt - 提示词配置
  "sync", // StoreKey.Sync - 同步配置
  "chat-update", // StoreKey.Update - 更新配置
  "mcp-store", // StoreKey.Mcp - MCP配置
];

// 迁移状态标记
const MIGRATION_COMPLETED_KEY = "storage-migration-completed-v2";

/**
 * 配置数据迁移工具
 * 将重要配置从 localStorage 迁移到智能存储系统
 */
export class StorageMigration {
  private static instance: StorageMigration | null = null;

  static getInstance(): StorageMigration {
    if (!StorageMigration.instance) {
      StorageMigration.instance = new StorageMigration();
    }
    return StorageMigration.instance;
  }

  /**
   * 检查是否需要迁移
   */
  async shouldMigrate(): Promise<boolean> {
    // 检查迁移标记
    const migrationCompleted = localStorage.getItem(MIGRATION_COMPLETED_KEY);
    if (migrationCompleted === "true") {
      return false;
    }

    // 检查是否有旧数据需要迁移
    for (const key of MIGRATION_KEYS) {
      const oldData = localStorage.getItem(key);
      if (oldData && oldData.trim() !== "") {
        console.log(`[Migration] Found config data to migrate for key: ${key}`);
        return true;
      }
    }

    return false;
  }

  /**
   * 执行迁移
   */
  async migrate(): Promise<void> {
    try {
      console.log("[Migration] Starting configuration migration...");
      let migratedCount = 0;
      const migrationResults: Record<string, "success" | "skipped" | "failed"> =
        {};

      for (const key of MIGRATION_KEYS) {
        const oldData = localStorage.getItem(key);
        if (oldData && oldData.trim() !== "") {
          try {
            // 检查新存储中是否已有数据
            const existingData = await indexedDBStorage.getItem(key);
            if (!existingData || existingData.trim() === "") {
              // 验证数据格式是否有效
              if (this.isValidConfigData(oldData)) {
                // 迁移数据到新存储
                await indexedDBStorage.setItem(key, oldData);
                console.log(`[Migration] ✅ Migrated ${key}`);
                migrationResults[key] = "success";
                migratedCount++;
              } else {
                console.warn(
                  `[Migration] ⚠️ Invalid data format for ${key}, skipping`,
                );
                migrationResults[key] = "failed";
              }
            } else {
              console.log(
                `[Migration] ⏭️ Skipping ${key} - already exists in new storage`,
              );
              migrationResults[key] = "skipped";
            }
          } catch (error) {
            console.error(`[Migration] ❌ Failed to migrate ${key}:`, error);
            migrationResults[key] = "failed";
            // 迁移失败时保留原数据，不删除
          }
        }
      }

      // 标记迁移完成
      localStorage.setItem(MIGRATION_COMPLETED_KEY, "true");
      console.log(`[Migration] ✅ Configuration migration completed!`);
      console.log(`[Migration] Successfully migrated: ${migratedCount} items`);
      console.log(`[Migration] Results:`, migrationResults);

      // 如果有成功迁移的项目，提示用户
      if (migratedCount > 0) {
        this.notifyUser(migratedCount, migrationResults);
      }
    } catch (error) {
      console.error("[Migration] ❌ Migration failed:", error);
      throw error;
    }
  }

  /**
   * 验证配置数据格式是否有效
   */
  private isValidConfigData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      return typeof parsed === "object" && parsed !== null;
    } catch {
      return false;
    }
  }

  /**
   * 通知用户迁移结果
   */
  private notifyUser(
    migratedCount: number,
    results: Record<string, string>,
  ): void {
    if (typeof window === "undefined") return;

    const configNames = {
      "app-config": "应用配置",
      "access-control": "API密钥和提供商配置",
      "mask-store": "助手配置",
      "prompt-store": "提示词配置",
      sync: "同步配置",
      "chat-update": "更新配置",
      "mcp-store": "MCP工具配置",
    };

    const successItems = Object.entries(results)
      .filter(([_, status]) => status === "success")
      .map(([key, _]) => configNames[key as keyof typeof configNames] || key)
      .join("、");

    const message = `🎉 配置迁移完成！\n\n已成功迁移 ${migratedCount} 项配置：\n${successItems}\n\n您的设置已保存到新的存储系统中，性能将显著提升。`;

    console.log(`[Migration] ${message}`);

    // 可选：显示用户通知
    setTimeout(() => {
      if (
        window.confirm(
          `${message}\n\n是否要删除旧的配置数据？（建议确认新配置正常后再删除）`,
        )
      ) {
        this.cleanupOldData().then(() => {
          window.location.reload(); // 重新加载页面确保使用新存储
        });
      }
    }, 1000);
  }

  /**
   * 清理旧数据（可选，建议用户手动执行）
   */
  async cleanupOldData(): Promise<void> {
    console.log("[Migration] 🧹 Starting cleanup of old configuration data...");
    let cleanedCount = 0;

    for (const key of MIGRATION_KEYS) {
      try {
        // 确认新存储中有数据后再删除旧数据
        const newData = await indexedDBStorage.getItem(key);
        const oldData = localStorage.getItem(key);

        if (newData && oldData) {
          localStorage.removeItem(key);
          console.log(`[Migration] 🗑️ Cleaned up old data for ${key}`);
          cleanedCount++;
        }
      } catch (error) {
        console.warn(`[Migration] ⚠️ Failed to cleanup ${key}:`, error);
      }
    }

    console.log(
      `[Migration] ✅ Cleanup completed! Removed ${cleanedCount} old config items.`,
    );
  }

  /**
   * 重置迁移状态（开发调试用）
   */
  resetMigrationState(): void {
    localStorage.removeItem(MIGRATION_COMPLETED_KEY);
    console.log("[Migration] 🔄 Migration state reset");
  }
}

/**
 * 初始化配置迁移（应用启动时调用）
 */
export async function initStorageMigration(): Promise<void> {
  try {
    const migration = StorageMigration.getInstance();

    if (await migration.shouldMigrate()) {
      console.log(
        "[Migration] 🚀 Starting automatic configuration migration...",
      );
      await migration.migrate();
    } else {
      console.log(
        "[Migration] ✨ No migration needed, all configurations are up to date.",
      );
    }
  } catch (error) {
    console.error("[Migration] ❌ Auto-migration failed:", error);
    // 迁移失败时不阻塞应用启动
  }
}
