import React, { useEffect, useRef } from "react";
import { useChatStore } from "../../store";
import { getModelThinkingOptions } from "../../config/model-config";
import Locale from "../../locales";
import CloseIcon from "../../icons/close.svg";
import styles from "../chat.module.scss";

export function ThinkingPanel(props: {
  showPanel: boolean;
  onClose: () => void;
}) {
  const { showPanel, onClose } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const chatStore = useChatStore();
  const session = chatStore.currentSession();

  const currentModel = session.mask.modelConfig.model;
  const currentProvider = session.mask.modelConfig.providerName;

  const labels = Locale.Chat.Thinking;
  const thinkingOptions = getModelThinkingOptions(
    currentModel,
    currentProvider,
  ).map((option) => {
    switch (option.level) {
      case "dynamic":
        return {
          ...option,
          label: labels.Dynamic,
          description: labels.DynamicDesc,
        };
      case "off":
        return { ...option, label: labels.Off, description: labels.OffDesc };
      case "minimal":
      case "low":
        return {
          ...option,
          label: labels.Light,
          description: labels.LightDesc,
        };
      case "medium":
        return {
          ...option,
          label: labels.Medium,
          description: labels.MediumDesc,
        };
      case "high":
        return {
          ...option,
          label: labels.Deep,
          description: labels.DeepDesc,
        };
      case "xhigh":
      case "max":
        return {
          ...option,
          label: labels.VeryDeep,
          description: labels.VeryDeepDesc,
        };
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const thinkingButton = document.querySelector("[data-thinking-button]");
      if (thinkingButton && thinkingButton.contains(target)) {
        return;
      }
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };

    if (showPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPanel, onClose]);

  if (!showPanel) {
    return null;
  }

  return (
    <div ref={panelRef} className={styles["shortcut-panel"]}>
      <div className={styles["shortcut-panel-header"]}>
        <span className={styles["shortcut-panel-title"]}>
          {Locale.Chat.Thinking.Title}
        </span>
        <button className={styles["shortcut-panel-close"]} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className={styles["shortcut-panel-content"]}>
        <div className={styles["thinking-notice"]}>
          {Locale.Chat.Thinking.Notice}
        </div>
        <div className={styles["shortcut-key-list"]}>
          {thinkingOptions.map((option, index) => (
            <div
              key={index}
              className={`${styles["shortcut-key-item"]} ${
                session.mask.modelConfig.thinkingBudget === option.value
                  ? styles["thinking-option-selected"]
                  : ""
              }`}
              onClick={() => {
                chatStore.updateTargetSession(session, (session) => {
                  session.mask.modelConfig.thinkingBudget = option.value;
                  // 思考深度是当前会话的显式配置。若继续同步全局配置，
                  // 下一次消息更新时会被全局默认值（通常为动态思考）覆盖。
                  session.mask.syncGlobalConfig = false;
                });
                onClose();
              }}
            >
              <div className={styles["shortcut-key-title"]}>
                <div>{option.label}</div>
                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                  {option.description}
                </div>
              </div>
              {session.mask.modelConfig.thinkingBudget === option.value && (
                <div className={styles["thinking-option-check"]}>✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
