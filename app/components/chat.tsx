import { useChatStore } from "../store";
import { ChatMain } from "./chat-main";

export function Chat() {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  return <ChatMain key={session.id}></ChatMain>;
}

export { ChatAction } from "./chat/ChatAction";
export { TokenCounter } from "./chat/TokenCounter";
export { EditMessageModal } from "./chat/EditMessageModal";
export { DeleteImageButton } from "./chat/DeleteImageButton";
export { ShortcutKeyModal } from "./chat/ShortcutKeyModal";
export { ClearContextDivider } from "./chat/ClearContextDivider";
export { CompressedContextDivider } from "./chat/CompressedContextDivider";
export { SessionConfigModel } from "./chat/SessionConfigModel";
export { PromptHints, type RenderPrompt } from "./chat/PromptHints";
export { ChatActions } from "./chat/ChatActions";
