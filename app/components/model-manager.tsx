import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ServiceProvider, DEFAULT_MODELS } from "../constant";
import { useAccessStore } from "../store/access";
import { LLMModel } from "../client/api";
import { ModelFetcher } from "../client/model-fetcher";
import { showToast } from "./ui-lib";
import styles from "./model-manager.module.scss";

import CloseIcon from "../icons/close.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ConfigIcon from "../icons/config.svg";
import DeleteIcon from "../icons/delete.svg";
import LoadingIcon from "../icons/three-dots.svg";
import { ModelProviderIcon } from "./provider-icon";
import { ModelCapabilityIcons } from "./model-capability-icons";
import {
  getEnhancedModelCapabilities,
  getModelCapabilitiesWithCustomConfig,
} from "../config/model-capabilities";
import { collectModels } from "../utils/model";

interface ModelManagerProps {
  provider: ServiceProvider | string; // 支持自定义服务商ID
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
    web: boolean;
    reasoning: boolean;
    tools: boolean;
  };
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
  "GPT-4o": ["gpt-4o"],
  "GPT-4.5": ["gpt-4.5"],
  "GPT-4.1": ["gpt-4.1"],
  "GPT-4": ["gpt-4", "gpt-4-turbo"],
  "GPT-3.5": ["gpt-3.5-turbo"],
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
  "Doubao 1.5": ["doubao-1-5"],
  "Doubao Pro": ["doubao-pro"],
  "Doubao Lite": ["doubao-lite"],
  "Doubao Vision": ["doubao-vision"],
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
  嵌入模型: ["embedding", "embed"],
  其他: [],
};

// 基于能力的模型过滤器
const CAPABILITY_FILTERS: Record<string, (model: any) => boolean> = {
  推理: (model: any) => {
    const capabilities = getModelCapabilitiesWithCustomConfig(model.name);
    return capabilities.reasoning === true;
  },
  视觉: (model: any) => {
    const capabilities = getModelCapabilitiesWithCustomConfig(model.name);
    return capabilities.vision === true;
  },
  联网: (model: any) => {
    const capabilities = getModelCapabilitiesWithCustomConfig(model.name);
    return capabilities.web === true;
  },
  工具: (model: any) => {
    const capabilities = getModelCapabilitiesWithCustomConfig(model.name);
    return capabilities.tools === true;
  },
  嵌入: (model: any) => {
    const capabilities = getModelCapabilitiesWithCustomConfig(model.name);
    return capabilities.embedding === true;
  },
};

