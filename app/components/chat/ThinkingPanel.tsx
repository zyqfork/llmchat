import React, { useEffect, useRef } from "react";
import { useChatStore } from "../../store";
import { getModelCapabilities } from "../../constant";
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
  const modelCapabilities = getModelCapabilities(currentModel);

  const getThinkingOptions = () => {
    const isClaudeType =
      modelCapabilities.reasoningField === "reasoning_content";

    if (isClaudeType) {
      return [
        {
          value: -1,
          label: Locale.Chat.Thinking.Dynamic,
          description: Locale.Chat.Thinking.ClaudeDynamicDesc,
        },
        {
          value: 0,
          label: Locale.Chat.Thinking.Off,
          description: Locale.Chat.Thinking.OffDesc,
        },
        {
          value: 5000,
          label: Locale.Chat.Thinking.ClaudeLight,
          description: Locale.Chat.Thinking.ClaudeLightDesc,
        },
        {
          value: 10000,
          label: Locale.Chat.Thinking.ClaudeMedium,
          description: Locale.Chat.Thinking.ClaudeMediumDesc,
        },
        {
          value: 20000,
          label: Locale.Chat.Thinking.ClaudeDeep,
          description: Locale.Chat.Thinking.ClaudeDeepDesc,
        },
        {
          value: 32000,
          label: Locale.Chat.Thinking.ClaudeVeryDeep,
          description: Locale.Chat.Thinking.ClaudeVeryDeepDesc,
        },
      ];
    } else {
      return [
        {
          value: -1,
          label: Locale.Chat.Thinking.Dynamic,
          description: Locale.Chat.Thinking.DynamicDesc,
        },
        {
          value: 0,
          label: Locale.Chat.Thinking.Off,
          description: Locale.Chat.Thinking.OffDesc,
        },
        {
          value: 1024,
          label: Locale.Chat.Thinking.Light,
          description: Locale.Chat.Thinking.LightDesc,
        },
        {
          value: 4096,
          label: Locale.Chat.Thinking.Medium,
          description: Locale.Chat.Thinking.MediumDesc,
        },
        {
          value: 8192,
          label: Locale.Chat.Thinking.Deep,
          description: Locale.Chat.Thinking.DeepDesc,
        },
        {
          value: 16384,
          label: Locale.Chat.Thinking.VeryDeep,
          description: Locale.Chat.Thinking.VeryDeepDesc,
        },
      ];
    }
  };

  const thinkingOptions = getThinkingOptions();

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
          {modelCapabilities.reasoningField === "reasoning_content"
            ? Locale.Chat.Thinking.ClaudeNotice
            : Locale.Chat.Thinking.GeminiNotice}
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
