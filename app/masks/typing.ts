import { Mask } from "../store/mask";

// 简化的消息类型，用于内置助手定义
type BuiltinMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  date: string;
};

export type BuiltinMask = {
  avatar: string;
  name: string;
  hideContext?: boolean;
  context: BuiltinMessage[];
  modelConfig?: Partial<Mask["modelConfig"]>;
  enableArtifacts?: boolean;
  enableCodeFold?: boolean;
};
