import React from "react";
import clsx from "clsx";

import SendWhiteIcon from "../../icons/send-white.svg";
import Locale from "../../locales";

import styles from "../chat.module.scss";
import { IconButton } from "../button";
import { DeleteImageButton } from "./DeleteImageButton";

type ChatInputBoxProps = {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  userInput: string;
  submitKey: string;
  inputRows: number;
  autoFocus: boolean;
  fontSize: number;
  fontFamily: string;
  attachImages: string[];
  onInput: (value: string) => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onInputFocusOrClick: () => void;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  setAttachImages: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: (value: string) => void;
};

export function ChatInputBox(props: ChatInputBoxProps) {
  const {
    inputRef,
    userInput,
    submitKey,
    inputRows,
    autoFocus,
    fontSize,
    fontFamily,
    attachImages,
    onInput,
    onInputKeyDown,
    onInputFocusOrClick,
    onPaste,
    setAttachImages,
    onSubmit,
  } = props;

  return (
    <label
      className={clsx(styles["chat-input-panel-inner"], {
        [styles["chat-input-panel-inner-attach"]]: attachImages.length !== 0,
      })}
      htmlFor="chat-input"
      data-desktop-drop-zone
    >
      <textarea
        id="chat-input"
        ref={inputRef}
        className={styles["chat-input"]}
        placeholder={Locale.Chat.Input(submitKey)}
        onInput={(e) => onInput(e.currentTarget.value)}
        value={userInput}
        onKeyDown={onInputKeyDown}
        onFocus={onInputFocusOrClick}
        onClick={onInputFocusOrClick}
        onPaste={onPaste}
        rows={inputRows}
        autoFocus={autoFocus}
        style={{
          fontSize,
          fontFamily,
        }}
      />
      {attachImages.length !== 0 && (
        <div className={styles["attach-images"]}>
          {attachImages.map((image, index) => {
            return (
              <div
                key={index}
                className={styles["attach-image"]}
                style={{ backgroundImage: `url("${image}")` }}
              >
                <div className={styles["attach-image-mask"]}>
                  <DeleteImageButton
                    deleteImage={() => {
                      setAttachImages(
                        attachImages.filter((_, i) => i !== index),
                      );
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <IconButton
        icon={<SendWhiteIcon />}
        text={Locale.Chat.Send}
        className={styles["chat-input-send"]}
        type="primary"
        onClick={() => onSubmit(userInput)}
      />
    </label>
  );
}
