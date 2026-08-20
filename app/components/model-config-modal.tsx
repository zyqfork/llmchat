import React, { useState, useEffect } from "react";
import { showToast } from "./ui-lib";
import styles from "./model-config-modal.module.scss";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import { getModelContextTokens } from "../config/model-config";
import { getModelCapabilities } from "../constant";
import {
  getModelStreamConfig,
  saveModelStreamConfig,
} from "../config/model-stream";
import { getModelThinkingOptions } from "../config/model-config";
import {
  getModelThinkingBudget,
  saveModelThinkingBudget,
} from "../config/model-thinking";
import Locale from "../locales";

interface ModelConfigModalProps {
  modelName: string;
  provider?: string;
  category?: string;
  showCategory?: boolean;
  showDelete?: boolean;
  onSave: (config: {
    capabilities: {
      vision: boolean;
      reasoning: boolean;
      tools: boolean;
    };
    contextTokens?: number;
    category?: string;
    stream?: boolean;
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
    reasoning: false,
    tools: false,
  });
  const [contextTokens, setContextTokens] = useState<number | undefined>(
    undefined,
  );
  const [category, setCategory] = useState(initialCategory);
  const [stream, setStream] = useState<boolean>(true);
  const [thinkingBudget, setThinkingBudget] = useState<number>(-1);
  const thinkingOptions = getModelThinkingOptions(modelName);

  useEffect(() => {
    // 获取当前模型能力配置
    const currentCapabilities = getModelCapabilities(modelName);
    setCapabilities({
      vision: currentCapabilities.vision || false,
      reasoning: currentCapabilities.reasoning || false,
      tools: currentCapabilities.tools || false,
    });

    // 获取当前上下文Token数配置
    const currentContextConfig = getModelContextTokens(modelName);
    setContextTokens(currentContextConfig?.contextTokens);

    // 获取当前流式配置
    const currentStreamConfig = getModelStreamConfig(modelName);
    setStream(currentStreamConfig);

    // 获取当前思考深度配置
    const currentThinkingBudget = getModelThinkingBudget(modelName);
    setThinkingBudget(currentThinkingBudget ?? -1);
  }, [modelName]);

  const handleSave = () => {
    // 保存流式配置
    saveModelStreamConfig(modelName, stream);

    // 保存思考深度配置
    saveModelThinkingBudget(modelName, thinkingBudget);

    const config = {
      capabilities,
      contextTokens,
      category: showCategory ? category : undefined,
      stream,
    };

    onSave(config);
    showToast("模型配置已保存");

    // 触发全局事件通知模型配置已更新
    window.dispatchEvent(
      new CustomEvent("modelConfigUpdated", {
        detail: { modelName, config },
      }),
    );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            <div className={styles["form-group"]}>
              <label>响应模式</label>
              <div className={styles["stream-toggle-container"]}>
                <div className={styles["stream-toggle-info"]}>
                  <span className={styles["stream-toggle-label"]}>
                    {stream ? "流式（实时响应）" : "非流式（完整响应）"}
                  </span>
                  <small className={styles["stream-toggle-desc"]}>
                    {stream ? "实时显示响应内容" : "等待完整响应后一次性显示"}
                  </small>
                </div>
                <label className={styles["stream-toggle"]}>
                  <input
                    type="checkbox"
                    checked={stream}
                    onChange={(e) => setStream(e.target.checked)}
                  />
                  <span className={styles["toggle-slider"]}></span>
                </label>
              </div>
              <small className={styles["form-hint"]}>
                切换响应模式：流式模式会实时显示响应内容，非流式模式会等待完整响应后一次性显示
              </small>
            </div>

            {thinkingOptions.length > 0 && (
              <div className={styles["form-group"]}>
                <label>{Locale.Settings.ThinkingDepth.Title}</label>
                <select
                  value={thinkingBudget}
                  onChange={(e) =>
                    setThinkingBudget(parseInt(e.target.value, 10))
                  }
                  className={styles["form-input"]}
                >
                  {thinkingOptions.map((option) => (
                    <option key={option.level} value={option.value}>
                      {option.level === "dynamic"
                        ? Locale.Chat.Thinking.Dynamic
                        : option.level === "off"
                          ? Locale.Chat.Thinking.Off
                          : option.level}
                    </option>
                  ))}
                </select>
                <small className={styles["form-hint"]}>
                  {Locale.Settings.ThinkingDepth.SubTitle}
                </small>
              </div>
            )}
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