export function ModelManager({ provider, onClose }: ModelManagerProps) {
  const accessStore = useAccessStore();
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
      web: false,
      reasoning: false,
      tools: false,
    },
  });

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

  // 获取当前服务商的所有模型（包含自定义模型）
  const providerModels = useMemo(() => {
    // 如果有API模型数据，优先使用API模型
    if (apiModels.length > 0) {
      return apiModels;
    }
    if (isCustomProvider && customProviderConfig) {
      // 对于自定义服务商，根据其类型获取相应的模型
      const baseModels = DEFAULT_MODELS.filter((model) => {
        switch (customProviderConfig.type) {
          case "openai":
            return model.provider.providerName === ServiceProvider.OpenAI;
          case "google":
            return model.provider.providerName === ServiceProvider.Google;
          case "anthropic":
            return model.provider.providerName === ServiceProvider.Anthropic;
          default:
            return false;
        }
      });

      // 为自定义服务商创建模型副本，使用自定义服务商的ID
      return baseModels.map((model) => ({
        ...model,
        provider: {
          ...model.provider,
          id: provider as string,
          providerName: provider as string,
        },
      }));
    } else {
      // 内置服务商的原有逻辑
      const defaultModels = DEFAULT_MODELS.filter(
        (model) => model.provider.providerName === provider,
      );

      // 获取包含自定义模型的完整列表
      const allModels = collectModels(
        DEFAULT_MODELS,
        accessStore.customModels || "",
      );

      // 过滤出当前服务商的模型（包括自定义模型）
      const providerCustomModels = allModels.filter((model) => {
        if (!model.provider) return false;
        // 对于自定义模型，比较时忽略大小写
        return (
          model.provider.providerName.toLowerCase() ===
          (provider as string).toLowerCase()
        );
      });

      // 合并默认模型和自定义模型，去重
      const modelMap = new Map();
      [...defaultModels, ...providerCustomModels].forEach((model) => {
        const key = `${model.name}@${model.provider?.id}`;
        if (!modelMap.has(key)) {
          modelMap.set(key, model);
        }
      });

      return Array.from(modelMap.values());
    }
  }, [
    provider,
    accessStore.customModels,
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
        store.setApiModelsCache(provider, result.models);
        store.setModelsFetchStatus(provider, "success");
        showToast("模型列表获取成功");
      } else {
        throw new Error(result.error || "获取模型失败");
      }
    } catch (error) {
      console.error("[ModelManager] 获取API模型失败:", error);
      store.setModelsFetchStatus(provider, "error");
      showToast(
        `获取模型失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      // 获取失败时回退到内置模型
      store.setFetchModelsFromAPI(provider, false);
    } finally {
      setIsLoadingAPIModels(false);
    }
  }, [provider]);

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

  // 初始化时检查是否需要从API获取模型
  useEffect(() => {
    const store = useAccessStore.getState();
    const shouldFetchFromAPI = store.fetchModelsFromAPI?.[provider] ?? true;

    if (shouldFetchFromAPI) {
      // 检查是否有缓存
      const cachedModels = store.apiModelsCache?.[provider];
      if (cachedModels && cachedModels.length > 0) {
        setApiModels(cachedModels);
        // 不在useEffect中直接调用store方法，避免无限循环
      } else {
        // 没有缓存时获取模型
        fetchModelsFromAPI();
      }
    } else {
      // 如果关闭了API获取，清空API模型
      setApiModels([]);
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

      // 检查是否是自定义模型，如果有自定义分组则使用自定义分组
      if (model.displayName && model.displayName !== model.name) {
        // 这是一个有自定义显示名称的模型，可能是自定义分组
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
          if (category === "其他") continue;

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

    // 按搜索词过滤分类模型
    if (searchTerm) {
      const filtered: Record<string, LLMModel[]> = {};
      Object.entries(categorizedModels).forEach(([category, models]) => {
        const filteredCategoryModels = models.filter((model) =>
          model.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );
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
        access.enabledModels = {} as Record<ServiceProvider, string[]>;
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
    // 对于自定义服务商，使用其类型作为provider
    const providerForModel =
      isCustomProvider && customProviderConfig
        ? customProviderConfig.type
        : provider;
    const modelWithProvider = `${modelId}@${providerForModel}`;

    // 构建自定义模型字符串
    let customModelString = modelWithProvider;
    if (category) {
      customModelString = `${modelWithProvider}=${category}`;
    }

    accessStore.update((access) => {
      const currentCustomModels = access.customModels || "";
      const existingModels = currentCustomModels
        .split(",")
        .filter((m) => m.trim().length > 0);

      // 检查是否已存在（检查完整的 modelId@provider 格式）
      const modelExists = existingModels.some((m) => {
        const cleanModel =
          m.startsWith("+") || m.startsWith("-") ? m.slice(1) : m;
        const [existingModelWithProvider] = cleanModel.split("=");
        return existingModelWithProvider === modelWithProvider;
      });

      if (modelExists) {
        alert("该模型已存在");
        return;
      }

      // 添加新模型
      const newCustomModels = [...existingModels, customModelString].join(",");
      access.customModels = newCustomModels;
    });

    // 重置表单并关闭
    setCustomModelForm({ modelId: "", category: "" });
    setShowAddCustomModel(false);
  };

  // 获取模型能力（包含自定义配置）
  const getLocalModelCapabilities = getModelCapabilitiesWithCustomConfig;

  // 打开模型配置
  const openModelConfig = (model: any) => {
    const currentCapabilities = getLocalModelCapabilities(model.name);

    // 获取当前分组信息
    let currentCategory = "";
    if (model.displayName && model.displayName !== model.name) {
      currentCategory = model.displayName;
    }

    setModelConfigForm({
      modelId: model.name,
      category: currentCategory || "",
      capabilities: {
        vision: currentCapabilities.vision || false,
        web: currentCapabilities.web || false,
        reasoning: currentCapabilities.reasoning || false,
        tools: currentCapabilities.tools || false,
      },
    });
    setShowModelConfig(model.name);
  };

  // 保存模型配置
  const saveModelConfig = () => {
    const modelName = modelConfigForm.modelId;
    const newCategory = (modelConfigForm.category || "").trim();

    // 保存能力配置到本地存储
    const capabilitiesKey = `model_capabilities_${modelName}`;
    localStorage.setItem(
      capabilitiesKey,
      JSON.stringify(modelConfigForm.capabilities),
    );

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
      const api = getClientApi(provider as any);

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
  const categories = ["全部", "推理", "视觉", "联网", "嵌入", "工具"];

  // 获取显示名称
  const getProviderDisplayName = () => {
    if (isCustomProvider && customProviderConfig) {
      return customProviderConfig.name;
    }
    return provider as string;
  };

  return (
    <CustomModal
      title={`${getProviderDisplayName()} 模型管理`}
      onClose={onClose}
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
                  placeholder="例如: 自定义模型"
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
                  不填写分组时，模型将根据名称自动分类
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
            /* 始终按模型名称分组显示 */
            Object.entries(filteredCategorizedModels).map(
              ([category, models]) => {
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
                                size={20}
                                modelName={model.name}
                              />
                            </div>
                            <div className={styles["model-details"]}>
                              <div className={styles["model-name"]}>
                                {model.name}
                                <ModelCapabilityIcons
                                  capabilities={getModelCapabilitiesWithCustomConfig(
                                    model.name,
                                  )}
                                  size={14}
                                  colorful={true}
                                />
                              </div>
                              <div className={styles["model-id"]}>
                                {model.name}
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
              },
            )
          )}
        </div>

        {Object.keys(filteredCategorizedModels).length === 0 && (
          <div className={styles["empty-state"]}>
            <p>未找到匹配的模型</p>
          </div>
        )}

        {/* 模型配置弹窗 */}
        {showModelConfig && (
          <div className={styles["model-config-modal"]}>
            <div className={styles["config-modal-content"]}>
              <div className={styles["config-header"]}>
                <h4>模型配置 - {modelConfigForm.modelId}</h4>
                <button
                  className={styles["config-close"]}
                  onClick={() => setShowModelConfig(null)}
                >
                  <CloseIcon />
                </button>
              </div>

              <div className={styles["config-content"]}>
                {/* 基本信息 */}
                <div className={styles["config-section"]}>
                  <h5>基本信息</h5>
                  <div className={styles["config-field"]}>
                    <label>模型 ID</label>
                    <input
                      type="text"
                      value={modelConfigForm.modelId}
                      onChange={(e) =>
                        setModelConfigForm((prev) => ({
                          ...prev,
                          modelId: e.target.value,
                        }))
                      }
                      className={styles["config-input"]}
                      disabled
                    />
                  </div>
                  <div className={styles["config-field"]}>
                    <label>分组 (可选)</label>
                    <input
                      type="text"
                      placeholder="例如: 自定义模型"
                      value={modelConfigForm.category}
                      onChange={(e) =>
                        setModelConfigForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className={styles["config-input"]}
                    />
                  </div>
                </div>

                {/* 模型能力 */}
                <div className={styles["config-section"]}>
                  <h5>模型能力</h5>
                  <div className={styles["capabilities-grid"]}>
                    <div
                      className={styles["capability-item"]}
                      onClick={() =>
                        setModelConfigForm((prev) => ({
                          ...prev,
                          capabilities: {
                            ...prev.capabilities,
                            vision: !prev.capabilities.vision,
                          },
                        }))
                      }
                    >
                      <div
                        className={`${styles["capability-dot"]} ${
                          modelConfigForm.capabilities.vision
                            ? styles["active"]
                            : ""
                        }`}
                      />
                      <span className={styles["capability-text"]}>
                        <span className={styles["capability-icon"]}>👁️</span>
                        视觉
                      </span>
                    </div>

                    <div
                      className={styles["capability-item"]}
                      onClick={() =>
                        setModelConfigForm((prev) => ({
                          ...prev,
                          capabilities: {
                            ...prev.capabilities,
                            web: !prev.capabilities.web,
                          },
                        }))
                      }
                    >
                      <div
                        className={`${styles["capability-dot"]} ${
                          modelConfigForm.capabilities.web
                            ? styles["active"]
                            : ""
                        }`}
                      />
                      <span className={styles["capability-text"]}>
                        <span className={styles["capability-icon"]}>🌐</span>
                        联网
                      </span>
                    </div>

                    <div
                      className={styles["capability-item"]}
                      onClick={() =>
                        setModelConfigForm((prev) => ({
                          ...prev,
                          capabilities: {
                            ...prev.capabilities,
                            reasoning: !prev.capabilities.reasoning,
                          },
                        }))
                      }
                    >
                      <div
                        className={`${styles["capability-dot"]} ${
                          modelConfigForm.capabilities.reasoning
                            ? styles["active"]
                            : ""
                        }`}
                      />
                      <span className={styles["capability-text"]}>
                        <span className={styles["capability-icon"]}>🧠</span>
                        推理
                      </span>
                    </div>

                    <div
                      className={styles["capability-item"]}
                      onClick={() =>
                        setModelConfigForm((prev) => ({
                          ...prev,
                          capabilities: {
                            ...prev.capabilities,
                            tools: !prev.capabilities.tools,
                          },
                        }))
                      }
                    >
                      <div
                        className={`${styles["capability-dot"]} ${
                          modelConfigForm.capabilities.tools
                            ? styles["active"]
                            : ""
                        }`}
                      />
                      <span className={styles["capability-text"]}>
                        <span className={styles["capability-icon"]}>🔧</span>
                        工具
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles["config-actions"]}>
                {/* 检查是否是自定义模型，显示删除按钮 */}
                {providerModels.find((m) => m.name === modelConfigForm.modelId)
                  ?.provider?.providerType === "custom" && (
                  <button
                    className={styles["config-delete"]}
                    onClick={() => deleteCustomModel(modelConfigForm.modelId)}
                  >
                    <DeleteIcon />
                    删除模型
                  </button>
                )}
                <div className={styles["config-buttons"]}>
                  <button
                    className={styles["config-cancel"]}
                    onClick={() => setShowModelConfig(null)}
                  >
                    取消
                  </button>
                  <button
                    className={styles["config-save"]}
                    onClick={saveModelConfig}
                  >
                    保存配置
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
}
