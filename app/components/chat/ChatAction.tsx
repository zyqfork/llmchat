import React, { useState } from "react";
import clsx from "clsx";
import styles from "../chat.module.scss";

export function ChatAction(props: {
  text: string;
  icon: JSX.Element;
  onClick: () => void;
  dataAttribute?: string;
  active?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={styles["chat-action-wrapper"]}>
      <button
        className={clsx(
          styles["chat-input-action"],
          "clickable",
          props.active && styles["chat-input-action-active"],
        )}
        onClick={props.onClick}
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        {...(props.dataAttribute && { [props.dataAttribute]: true })}
      >
        <div className={styles["icon"]}>{props.icon}</div>
      </button>
      {showTooltip && (
        <div className={styles["chat-action-tooltip"]}>{props.text}</div>
      )}
    </div>
  );
}
