import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ServiceProvider, DEFAULT_MODELS } from "../constant";
import { useAccessStore, CustomProviderType } from "../store/access";
import { LLMModel } from "../client/api";
import { ModelFetcher } from "../client/model-fetcher";
import { showToast } from "./ui-lib";
import { ModelConfigModal } from "./model-config-modal";
import styles from "./model-manager.module.scss";

import CloseIcon from "../icons/close.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ConfigIcon from "../icons/config.svg";
import DeleteIcon from "../icons/delete.svg";
import LoadingIcon from "../icons/three-dots.svg";
import { ModelProviderIcon } from "./provider-icon";
import { ModelCapabilityIcons } from "./model-capability-icons";
import { getModelCapabilities, ModelCapabilities } from "../constant";
import { collectModels } from "../utils/model";
import {
  getModelContextTokens,
  formatTokenCount,
  saveCustomContextTokens,
  saveCustomModelCapabilities,
} from "../config/model-config";
import { saveModelStreamConfig } from "../config/model-stream";
import { logger } from "../utils/logger";

interface ModelManagerProps {
  provider: string; // 支持自定义服务商ID
  onClose: () => void;
}

interface CustomModelForm {
  modelId: string;
  category: string;
}

interface ModelConfigForm {
  modelId: string;
  category: string;
  capabilities: {
    vision: boolean;
    reasoning: boolean;
    tools: boolean;
  };
  contextTokens?: number;
}

interface ModelTestResult {
  status: "idle" | "testing" | "success" | "error";
  responseTime?: number;
  error?: string;
}

// 自定义Modal组件，不受ui-lib限制
interface CustomModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function CustomModal({ title, children, onClose }: CustomModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles["custom-modal-mask"]}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`${styles["custom-modal"]} ${
          isMaximized ? styles["maximized"] : ""
        }`}
      >
        <div className={styles["custom-modal-header"]}>
          <h2 className={styles["custom-modal-title"]}>{title}</h2>
          <div className={styles["custom-modal-actions"]}>
            <button
              className={`${styles["custom-modal-action"]} no-dark`}
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <MinIcon /> : <MaxIcon />}
            </button>
            <button
              className={`${styles["custom-modal-action"]} no-dark`}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className={styles["custom-modal-content"]}>{children}</div>
      </div>
    </div>
  );
}

// 基于模型名称的分类映射（用于默认分组显示）
const MODEL_NAME_CATEGORIES: Record<string, string[]> = {
  "GPT-5": ["gpt-5"],
  "GPT-4o": ["gpt-4o"],
  "GPT-4.5": ["gpt-4.5"],
  "GPT-4.1": ["gpt-4.1"],
  "GPT-4": ["gpt-4", "gpt-4-turbo"],
  "GPT-3.5": ["gpt-3.5-turbo"],
  "GPT-OSS": ["gpt-oss"],
  O系列: ["o1-preview", "o1-mini", "o1-2024-12-17", "o3", "o4-mini"],
  "Gemini 2.5": ["gemini-2.5"],
  "Gemini 2.0": ["gemini-2.0"],
  "Gemini 1.5": ["gemini-1.5"],
  "Gemini Pro": ["gemini-pro"],
  "Claude 4": ["claude-sonnet-4", "claude-opus-4"],
  "Claude 3.7": ["claude-3-7"],
  "Claude 3.5": ["claude-3-5"],
  "Claude 3": ["claude-3"],
  "DeepSeek R1": ["deepseek-r1"],
  "DeepSeek V3": ["deepseek-v3"],
  DeepSeek: ["deepseek-chat", "deepseek-reasoner"],
  "Qwen 3": ["qwen3"],
  "Qwen 2.5": ["qwen2.5"],
  "Qwen 2": ["qwen2"],
  Qwen: ["qwen-max", "qwen-plus", "qwen-turbo", "qwen-coder", "qwen-vl"],
  QwQ: ["qwq"],
  QvQ: ["qvq"],
  Kimi: ["kimi"],
  Moonshot: ["moonshot"],
  "Grok 3": ["grok-3"],
  "Grok 2": ["grok-2", "grok-vision"],
  Grok: ["grok-beta"],
  自定义模型: [], // 新增：专门用于自定义模型的分组
  其他: [],
};

// 基于能力的模型过滤器
const CAPABILITY_FILTERS: Record<string, (model: any) => boolean> = {
  视觉: (model: any) => {
    const capabilities = getModelCapabilities(model.name);
    return capabilities.vision === true;
  },
  推理: (model: any) => {
    const capabilities = getModelCapabilities(model.name);
    return capabilities.reasoning === true;
  },
  工具: (model: any) => {
    const capabilities = getModelCapabilities(model.name);
    return capabilities.tools === true;
  },
};

