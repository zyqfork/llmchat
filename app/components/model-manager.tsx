import React, { useState, useMemo, useEffect } from "react";
import { ServiceProvider, DEFAULT_MODELS } from "../constant";
import { useAccessStore } from "../store/access";
import { LLMModel } from "../client/api";
import styles from "./model-manager.module.scss";
import Locale from "../locales";
import CloseIcon from "../icons/close.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import { ModelProviderIcon } from "./provider-icon";

interface ModelManagerProps {
  provider: ServiceProvider;
  onClose: () => void;
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
              className={styles["custom-modal-action"]}
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <MinIcon /> : <MaxIcon />}
            </button>
            <button className={styles["custom-modal-action"]} onClick={onClose}>
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

  // 获取当前服务商的所有模型
  const providerModels = useMemo(() => {
    return DEFAULT_MODELS.filter(
      (model) => model.provider.providerName === provider,
    );
  }, [provider]);

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

  // 获取分类列表
  const categories = ["全部", ...Object.keys(categorizedModels)];

  return (
    <CustomModal title={`${provider} 模型管理`} onClose={onClose}>
      <div className={styles["model-manager"]}>
        {/* 搜索框 */}
        <div className={styles["search-section"]}>
          <input
            type="text"
            placeholder="搜索模型 ID 或名称"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles["search-input"]}
          />
        </div>

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
                        <div className={styles["model-name"]}>{model.name}</div>
                        <div className={styles["model-id"]}>{model.name}</div>
                      </div>
                    </div>
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
                            </div>
                            <div className={styles["model-id"]}>
                              {model.name}
                            </div>
                          </div>
                        </div>
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
      </div>
    </CustomModal>
  );
}
