import React, { useEffect, useRef } from "react";
import Locale from "../../locales";
import CloseIcon from "../../icons/close.svg";
import styles from "../chat.module.scss";

export function ShortcutKeyPanel(props: {
  showPanel: boolean;
  onClose: () => void;
}) {
  const { showPanel, onClose } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const shortcuts = [
    {
      title: Locale.Chat.ShortcutKey.newChat,
      keys: isMac ? ["⌘", "Shift", "O"] : ["Ctrl", "Shift", "O"],
    },
    { title: Locale.Chat.ShortcutKey.focusInput, keys: ["Shift", "Esc"] },
    {
      title: Locale.Chat.ShortcutKey.copyLastCode,
      keys: isMac ? ["⌘", "Shift", ";"] : ["Ctrl", "Shift", ";"],
    },
    {
      title: Locale.Chat.ShortcutKey.copyLastMessage,
      keys: isMac ? ["⌘", "Shift", "C"] : ["Ctrl", "Shift", "C"],
    },
    {
      title: Locale.Chat.ShortcutKey.showShortcutKey,
      keys: isMac ? ["⌘", "/"] : ["Ctrl", "/"],
    },
    {
      title: Locale.Chat.ShortcutKey.clearContext,
      keys: isMac ? ["⌘", "Shift", "L"] : ["Ctrl", "Shift", "L"],
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const shortcutButton = document.querySelector("[data-shortcut-button]");
      if (shortcutButton && shortcutButton.contains(target)) {
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

  if (!showPanel) {
    return null;
  }

  return (
    <div ref={panelRef} className={styles["shortcut-panel"]}>
      <div className={styles["shortcut-panel-header"]}>
        <span className={styles["shortcut-panel-title"]}>
          {Locale.Chat.ShortcutKey.Title}
        </span>
        <button className={styles["shortcut-panel-close"]} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className={styles["shortcut-panel-content"]}>
        <div className={styles["shortcut-key-list"]}>
          {shortcuts.map((shortcut, index) => (
            <div key={index} className={styles["shortcut-key-item"]}>
              <div className={styles["shortcut-key-title"]}>
                {shortcut.title}
              </div>
              <div className={styles["shortcut-key-keys"]}>
                {shortcut.keys.map((key, i) => (
                  <div key={i} className={styles["shortcut-key"]}>
                    <span>{key}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
