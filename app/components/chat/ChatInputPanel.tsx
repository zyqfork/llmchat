import React from "react";

import styles from "../chat.module.scss";
import { PromptHints, RenderPrompt } from "./PromptHints";
import { MCPPanel } from "./MCPPanel";
import { ShortcutKeyPanel } from "./ShortcutKeyPanel";
import { ThinkingPanel } from "./ThinkingPanel";
import { MultiModelPanel } from "./MultiModelPanel";
import { ChatActions } from "./ChatActions";
import { ChatInputBox } from "./ChatInputBox";

type ChatInputPanelProps = {
  promptHints: RenderPrompt[];
  setPromptHints: React.Dispatch<React.SetStateAction<RenderPrompt[]>>;
  onPromptSelect: (prompt: RenderPrompt) => void;
  showMcpPanel: boolean;
  setShowMcpPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showShortcutKeyPanel: boolean;
  setShowShortcutKeyPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showThinkingPanel: boolean;
  setShowThinkingPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showMultiModelPanel: boolean;
  setShowMultiModelPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showModelSelector: boolean;
  setShowModelSelector: React.Dispatch<React.SetStateAction<boolean>>;
  uploadImage: () => Promise<void>;
  setAttachImages: React.Dispatch<React.SetStateAction<string[]>>;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
  scrollToBottom: () => void;
  hitBottom: boolean;
  uploading: boolean;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  setShowShortcutKeyModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowChatSidePanel: React.Dispatch<React.SetStateAction<boolean>>;
  userInput: string;
  couldStop: boolean;
  setCouldStop: React.Dispatch<React.SetStateAction<boolean>>;
  optimizePrompt: () => Promise<void>;
  toggleMultiModelMode: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
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
  onSubmit: (value: string) => void;
  onSearch: (keyword: string) => void;
};

export function ChatInputPanel(props: ChatInputPanelProps) {
  const {
    promptHints,
    setPromptHints,
    onPromptSelect,
    showMcpPanel,
    setShowMcpPanel,
    showShortcutKeyPanel,
    setShowShortcutKeyPanel,
    showThinkingPanel,
    setShowThinkingPanel,
    showMultiModelPanel,
    setShowMultiModelPanel,
    showModelSelector,
    setShowModelSelector,
    uploadImage,
    setAttachImages,
    setUploading,
    scrollToBottom,
    hitBottom,
    uploading,
    setUserInput,
    setShowShortcutKeyModal,
    setShowChatSidePanel,
    userInput,
    couldStop,
    setCouldStop,
    optimizePrompt,
    toggleMultiModelMode,
    inputRef,
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
    onSubmit,
    onSearch,
  } = props;

  return (
    <div className={styles["chat-input-panel"]}>
      <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect} />

      <MCPPanel
        showPanel={showMcpPanel}
        onClose={() => setShowMcpPanel(false)}
      />

      <ShortcutKeyPanel
        showPanel={showShortcutKeyPanel}
        onClose={() => setShowShortcutKeyPanel(false)}
      />

      <ThinkingPanel
        showPanel={showThinkingPanel}
        onClose={() => setShowThinkingPanel(false)}
      />

      <MultiModelPanel
        showPanel={showMultiModelPanel}
        onClose={() => setShowMultiModelPanel(false)}
        onOpenSelector={() => {
          setShowMultiModelPanel(false);
          setShowModelSelector(true);
        }}
      />

      <ChatActions
        uploadImage={uploadImage}
        setAttachImages={setAttachImages}
        setUploading={setUploading}
        scrollToBottom={scrollToBottom}
        hitBottom={hitBottom}
        uploading={uploading}
        showPromptHints={() => {
          if (promptHints.length > 0) {
            setPromptHints([]);
            return;
          }
          inputRef.current?.focus();
          setUserInput("/");
          onSearch("");
        }}
        setShowShortcutKeyModal={setShowShortcutKeyModal}
        setUserInput={setUserInput}
        setShowChatSidePanel={setShowChatSidePanel}
        showMcpPanel={showMcpPanel}
        setShowMcpPanel={setShowMcpPanel}
        showShortcutKeyPanel={showShortcutKeyPanel}
        setShowShortcutKeyPanel={setShowShortcutKeyPanel}
        showThinkingPanel={showThinkingPanel}
        setShowThinkingPanel={setShowThinkingPanel}
        showMultiModelPanel={showMultiModelPanel}
        setShowMultiModelPanel={setShowMultiModelPanel}
        toggleMultiModelMode={toggleMultiModelMode}
        showModelSelector={showModelSelector}
        setShowModelSelector={setShowModelSelector}
        userInput={userInput}
        couldStop={couldStop}
        setCouldStop={setCouldStop}
        optimizePrompt={optimizePrompt}
      />

      <ChatInputBox
        inputRef={inputRef}
        userInput={userInput}
        submitKey={submitKey}
        inputRows={inputRows}
        autoFocus={autoFocus}
        fontSize={fontSize}
        fontFamily={fontFamily}
        attachImages={attachImages}
        onInput={onInput}
        onInputKeyDown={onInputKeyDown}
        onInputFocusOrClick={onInputFocusOrClick}
        onPaste={onPaste}
        setAttachImages={setAttachImages}
        onSubmit={onSubmit}
      />
    </div>
  );
}
