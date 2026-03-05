import React, { useEffect, useRef } from "react";
import { useChatStore } from "../../store";
import Locale from "../../locales";
import CloseIcon from "../../icons/close.svg";
import styles from "../chat.module.scss";

export function MultiModelPanel(props: {
  showPanel: boolean;
  onClose: () => void;
  onOpenSelector: () => void;
}) {
  const { showPanel, onClose, onOpenSelector } = props;
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedModels = session.multiModelMode?.selectedModels || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const multiModelButton = document.querySelector(
        "[data-multi-model-button]",
      );
      if (multiModelButton && multiModelButton.contains(target)) {
        return;
      }
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };

    if (showPanel) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPanel, onClose]);

  if (!showPanel) return null;

  return (
    <div ref={panelRef} className={styles["mcp-panel"]}>
      <div className={styles["mcp-panel-header"]}>
        <span className={styles["mcp-panel-title"]}>
          {Locale.Chat.MultiModel.Title}
        </span>
        <button className={styles["mcp-panel-close"]} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className={styles["mcp-panel-content"]}>
        <div className={styles["multi-model-description"]}>
          {Locale.Chat.MultiModel.Description}
        </div>

        <button
          className={styles["multi-model-select-button"]}
          onClick={onOpenSelector}
        >
          <span className={styles["multi-model-select-icon"]}>🎯</span>
          {Locale.Chat.MultiModel.OpenSelector}{" "}
          {Locale.Chat.MultiModel.AlreadySelected(selectedModels.length)}
        </button>

        <div className={styles["multi-model-tips"]}>
          {Locale.Chat.MultiModel.Tips}
        </div>
      </div>
    </div>
  );
}
