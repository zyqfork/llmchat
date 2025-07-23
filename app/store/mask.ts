import { BUILTIN_MASKS } from "../masks";
import { getLang, Lang } from "../locales";
import { DEFAULT_TOPIC, ChatMessage } from "./chat";
import { ModelConfig, useAppConfig } from "./config";
import { StoreKey } from "../constant";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";

export type Mask = {
  id: string;
  createdAt: number;
  avatar: string;
  name: string;
  hideContext?: boolean;
  context: ChatMessage[];
  syncGlobalConfig?: boolean;
  modelConfig: ModelConfig;
  defaultModel?: string; // 添加默认模型配置
  lang: Lang;
  builtin: boolean;

  enableArtifacts?: boolean;
  enableCodeFold?: boolean;
};

export const DEFAULT_MASK_STATE = {
  masks: {} as Record<string, Mask>,
  language: undefined as Lang | undefined,
};

export type MaskState = typeof DEFAULT_MASK_STATE & {
  language?: Lang | undefined;
};

export const DEFAULT_MASK_AVATAR = "gpt-bot";
export const DEFAULT_MASK_ID = "default-mask";

export const createDefaultMask = () => {
  const globalConfig = useAppConfig.getState().modelConfig;
  console.log("=== createDefaultMask 调试信息 ===");
  console.log("全局模型配置:", globalConfig);
  console.log(`全局默认模型: ${globalConfig.model}`);

  const defaultMask = {
    id: DEFAULT_MASK_ID,
    avatar: "1f40b",
    name: "默认助手",
    context: [],
    syncGlobalConfig: true,
    modelConfig: { ...globalConfig },
    defaultModel: undefined, // 初始化默认模型为 undefined
    lang: getLang(),
    builtin: true, // 标记为内置，不可删除
    createdAt: Date.now(),
  } as Mask;

  console.log("创建的默认面具:", defaultMask);
  console.log(`默认面具的modelConfig.model: ${defaultMask.modelConfig.model}`);
  return defaultMask;
};

export const createEmptyMask = () =>
  ({
    id: nanoid(),
    avatar: DEFAULT_MASK_AVATAR,
    name: DEFAULT_TOPIC,
    context: [],
    syncGlobalConfig: true, // use global config as default
    modelConfig: { ...useAppConfig.getState().modelConfig },
    defaultModel: undefined, // 初始化默认模型为 undefined
    lang: getLang(),
    builtin: false,
    createdAt: Date.now(),
    plugin: [],
  }) as Mask;

export const useMaskStore = createPersistStore(
  { ...DEFAULT_MASK_STATE },

  (set, get) => ({
    create(mask?: Partial<Mask>) {
      const masks = get().masks;
      const id = nanoid();
      masks[id] = {
        ...createEmptyMask(),
        ...mask,
        id,
        builtin: false,
      };

      set(() => ({ masks }));
      get().markUpdate();

      return masks[id];
    },
    updateMask(id: string, updater: (mask: Mask) => void) {
      const masks = get().masks;
      const mask = masks[id];
      if (!mask) return;
      const updateMask = { ...mask };
      updater(updateMask);
      masks[id] = updateMask;
      set(() => ({ masks }));
      get().markUpdate();
    },
    delete(id: string) {
      // 防止删除默认面具
      if (id === DEFAULT_MASK_ID) {
        console.warn("Cannot delete default mask");
        return;
      }
      const masks = get().masks;
      delete masks[id];
      set(() => ({ masks }));
      get().markUpdate();
    },

    get(id?: string) {
      return get().masks[id ?? 1145141919810];
    },
    getAll() {
      // 确保默认面具存在
      const masks = get().masks;
      if (!masks[DEFAULT_MASK_ID]) {
        const defaultMask = createDefaultMask();
        console.log("=== 创建默认面具调试信息 ===");
        console.log("新创建的默认面具:", defaultMask);
        masks[DEFAULT_MASK_ID] = defaultMask;
        set(() => ({ masks }));
      }

      const userMasks = Object.values(masks).sort(
        (a, b) => b.createdAt - a.createdAt,
      );

      console.log("=== 用户面具调试信息（新系统）===");
      userMasks.forEach((mask, index) => {
        console.log(`用户面具 ${index + 1}: ${mask.name}`);
        console.log(`  - defaultModel: ${mask.defaultModel || "未设置"}`);
        console.log(`  - modelConfig.model: ${mask.modelConfig.model}`);
        console.log(`  - syncGlobalConfig: ${mask.syncGlobalConfig}`);
      });

      const config = useAppConfig.getState();
      console.log("=== 全局配置调试信息 ===");
      console.log(`全局默认模型: ${config.modelConfig.model}`);

      if (config.hideBuiltinMasks) return userMasks;

      // 内置面具：只使用全局配置，不保留原有的模型设置
      const buildinMasks = BUILTIN_MASKS.map((m) => {
        const processedMask = {
          ...m,
          modelConfig: {
            ...config.modelConfig,
            // 保留内置面具的特殊配置
            temperature: m.modelConfig.temperature,
            max_tokens: m.modelConfig.max_tokens,
            presence_penalty: m.modelConfig.presence_penalty,
            frequency_penalty: m.modelConfig.frequency_penalty,
            sendMemory: m.modelConfig.sendMemory,
            historyMessageCount: m.modelConfig.historyMessageCount,
            compressMessageLengthThreshold:
              m.modelConfig.compressMessageLengthThreshold,
          },
        } as Mask;

        console.log(`=== 内置面具处理（新系统）: ${m.name} ===`);
        console.log(
          `最终 modelConfig.model: ${processedMask.modelConfig.model}`,
        );

        return processedMask;
      });

      return userMasks.concat(buildinMasks);
    },
    search(text: string) {
      return Object.values(get().masks);
    },
    setLanguage(language: Lang | undefined) {
      set({
        language,
      });
    },
  }),
  {
    name: StoreKey.Mask,
    version: 3.1,

    migrate(state, version) {
      const newState = JSON.parse(JSON.stringify(state)) as MaskState;

      // migrate mask id to nanoid
      if (version < 3) {
        Object.values(newState.masks).forEach((m) => (m.id = nanoid()));
      }

      if (version < 3.1) {
        const updatedMasks: Record<string, Mask> = {};
        Object.values(newState.masks).forEach((m) => {
          updatedMasks[m.id] = m;
        });
        newState.masks = updatedMasks;
      }

      // 确保默认面具存在
      if (!newState.masks[DEFAULT_MASK_ID]) {
        newState.masks[DEFAULT_MASK_ID] = createDefaultMask();
      }

      return newState as any;
    },
  },
);
