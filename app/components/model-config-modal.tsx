import React, { useState, useEffect } from "react";
import { showToast } from "./ui-lib";
import styles from "./model-config-modal.module.scss";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import { getModelContextTokens } from "../config/model-context-tokens";
import { getModelCapabilitiesWithCustomConfig } from "../config/model-capabilities";

interface ModelConfigModalProps {
  modelName: string;
  provider?: string;
  category?: string;
  showCategory?: boolean;
  showDelete?: boolean;
  onSave: (config: {
    capabilities: {
      vision: boolean;
      web: boolean;
      reasoning: boolean;
      tools: boolean;
    };
    contextTokens?: number;
    category?: string;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ModelConfigModal({
  modelName,
  provider,
  category: initialCategory = "",
  showCategory = true,
  showDelete = false,
  onSave,
  onDelete,
  onClose,
}: ModelConfigModalProps) {
  const [capabilities, setCapabilities] = useState({
    vision: false,
    web: false,
    reasoning: false,
    tools: false,
  });
  const [contextTokens, setContextTokens] = useState<number | undefined>(
    undefined,
  );
  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    // 获取当前模型能力配置
    const currentCapabilities = getModelCapabilitiesWithCustomConfig(modelName);
    setCapabilities({
      vision: currentCapabilities.vision || false,
      web: currentCapabilities.web || false,
      reasoning: currentCapabilities.reasoning || false,
      tools: currentCapabilities.tools || false,
    });

    // 获取当前上下文Token数配置
    const currentContextConfig = getModelContextTokens(modelName);
    setContextTokens(currentContextConfig?.contextTokens);
  }, [modelName]);

  const handleSave = () => {
    onSave({
      capabilities,
      contextTokens,
      category: showCategory ? category : undefined,
    });
    showToast("模型配置已保存");
  };

  const handleCapabilityToggle = (capability: keyof typeof capabilities) => {
    setCapabilities((prev) => ({
      ...prev,
      [capability]: !prev[capability],
    }));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles["modal-mask"]} onClick={onClose}>
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-header"]}>
          <h4>模型配置 - {modelName}</h4>
          <button className={styles["modal-close"]} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className={styles["modal-body"]}>
          {/* 基本信息 */}
          <div className={styles["config-section"]}>
            <h5>基本信息</h5>
            <div className={styles["form-group"]}>
              <label>模型 ID</label>
              <input
                type="text"
                value={modelName}
                disabled
                className={styles["form-input"]}
              />
            </div>

            {showCategory && (
              <div className={styles["form-group"]}>
                <label>分组 (可选)</label>
                <input
                  type="text"
                  placeholder="例如: 自定义模型"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={styles["form-input"]}
                />
              </div>
            )}

            <div className={styles["form-group"]}>
              <label>上下文Token数</label>
              <input
                type="number"
                placeholder="例如: 128000"
                min="1024"
                max="10000000"
                value={contextTokens || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setContextTokens(value ? parseInt(value, 10) : undefined);
                }}
                className={styles["form-input"]}
              />
              <small className={styles["form-hint"]}>
                设置模型支持的最大上下文Token数量，留空使用默认值
              </small>
            </div>
          </div>

          {/* 模型能力 */}
          <div className={styles["config-section"]}>
            <h5>模型能力</h5>
            <div className={styles["capabilities-grid"]}>
              <div
                className={styles["capability-item"]}
                onClick={() => handleCapabilityToggle("vision")}
              >
                <div
                  className={`${styles["capability-dot"]} ${
                    capabilities.vision ? styles["active"] : ""
                  }`}
                />
                <span className={styles["capability-text"]}>
                  <span className={styles["capability-icon"]}>👁️</span>
                  视觉
                </span>
              </div>

              <div
                className={styles["capability-item"]}
                onClick={() => handleCapabilityToggle("web")}
              >
                <div
                  className={`${styles["capability-dot"]} ${
                    capabilities.web ? styles["active"] : ""
                  }`}
                />
                <span className={styles["capability-text"]}>
                  <span className={styles["capability-icon"]}>🌐</span>
                  联网
                </span>
              </div>

              <div
                className={styles["capability-item"]}
                onClick={() => handleCapabilityToggle("reasoning")}
              >
                <div
                  className={`${styles["capability-dot"]} ${
                    capabilities.reasoning ? styles["active"] : ""
                  }`}
                />
                <span className={styles["capability-text"]}>
                  <span className={styles["capability-icon"]}>🧠</span>
                  推理
                </span>
              </div>

              <div
                className={styles["capability-item"]}
                onClick={() => handleCapabilityToggle("tools")}
              >
                <div
                  className={`${styles["capability-dot"]} ${
                    capabilities.tools ? styles["active"] : ""
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

        <div className={styles["modal-footer"]}>
          {showDelete && onDelete && (
            <button
              className={styles["delete-button"]}
              onClick={() => {
                if (confirm(`确定要删除模型 "${modelName}" 吗？`)) {
                  onDelete();
                }
              }}
            >
              <DeleteIcon />
              删除模型
            </button>
          )}
          <div className={styles["action-buttons"]}>
            <button className={styles["cancel-button"]} onClick={onClose}>
              取消
            </button>
            <button className={styles["save-button"]} onClick={handleSave}>
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
