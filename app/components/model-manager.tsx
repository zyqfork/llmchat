import React, { useState, useMemo, useEffect } from "react";
import { ServiceProvider, DEFAULT_MODELS } from "../constant";
import { useAccessStore } from "../store/access";
import { LLMModel } from "../client/api";
import styles from "./model-manager.module.scss";

import CloseIcon from "../icons/close.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ConfigIcon from "../icons/config.svg";
import DeleteIcon from "../icons/delete.svg";
import { ModelProviderIcon } from "./provider-icon";
import { ModelCapabilityIcons } from "./model-capability-icons";
import { getModelCapabilities } from "../config/model-capabilities";
import { collectModels } from "../utils/model";

interface ModelManagerProps {
  provider: ServiceProvider;
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

// 模型分类映射
const MODEL_CATEGORIES: Record<string, string[]> = {
  "GPT-4": ["gpt-4", "gpt-4-turbo", "gpt-4o"],
  "GPT-3.5": ["gpt-3.5-turbo"],
  O1: ["o1-preview", "o1-mini", "o4-mini"],
  "Gemini 1.5": ["gemini-1.5-pro", "gemini-1.5-flash"],
  "Gemini 2.0": ["gemini-2.0-flash"],
  "Claude 3": ["claude-3-sonnet", "claude-3-opus", "claude-3-haiku"],
  "Claude 3.5": ["claude-3-5-sonnet", "claude-3-5-haiku"],
  "Claude 4": ["claude-opus-4"],
  豆包: ["Doubao-lite", "Doubao-pro"],
  通义千问: ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-vl"],
  月之暗面: ["moonshot-v1"],
  DeepSeek: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
  Grok: ["grok-beta", "grok-2", "grok-vision", "grok-3"],
  其他: [],
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

  // 获取当前服务商的所有模型（包含自定义模型）
  const providerModels = useMemo(() => {
    // 获取默认模型
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
        model.provider.providerName.toLowerCase() === provider.toLowerCase()
      );
    });

    console.log("[ModelManager] 模型数据:", {
      provider,
      customModels: accessStore.customModels,
      allModelsCount: allModels.length,
      defaultModelsCount: defaultModels.length,
      providerCustomModelsCount: providerCustomModels.length,
      providerCustomModels: providerCustomModels.map((m) => ({
        name: m.name,
        provider: m.provider?.providerName,
      })),
      // 显示所有自定义模型的详细信息
      allCustomModels: allModels
        .filter((m) => m.provider?.providerType === "custom")
        .map((m) => ({
          name: m.name,
          providerName: m.provider?.providerName,
          providerId: m.provider?.id,
          displayName: m.displayName,
        })),
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
  }, [provider, accessStore.customModels]);

  // 获取已启用的模型
  const enabledModels = accessStore.enabledModels?.[provider] || [];

  // 分类模型
  const categorizedModels = useMemo(() => {
    const categories: Record<string, LLMModel[]> = {};

    // 初始化分类
    Object.keys(MODEL_CATEGORIES).forEach((category) => {
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
        for (const [category, patterns] of Object.entries(MODEL_CATEGORIES)) {
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

  // 过滤模型
  const filteredModels = useMemo(() => {
    let models = providerModels;

    // 按分类过滤
    if (selectedCategory !== "全部") {
      models = categorizedModels[selectedCategory] || [];
    }

    // 按搜索词过滤
    if (searchTerm) {
      models = models.filter((model) =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return models;
  }, [providerModels, categorizedModels, selectedCategory, searchTerm]);

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
    const modelWithProvider = `${modelId}@${provider}`;

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

      console.log("[ModelManager] 添加自定义模型:", {
        modelId,
        provider,
        category,
        customModelString,
        newCustomModels,
      });
    });

    // 重置表单并关闭
    setCustomModelForm({ modelId: "", category: "" });
    setShowAddCustomModel(false);
  };

  // 获取模型能力（包含自定义配置）
  const getEnhancedModelCapabilities = (modelName: string) => {
    // 先获取默认能力
    const defaultCapabilities = getModelCapabilities(modelName);

    // 尝试从本地存储获取自定义配置
    const capabilitiesKey = `model_capabilities_${modelName}`;
    const customCapabilities = localStorage.getItem(capabilitiesKey);

    if (customCapabilities) {
      try {
        return JSON.parse(customCapabilities);
      } catch (e) {
        console.warn("[ModelManager] 解析自定义能力配置失败:", e);
      }
    }

    return defaultCapabilities;
  };

  // 打开模型配置
  const openModelConfig = (model: any) => {
    const currentCapabilities = getEnhancedModelCapabilities(model.name);

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

    console.log("[ModelManager] 保存模型配置:", {
      modelName,
      capabilities: modelConfigForm.capabilities,
      category: newCategory,
      isCustomModel,
    });

    // 关闭配置面板
    setShowModelConfig(null);
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

  // 获取分类列表
  const categories = ["全部", ...Object.keys(categorizedModels)];

  return (
    <CustomModal title={`${provider} 模型管理`} onClose={onClose}>
      <div className={styles["model-manager"]}>
        {/* 搜索框和添加按钮 */}
        <div className={styles["search-section"]}>
          <input
            type="text"
            placeholder="搜索模型 ID 或名称"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles["search-input"]}
          />
          <button
            className={styles["add-custom-button"]}
            onClick={() => setShowAddCustomModel(true)}
            title="添加自定义模型"
          >
            添加自定义模型
          </button>
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
                  不填写分组时，模型将显示在&ldquo;全部&rdquo;和&ldquo;其他&rdquo;分类中
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
          {selectedCategory !== "全部" ? (
            // 分类视图
            <div className={styles["category-section"]}>
              <div className={styles["category-header"]}>
                <h3>{selectedCategory}</h3>
              </div>
              <div className={styles["model-items"]}>
                {filteredModels.map((model) => (
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
                            capabilities={getEnhancedModelCapabilities(
                              model.name,
                            )}
                            size={14}
                            colorful={true}
                          />
                        </div>
                        <div className={styles["model-id"]}>{model.name}</div>
                      </div>
                    </div>
                    <div className={styles["model-actions"]}>
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
          ) : (
            // 全部视图 - 按分类分组
            Object.entries(categorizedModels).map(([category, models]) => {
              const categoryModels = models.filter(
                (model) =>
                  !searchTerm ||
                  model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (model.displayName &&
                    model.displayName
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())),
              );

              if (categoryModels.length === 0) return null;

              return (
                <div key={category} className={styles["category-section"]}>
                  <div className={styles["category-header"]}>
                    <h3>{category}</h3>
                  </div>
                  <div className={styles["model-items"]}>
                    {categoryModels.map((model) => (
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
                                capabilities={getEnhancedModelCapabilities(
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
            })
          )}
        </div>

        {filteredModels.length === 0 && (
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