export function ModelManager({ provider, onClose }: ModelManagerProps) {
  const accessStore = useAccessStore();
  // 使用 selector 来订阅 customModels 的变化
  const customModels = useAccessStore((state) => state.customModels);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [showAddCustomModel, setShowAddCustomModel] = useState(false);
  const [customModelForm, setCustomModelForm] = useState<CustomModelForm>({
    modelId: "",
    category: "",
  });
  const [showModelConfig, setShowModelConfig] = useState<string | null>(null);
  const [modelConfigForm, setModelConfigForm] = useState<ModelConfigForm>({
    modelId: "",
    category: "",
    capabilities: {
      vision: false,
      reasoning: false,
      tools: false,
    },
  });

  // 处理关闭事件，清理临时缓存
  const handleClose = useCallback(() => {
    // 注意：这里不清理缓存，因为其他组件可能还在使用
    // 缓存会在下次打开模型管理器时自动刷新
    onClose();
  }, [onClose]);

  // 模型测试状态
  const [modelTestResults, setModelTestResults] = useState<
    Record<string, ModelTestResult>
  >({});

  // API模型获取状态
  const [isLoadingAPIModels, setIsLoadingAPIModels] = useState(false);
  const [apiModels, setApiModels] = useState<LLMModel[]>([]);

  // 获取API获取开关状态
  const fetchFromAPIEnabled =
    accessStore.fetchModelsFromAPI?.[provider] ?? true;

  // 检查是否是自定义服务商
  const isCustomProvider =
    typeof provider === "string" && provider.startsWith("custom_");
  const customProviderConfig = isCustomProvider
    ? accessStore.customProviders.find((p) => p.id === provider)
    : null;

  // 获取显示名称
  const getProviderDisplayName = useCallback(() => {
    if (isCustomProvider && customProviderConfig) {
      return customProviderConfig.name;
    }
    return provider as string;
  }, [isCustomProvider, customProviderConfig, provider]);

  // 获取当前服务商的所有模型（包含自定义模型）
  const providerModels = useMemo(() => {
    logger.debug("[ModelManager] 重新计算 providerModels:", {
      provider,
      customModels,
      apiModelsCount: apiModels.length,
      isCustomProvider,
      customProviderConfig,
    });

    // 获取包含自定义模型的完整列表（无论是否有API模型）
    const allModels = collectModels(DEFAULT_MODELS, customModels || "");

    logger.debug("[ModelManager] 所有模型（包含自定义）:", allModels);

    if (isCustomProvider && customProviderConfig) {
      // 对于自定义服务商，根据其类型获取相应的模型
      // 根据自定义厂商类型映射到对应的内置厂商
      const typeToProviderMap: Record<CustomProviderType, string> = {
        openai: ServiceProvider.OpenAI.name,
        google: ServiceProvider.Google.name,
        anthropic: ServiceProvider.Anthropic.name,
      };

      const providerName = typeToProviderMap[customProviderConfig.type];
      if (!providerName) {
        return [];
      }

      const baseModels = DEFAULT_MODELS.filter((model) => {
        return model.provider.providerName === providerName;
      });

      // 过滤出当前自定义服务商下的手动添加模型
      const customProviderManualModels = allModels.filter((model) => {
        if (!model.provider) return false;
        const modelProviderId = (model.provider.id || "").toLowerCase();
        const modelProviderName = (
          model.provider.providerName || ""
        ).toLowerCase();
        const currentProviderId = (provider as string).toLowerCase();
        return (
          modelProviderId === currentProviderId ||
          modelProviderName === currentProviderId
        );
      });

      // 为自定义服务商创建模型副本，使用自定义服务商的ID
      const customProviderModels = baseModels.map((model) => ({
        ...model,
        provider: {
          ...model.provider,
          id: provider as string,
          providerName: provider as string,
        },
      }));

      // 如果有API模型，合并API模型和自定义模型
      if (apiModels.length > 0) {
        // 合并API模型、基础模型和手动添加模型，去重
        const modelMap = new Map();
        [
          ...apiModels,
          ...customProviderModels,
          ...customProviderManualModels,
        ].forEach((model) => {
          const key = `${model.name}@${model.provider?.id}`;
          if (!modelMap.has(key)) {
            modelMap.set(key, model);
          }
        });
        const mergedModels = Array.from(modelMap.values());
        logger.debug("[ModelManager] 合并API和自定义服务商模型:", mergedModels);
        return mergedModels;
      }

      // 没有API模型时，也要包含手动添加模型
      const modelMap = new Map();
      [...customProviderModels, ...customProviderManualModels].forEach(
        (model) => {
          const key = `${model.name}@${model.provider?.id}`;
          if (!modelMap.has(key)) {
            modelMap.set(key, model);
          }
        },
      );

      const mergedModels = Array.from(modelMap.values());
      logger.debug("[ModelManager] 自定义服务商模型:", mergedModels);
      return mergedModels;
    } else {
      // 内置服务商的原有逻辑
      const defaultModels = DEFAULT_MODELS.filter(
        (model) => model.provider.providerName === provider,
      );

      logger.debug("[ModelManager] 默认模型:", defaultModels);

      // 过滤出当前服务商的模型（包括自定义模型）
      const providerCustomModels = allModels.filter((model) => {
        if (!model.provider) return false;
        // 对于自定义模型，比较时忽略大小写
        const modelProviderName = model.provider.providerName.toLowerCase();
        const currentProviderName = (provider as string).toLowerCase();

        logger.debug("[ModelManager] 模型提供商比较:", {
          modelName: model.name,
          modelProviderName,
          currentProviderName,
          isMatch: modelProviderName === currentProviderName,
        });

        // 检查是否是同一个提供商
        return modelProviderName === currentProviderName;
      });

      logger.debug(
        "[ModelManager] 当前服务商的自定义模型:",
        providerCustomModels,
      );

      // 如果有API模型，合并API模型和自定义模型
      if (apiModels.length > 0) {
        // 合并API模型和自定义模型，去重
        const modelMap = new Map();

        // 首先添加API模型
        apiModels.forEach((model) => {
          const key = `${model.name}@${model.provider?.id}`;
          if (!modelMap.has(key)) {
            modelMap.set(key, model);
          }
        });

        // 然后添加自定义模型（如果存在的话）
        providerCustomModels.forEach((model) => {
          const key = `${model.name}@${model.provider?.id}`;
          // 自定义模型可以覆盖API模型，或者如果key不存在则添加
          modelMap.set(key, model);
        });

        const mergedModels = Array.from(modelMap.values());
        logger.debug("[ModelManager] 合并API和自定义模型:", mergedModels);
        return mergedModels;
      }

      // 合并默认模型和自定义模型，去重
      const modelMap = new Map();
      [...defaultModels, ...providerCustomModels].forEach((model) => {
        const key = `${model.name}@${model.provider?.id}`;
        if (!modelMap.has(key)) {
          modelMap.set(key, model);
        }
      });

      const finalResult = Array.from(modelMap.values());
      logger.debug("[ModelManager] 最终模型列表:", finalResult);
      return finalResult;
    }
  }, [
    provider,
    customModels,
    apiModels,
    isCustomProvider,
    customProviderConfig,
  ]);

  // 获取已启用的模型
  const enabledModels = accessStore.enabledModels?.[provider] || [];

  // 从API获取模型
  const fetchModelsFromAPI = useCallback(async () => {
    setIsLoadingAPIModels(true);
    const store = useAccessStore.getState();
    store.setModelsFetchStatus(provider, "loading");

    try {
      const result = await ModelFetcher.fetchModels(provider);

      if (result.success) {
        setApiModels(result.models);
        // 更新临时缓存，供其他组件使用
        store.setApiModelsCache(provider, result.models);
        store.setModelsFetchStatus(provider, "success");
        // 清理该服务商下无效的已启用模型
        store.sanitizeEnabledModels(provider, result.models);
        showToast(`模型列表获取成功，共 ${result.models.length} 个模型`);
      } else {
        throw new Error(result.error || "获取模型失败");
      }
    } catch (error) {
      store.setModelsFetchStatus(provider, "error");

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const displayName =
        isCustomProvider && customProviderConfig
          ? customProviderConfig.name
          : (provider as string);

      // 显示更详细的错误信息
      showToast(`${displayName} 模型获取失败: ${errorMessage}`);

      // 获取失败时不自动关闭API获取，让用户手动决定
      // store.setFetchModelsFromAPI(provider, false);
    } finally {
      setIsLoadingAPIModels(false);
    }
  }, [provider, isCustomProvider, customProviderConfig]);

  // 处理API获取开关切换
  const handleToggleAPIFetch = useCallback(
    async (enabled: boolean) => {
      const store = useAccessStore.getState();
      store.setFetchModelsFromAPI(provider, enabled);

      if (enabled) {
        // 开启时立即获取模型
        await fetchModelsFromAPI();
      } else {
        // 关闭时清除API模型缓存
        setApiModels([]);
        store.clearApiModelsCache(provider);
        store.setModelsFetchStatus(provider, "idle");
      }
    },
    [provider, fetchModelsFromAPI],
  );

  // 每次打开模型管理界面时都重新获取最新的API模型
  useEffect(() => {
    const store = useAccessStore.getState();
    const shouldFetchFromAPI = store.fetchModelsFromAPI?.[provider] ?? true;

    if (shouldFetchFromAPI) {
      // 只在没有缓存时获取模型，避免每次打开都刷新
      const cachedModels = store.apiModelsCache?.[provider];
      if (!cachedModels || cachedModels.length === 0) {
        fetchModelsFromAPI();
      } else {
        // 使用缓存的模型
        setApiModels(cachedModels);
      }
    } else {
      // 如果关闭了API获取，清空API模型
      setApiModels([]);
      // 同时清除缓存
      store.clearApiModelsCache(provider);
    }
  }, [provider, fetchModelsFromAPI]);

  // 分类模型
  const categorizedModels = useMemo(() => {
    const categories: Record<string, LLMModel[]> = {};

    // 初始化分类
    Object.keys(MODEL_NAME_CATEGORIES).forEach((category) => {
      categories[category] = [];
    });

    providerModels.forEach((model) => {
      let categorized = false;

      // 首先检查是否是自定义模型（通过provider类型判断）
      const isCustomModel = model.provider?.providerType === "custom";

      if (isCustomModel) {
        // 自定义模型优先归入"自定义模型"分组
        categories["自定义模型"].push(model);
        categorized = true;
      } else if (model.displayName && model.displayName !== model.name) {
        // 对于非自定义模型，如果有自定义显示名称，则使用自定义分组
        const customCategory = model.displayName;
        if (!categories[customCategory]) {
          categories[customCategory] = [];
        }
        categories[customCategory].push(model);
        categorized = true;
      } else {
        // 根据模型名称匹配分类
        for (const [category, patterns] of Object.entries(
          MODEL_NAME_CATEGORIES,
        )) {
          if (category === "其他" || category === "自定义模型") continue;

          if (
            patterns.some((pattern) =>
              model.name.toLowerCase().includes(pattern.toLowerCase()),
            )
          ) {
            categories[category].push(model);
            categorized = true;
            break;
          }
        }
      }

      // 未分类的放入"其他"
      if (!categorized) {
        if (!categories["其他"]) {
          categories["其他"] = [];
        }
        categories["其他"].push(model);
      }
    });

    // 移除空分类
    Object.keys(categories).forEach((category) => {
      if (categories[category].length === 0) {
        delete categories[category];
      }
    });

    return categories;
  }, [providerModels]);

  // 过滤后的分类模型（用于分组显示）
  const filteredCategorizedModels = useMemo(() => {
    if (selectedCategory !== "全部" && CAPABILITY_FILTERS[selectedCategory]) {
      // 如果选择了能力过滤，对每个分类中的模型进行过滤
      const filtered: Record<string, LLMModel[]> = {};
      Object.entries(categorizedModels).forEach(([category, models]) => {
        const filteredCategoryModels = models.filter(
          CAPABILITY_FILTERS[selectedCategory],
        );
        if (filteredCategoryModels.length > 0) {
          filtered[category] = filteredCategoryModels;
        }
      });
      return filtered;
    }

    // 按搜索词过滤分类模型（支持name和displayName搜索）
    if (searchTerm) {
      const filtered: Record<string, LLMModel[]> = {};
      Object.entries(categorizedModels).forEach(([category, models]) => {
        const filteredCategoryModels = models.filter((model) => {
          const searchLower = searchTerm.toLowerCase();
          const nameMatch = model.name.toLowerCase().includes(searchLower);
          const displayNameMatch =
            model.displayName &&
            model.displayName.toLowerCase().includes(searchLower);
          return nameMatch || displayNameMatch;
        });
        if (filteredCategoryModels.length > 0) {
          filtered[category] = filteredCategoryModels;
        }
      });
      return filtered;
    }

    return categorizedModels;
  }, [categorizedModels, selectedCategory, searchTerm]);

  // 切换模型启用状态
  const toggleModel = (modelName: string) => {
    accessStore.update((access) => {
      if (!access.enabledModels) {
        access.enabledModels = {} as Record<string, string[]>;
      }
      if (!access.enabledModels[provider]) {
        access.enabledModels[provider] = [];
      }

      const models = access.enabledModels[provider];
      const index = models.indexOf(modelName);

      if (index > -1) {
        models.splice(index, 1);
      } else {
        models.push(modelName);
      }
    });
  };

  // 添加自定义模型
  const addCustomModel = () => {
    if (!customModelForm.modelId.trim()) {
      alert("请输入模型ID");
      return;
    }

    const modelId = customModelForm.modelId.trim();
    const category = customModelForm.category.trim();

    // 构建带服务商的模型名称：modelId@provider（保持原始大小写）
    // 对于自定义服务商，使用其ID作为provider
    const providerForModel =
      isCustomProvider && customProviderConfig
        ? provider // 使用完整的自定义服务商ID
        : provider;
    const modelWithProvider = `${modelId}@${providerForModel}`;

    // 构建自定义模型字符串
    let customModelString = modelWithProvider;
    if (category) {
      customModelString = `${modelWithProvider}=${category}`;
    }

    // 先检查是否与API获取的模型重复
    const apiModelNames = new Set(apiModels.map((m) => m.name));
    if (apiModelNames.has(modelId)) {
      alert(`模型ID "${modelId}" 已存在于API获取的模型中，请使用其他名称`);
      return;
    }

    // 检查是否与现有自定义模型重复
    const currentCustomModels = customModels || "";
    const existingModels = currentCustomModels
      .split(",")
      .filter((m) => m.trim().length > 0);

    const modelExists = existingModels.some((m) => {
      const cleanModel =
        m.startsWith("+") || m.startsWith("-") ? m.slice(1) : m;
      const [existingModelWithProvider] = cleanModel.split("=");
      return existingModelWithProvider === modelWithProvider;
    });

    if (modelExists) {
      alert("该自定义模型已存在");
      return;
    }

    // 添加新模型
    const newCustomModels = [...existingModels, customModelString].join(",");

    logger.debug("[ModelManager] 添加模型前:", {
      currentCustomModels,
      existingModels,
      newModel: customModelString,
      newCustomModels,
      providerForModel,
      modelWithProvider,
      apiModelNames: Array.from(apiModelNames),
    });

    accessStore.update((access) => {
      access.customModels = newCustomModels;
      logger.debug(
        "[ModelManager] 更新后的 customModels:",
        access.customModels,
      );
    });

    // 重置表单并关闭
    setCustomModelForm({ modelId: "", category: "" });
    setShowAddCustomModel(false);
  };

  // 获取模型能力（包含自定义配置）
  const getLocalModelCapabilities = getModelCapabilities;

  // 打开模型配置
  const openModelConfig = (model: any) => {
    const currentCapabilities = getLocalModelCapabilities(model.name);

    // 获取当前分组信息
    let currentCategory = "";
    if (model.displayName && model.displayName !== model.name) {
      currentCategory = model.displayName;
    }

    // 获取当前上下文Token数配置
    const currentContextConfig = getModelContextTokens(model.name);
    const currentContextTokens = currentContextConfig?.contextTokens;

    setModelConfigForm({
      modelId: model.name,
      category: currentCategory || "",
      capabilities: {
        vision: currentCapabilities.vision || false,
        reasoning: currentCapabilities.reasoning || false,
        tools: currentCapabilities.tools || false,
      },
      contextTokens: currentContextTokens,
    });
    setShowModelConfig(model.name);
  };

  // 保存模型配置
  const saveModelConfig = () => {
    const modelName = modelConfigForm.modelId;
    const newCategory = (modelConfigForm.category || "").trim();

    // 获取当前从配置文件读取的能力（包括 reasoningField）
    const configCapabilities = getLocalModelCapabilities(modelName);

    // 合并用户修改的能力和配置文件中的 reasoningField
    const capabilitiesToSave: ModelCapabilities = {
      vision: modelConfigForm.capabilities.vision,
      reasoning: modelConfigForm.capabilities.reasoning,
      tools: modelConfigForm.capabilities.tools,
      // 保留 reasoningField（如果存在）
      ...(configCapabilities.reasoningField && {
        reasoningField: configCapabilities.reasoningField,
      }),
    };

    // 使用统一的保存函数
    saveCustomModelCapabilities(modelName, capabilitiesToSave);

    logger.debug("[ModelManager] 保存模型配置:", {
      modelName,
      capabilities: capabilitiesToSave,
    });

    // 保存上下文Token数配置
    if (modelConfigForm.contextTokens !== undefined) {
      saveCustomContextTokens(modelName, modelConfigForm.contextTokens);
    }

    // 如果是自定义模型且分组发生变化，更新 customModels
    const isCustomModel =
      providerModels.find((m) => m.name === modelName)?.provider
        ?.providerType === "custom";
    if (isCustomModel) {
      accessStore.update((access) => {
        const currentCustomModels = access.customModels || "";
        const existingModels = currentCustomModels
          .split(",")
          .filter((m) => m.trim().length > 0);

        const modelWithProvider = `${modelName}@${provider}`;

        // 找到并更新现有模型
        const updatedModels = existingModels.map((m) => {
          const cleanModel =
            m.startsWith("+") || m.startsWith("-") ? m.slice(1) : m;
          const [existingModelWithProvider] = cleanModel.split("=");

          if (existingModelWithProvider === modelWithProvider) {
            // 更新分组
            return newCategory
              ? `${modelWithProvider}=${newCategory}`
              : modelWithProvider;
          }
          return m;
        });

        access.customModels = updatedModels.join(",");
      });
    }

    // 关闭配置面板
    setShowModelConfig(null);
    showToast("模型配置已保存");
  };

  // 测试模型连通性
  const testModel = async (modelName: string) => {
    const modelKey = `${modelName}@${provider}`;

    // 设置测试状态为进行中
    setModelTestResults((prev) => ({
      ...prev,
      [modelKey]: { status: "testing" },
    }));

    try {
      const startTime = Date.now();

      // 创建测试用的API客户端
      const { getClientApi } = await import("../client/api");
      const api = getClientApi((provider || "OpenAI") as any);

      // 使用Promise来正确处理异步结果，添加超时机制
      const testResult = await new Promise<{
        success: boolean;
        error?: any;
        response?: Response;
      }>((resolve) => {
        let isResolved = false;

        // 设置30秒超时
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            resolve({ success: false, error: "Request timeout (30s)" });
          }
        }, 30000);

        // 发送测试消息 - 使用更标准的测试消息
        const testMessage = "Hello";

        api.llm.chat({
          messages: [{ role: "user", content: testMessage }],
          config: {
            model: modelName,
            stream: false,
            providerName: provider,
            temperature: 0.5,
          },
          onFinish: (message: string, response?: Response) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);

              // 检查响应状态
              if (response?.status && response.status >= 400) {
                resolve({
                  success: false,
                  error: `HTTP ${response.status}: ${
                    response.statusText || "Request failed"
                  }`,
                  response,
                });
              } else if (message && message.trim().length > 0) {
                resolve({ success: true, response });
              } else {
                resolve({ success: false, error: "Empty response received" });
              }
            }
          },
          onError: (error: any) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              resolve({ success: false, error });
            }
          },
        });
      });

      const responseTime = Date.now() - startTime;

      if (testResult.success) {
        // 测试成功
        setModelTestResults((prev) => ({
          ...prev,
          [modelKey]: {
            status: "success",
            responseTime,
          },
        }));
      } else {
        // 测试失败
        throw testResult;
      }
    } catch (error: any) {
      // 测试失败
      const errorMessage =
        error?.error?.message ||
        error?.error?.toString() ||
        error?.message ||
        error?.toString() ||
        "未知错误";

      setModelTestResults((prev) => ({
        ...prev,
        [modelKey]: {
          status: "error",
          error: errorMessage,
        },
      }));
    }
  };

  // 删除自定义模型
  const deleteCustomModel = (modelName: string) => {
    if (!confirm(`确定要删除模型 "${modelName}" 吗？`)) {
      return;
    }

    accessStore.update((access) => {
      const currentCustomModels = access.customModels || "";
      const existingModels = currentCustomModels
        .split(",")
        .filter((m) => m.trim().length > 0);

      // 构建要删除的模型标识
      const modelWithProvider = `${modelName}@${provider}`;

      // 过滤掉要删除的模型
      const updatedModels = existingModels.filter((m) => {
        const cleanModel =
          m.startsWith("+") || m.startsWith("-") ? m.slice(1) : m;
        const [existingModelWithProvider] = cleanModel.split("=");
        return existingModelWithProvider !== modelWithProvider;
      });

      access.customModels = updatedModels.join(",");

      // 同时从启用列表中移除
      if (access.enabledModels?.[provider]) {
        const enabledIndex = access.enabledModels[provider].indexOf(modelName);
        if (enabledIndex > -1) {
          access.enabledModels[provider].splice(enabledIndex, 1);
        }
      }
    });

    // 关闭配置面板
    setShowModelConfig(null);
  };

  // 能力分类标签（移除免费和重排）
  const categories = ["全部", "推理", "视觉", "工具"];

  return (
    <CustomModal
      title={`${getProviderDisplayName()} 模型管理`}
      onClose={handleClose}
    >
      <div className={styles["model-manager"]}>
        {/* 搜索框和控制按钮 */}
        <div className={styles["search-section"]}>
          <input
            type="text"
            placeholder="搜索模型 ID 或名称"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles["search-input"]}
          />
          <div className={styles["control-buttons"]}>
            {/* 从API获取模型开关 */}
            <div className={styles["api-fetch-toggle"]}>
              <label className={styles["toggle-label"]}>
                <input
                  type="checkbox"
                  checked={fetchFromAPIEnabled}
                  onChange={(e) => handleToggleAPIFetch(e.target.checked)}
                  className={styles["toggle-checkbox"]}
                />
                <span className={styles["toggle-text"]}>从API获取可用模型</span>
              </label>
              {/* 刷新按钮 */}
              {fetchFromAPIEnabled && (
                <button
                  className={styles["refresh-button"]}
                  onClick={fetchModelsFromAPI}
                  disabled={isLoadingAPIModels}
                  title="刷新模型列表"
                >
                  {isLoadingAPIModels ? <LoadingIcon /> : "🔄"}
                </button>
              )}
            </div>
            <button
              className={styles["add-custom-button"]}
              onClick={() => setShowAddCustomModel(true)}
              title="添加自定义模型"
            >
              添加自定义模型
            </button>
          </div>
        </div>

        {/* 添加自定义模型表单 */}
        {showAddCustomModel && (
          <div className={styles["custom-model-form"]}>
            <div className={styles["form-header"]}>
              <h4>添加自定义模型</h4>
              <button
                className={styles["form-close"]}
                onClick={() => {
                  setShowAddCustomModel(false);
                  setCustomModelForm({ modelId: "", category: "" });
                }}
              >
                <CloseIcon />
              </button>
            </div>
            <div className={styles["form-content"]}>
              <div className={styles["form-field"]}>
                <label>模型 ID *</label>
                <input
                  type="text"
                  placeholder="例如: gpt-4-custom"
                  value={customModelForm.modelId}
                  onChange={(e) =>
                    setCustomModelForm((prev) => ({
                      ...prev,
                      modelId: e.target.value,
                    }))
                  }
                  className={styles["form-input"]}
                />
              </div>
              <div className={styles["form-field"]}>
                <label>分组 (可选)</label>
                <input
                  type="text"
                  placeholder="例如: 我的项目"
                  value={customModelForm.category}
                  onChange={(e) =>
                    setCustomModelForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className={styles["form-input"]}
                />
                <div className={styles["form-hint"]}>
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  不填写分组时，自定义模型将归入"自定义模型"分组；填写分组可创建自定义分类
                </div>
              </div>
              <div className={styles["form-actions"]}>
                <button
                  className={styles["form-cancel"]}
                  onClick={() => {
                    setShowAddCustomModel(false);
                    setCustomModelForm({ modelId: "", category: "" });
                  }}
                >
                  取消
                </button>
                <button
                  className={styles["form-submit"]}
                  onClick={addCustomModel}
                >
                  添加模型
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 分类标签 */}
        <div className={styles["category-tabs"]}>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles["category-tab"]} ${
                selectedCategory === category ? styles["active"] : ""
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 模型列表 */}
        <div className={styles["model-list"]}>
          {isLoadingAPIModels ? (
            <div className={styles["loading-container"]}>
              <div className={styles["loading-spinner"]}></div>
              <div className={styles["loading-text"]}>正在获取可用模型...</div>
            </div>
          ) : (
            /* 始终按模型名称分组显示，自定义模型分组放在最前面 */
            (() => {
              // 获取所有分组并按自定义模型优先排序
              const entries = Object.entries(filteredCategorizedModels);
              const sortedEntries = entries.sort(([categoryA], [categoryB]) => {
                // 自定义模型分组始终在最前面
                if (categoryA === "自定义模型") return -1;
                if (categoryB === "自定义模型") return 1;
                // 其他分组按字母顺序排序
                return categoryA.localeCompare(categoryB);
              });

              return sortedEntries.map(([category, models]) => {
                if (models.length === 0) return null;

                return (
                  <div key={category} className={styles["category-section"]}>
                    <div className={styles["category-header"]}>
                      <h3>{category}</h3>
                    </div>
                    <div className={styles["model-items"]}>
                      {models.map((model) => (
                        <div key={model.name} className={styles["model-item"]}>
                          <div className={styles["model-info"]}>
                            <div className={styles["model-icon"]}>
                              <ModelProviderIcon
                                provider={provider}
                                size={28}
                                modelName={model.name}
                              />
                            </div>
                            <div className={styles["model-details"]}>
                              <div className={styles["model-name"]}>
                                {model.displayName || model.name}
                                <ModelCapabilityIcons
                                  capabilities={getModelCapabilities(
                                    model.name,
                                  )}
                                  size={14}
                                  colorful={true}
                                />
                              </div>
                              <div className={styles["model-id"]}>
                                {model.name}
                                {(() => {
                                  const contextConfig = getModelContextTokens(
                                    model.name,
                                  );
                                  if (contextConfig) {
                                    return (
                                      <span
                                        className={
                                          styles["model-context-tokens"]
                                        }
                                      >
                                        {" • "}
                                        {formatTokenCount(
                                          contextConfig.contextTokens,
                                        )}{" "}
                                        tokens
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className={styles["model-actions"]}>
                            {/* 测试结果显示 */}
                            {(() => {
                              const modelKey = `${model.name}@${provider}`;
                              const testResult = modelTestResults[modelKey];

                              if (
                                testResult?.status === "success" &&
                                testResult.responseTime
                              ) {
                                return (
                                  <span className={styles["response-time"]}>
                                    {testResult.responseTime}ms
                                  </span>
                                );
                              }

                              if (
                                testResult?.status === "error" &&
                                testResult.error
                              ) {
                                // 提取错误代码和生成友好提示
                                const errorStr = testResult.error.toString();
                                let errorCode = "ERROR";
                                let friendlyMessage =
                                  "测试失败，请查看控制台获取详细错误信息";

                                if (
                                  errorStr.includes("401") ||
                                  errorStr.includes("Unauthorized")
                                ) {
                                  errorCode = "401";
                                  friendlyMessage =
                                    "认证失败，请检查API密钥配置";
                                } else if (
                                  errorStr.includes("403") ||
                                  errorStr.includes("Forbidden")
                                ) {
                                  errorCode = "403";
                                  friendlyMessage =
                                    "API密钥权限不足或模型访问受限";
                                } else if (
                                  errorStr.includes("404") ||
                                  errorStr.includes("Not Found")
                                ) {
                                  errorCode = "404";
                                  friendlyMessage = "模型不存在或API端点错误";
                                } else if (
                                  errorStr.includes("429") ||
                                  errorStr.includes("Rate limit")
                                ) {
                                  errorCode = "429";
                                  friendlyMessage = "请求频率过高，请稍后重试";
                                } else if (
                                  errorStr.includes("500") ||
                                  errorStr.includes("Internal Server Error")
                                ) {
                                  errorCode = "500";
                                  friendlyMessage =
                                    "服务器内部错误，请稍后重试";
                                } else if (errorStr.includes("timeout")) {
                                  errorCode = "TIMEOUT";
                                  friendlyMessage = "请求超时，请检查网络连接";
                                } else {
                                  // 尝试提取HTTP状态码
                                  const httpCode =
                                    errorStr.match(/\b[4-5]\d{2}\b/)?.[0];
                                  if (httpCode) {
                                    errorCode = httpCode;
                                  }
                                }

                                return (
                                  <div className={styles["error-display"]}>
                                    <span
                                      className={styles["error-info"]}
                                      title={`${friendlyMessage}\n\n完整错误: ${testResult.error}\n\n💡 按F12打开控制台查看详细信息`}
                                    >
                                      {errorCode}
                                    </span>
                                    <span className={styles["console-tip"]}>
                                      查看控制台获取详细报错
                                    </span>
                                  </div>
                                );
                              }

                              return null;
                            })()}

                            <button
                              className={`${styles["test-button"]} ${(() => {
                                const modelKey = `${model.name}@${provider}`;
                                const testResult = modelTestResults[modelKey];
                                if (testResult?.status === "testing")
                                  return styles["testing"];
                                if (testResult?.status === "success")
                                  return styles["success"];
                                if (testResult?.status === "error")
                                  return styles["error"];
                                return "";
                              })()}`}
                              onClick={() => testModel(model.name)}
                              title="测试模型连通性"
                              disabled={
                                modelTestResults[`${model.name}@${provider}`]
                                  ?.status === "testing"
                              }
                            >
                              {modelTestResults[`${model.name}@${provider}`]
                                ?.status === "testing" ? (
                                <LoadingIcon />
                              ) : (
                                "测试"
                              )}
                            </button>

                            <button
                              className={styles["manage-button"]}
                              onClick={() => openModelConfig(model)}
                              title="模型配置"
                            >
                              <ConfigIcon />
                            </button>
                            <button
                              className={`${styles["toggle-button"]} ${
                                enabledModels.includes(model.name)
                                  ? styles["enabled"]
                                  : ""
                              }`}
                              onClick={() => toggleModel(model.name)}
                            >
                              {enabledModels.includes(model.name) ? "−" : "+"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>

        {Object.keys(filteredCategorizedModels).length === 0 && (
          <div className={styles["empty-state"]}>
            <p>未找到匹配的模型</p>
          </div>
        )}

        {/* 模型配置弹窗 - 使用可复用组件 */}
        {showModelConfig && (
          <ModelConfigModal
            modelName={modelConfigForm.modelId}
            provider={provider}
            category={modelConfigForm.category}
            showCategory={true}
            showDelete={
              providerModels.find((m) => m.name === modelConfigForm.modelId)
                ?.provider?.providerType === "custom"
            }
            onSave={(config) => {
              const modelName = modelConfigForm.modelId;

              // 保存能力配置到本地存储
              const capabilitiesKey = `model_capabilities_${modelName}`;
              localStorage.setItem(
                capabilitiesKey,
                JSON.stringify(config.capabilities),
              );

              // 保存上下文Token数配置
              if (config.contextTokens !== undefined) {
                saveCustomContextTokens(modelName, config.contextTokens);
              }

              // 保存流式配置
              if (config.stream !== undefined) {
                saveModelStreamConfig(modelName, config.stream);
              }

              // 如果是自定义模型且分组发生变化，更新 customModels
              const isCustomModel =
                providerModels.find((m) => m.name === modelName)?.provider
                  ?.providerType === "custom";
              if (isCustomModel && config.category !== undefined) {
                const newCategory = config.category.trim();
                accessStore.update((access) => {
                  const currentCustomModels = access.customModels || "";
                  const existingModels = currentCustomModels
                    .split(",")
                    .filter((m) => m.trim().length > 0);

                  const modelWithProvider = `${modelName}@${provider}`;

                  // 找到并更新现有模型
                  const updatedModels = existingModels.map((m) => {
                    const cleanModel =
                      m.startsWith("+") || m.startsWith("-") ? m.slice(1) : m;
                    const [existingModelWithProvider] = cleanModel.split("=");

                    if (existingModelWithProvider === modelWithProvider) {
                      // 更新分组
                      return newCategory
                        ? `${modelWithProvider}=${newCategory}`
                        : modelWithProvider;
                    }
                    return m;
                  });

                  access.customModels = updatedModels.join(",");
                });
              }

              setShowModelConfig(null);
            }}
            onDelete={() => {
              deleteCustomModel(modelConfigForm.modelId);
            }}
            onClose={() => setShowModelConfig(null)}
          />
        )}
      </div>
    </CustomModal>
  );
}
