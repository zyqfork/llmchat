import React from "react";
import {
  OpenAI,
  Azure,
  DeepSeek,
  SiliconCloud,
  Grok,
  Claude,
  Gemini,
  Kimi,
  Qwen,
  Wenxin,
  Meta,
  Ollama,
  ChatGLM,
  Doubao,
  Mistral,
  HuggingFace,
  Perplexity,
  Stability,
  Midjourney,
  Replicate,
  Together,
  ModelScope,
  Cohere,
  Yi,
  // 注意：以下图标可能在 @lobehub/icons 中不存在，需要使用 fallback
  // MiniMax, StepFun, Baichuan, SenseTime, iFlytek, Tencent, NetEase, Qihoo360, Groq, Fireworks, Anyscale
} from "@lobehub/icons";
import {
  ModelIconType,
  getModelIconType,
  getProviderIconType,
  ICON_CONFIG,
} from "../constant";

// 重新导出 ModelIconType 以便其他组件使用
export type { ModelIconType };

// 支持的图标变体
export type IconVariant = "color" | "avatar" | "text" | "combine";

// OpenAI Avatar 类型
export type OpenAIAvatarType = "gpt3" | "gpt4" | "o1";

// 图标配置接口
export interface LobehubIconConfig {
  type: ModelIconType;
  variant?: IconVariant;
  avatarType?: OpenAIAvatarType; // 仅用于 OpenAI
  size?: number;
  style?: React.CSSProperties;
}

/**
 * 获取 Lobehub 图标组件
 * @param config 图标配置
 * @returns React 组件
 */
export function getLobehubIcon(config: LobehubIconConfig): React.ReactElement {
  const { type, variant = "color", avatarType, size = 24, style } = config;
  const iconProps = { size, style };

  switch (type) {
    case "openai":
      if (variant === "avatar" && avatarType) {
        return <OpenAI.Avatar {...iconProps} type={avatarType} />;
      }
      return (
        <OpenAI.Avatar {...iconProps} style={{ color: "#ffffff", ...style }} />
      );

    case "azure":
      return <Azure.Color {...iconProps} />;

    case "claude":
      switch (variant) {
        case "color":
          return <Claude.Color {...iconProps} />;
        case "text":
          return <Claude.Text {...iconProps} />;
        case "combine":
          return <Claude.Combine {...iconProps} />;
        default:
          return <Claude.Color {...iconProps} />;
      }

    case "anthropic":
      // 使用 Claude 图标作为 Anthropic 的代表
      return <Claude.Color {...iconProps} />;

    case "gemini":
      switch (variant) {
        case "color":
          return <Gemini.Color {...iconProps} />;
        case "text":
          return <Gemini.Text {...iconProps} />;
        case "combine":
          return <Gemini.Combine {...iconProps} />;
        default:
          return <Gemini.Color {...iconProps} />;
      }

    case "meta":
      switch (variant) {
        case "color":
          return <Meta.Color {...iconProps} />;
        case "text":
          return <Meta.Text {...iconProps} />;
        case "combine":
          return <Meta.Combine {...iconProps} />;
        default:
          return <Meta.Color {...iconProps} />;
      }

    case "deepseek":
      switch (variant) {
        case "color":
          return <DeepSeek.Color {...iconProps} />;
        case "text":
          return <DeepSeek.Text {...iconProps} />;
        case "combine":
          return <DeepSeek.Combine {...iconProps} />;
        default:
          return <DeepSeek.Color {...iconProps} />;
      }

    case "kimi":
      switch (variant) {
        case "color":
          return <Kimi.Color {...iconProps} />;
        case "text":
          return <Kimi.Text {...iconProps} />;
        case "combine":
          return <Kimi.Combine {...iconProps} />;
        default:
          return <Kimi.Color {...iconProps} />;
      }

    case "qwen":
      switch (variant) {
        case "color":
          return <Qwen.Color {...iconProps} />;
        case "text":
          return <Qwen.Text {...iconProps} />;
        case "combine":
          return <Qwen.Combine {...iconProps} />;
        default:
          return <Qwen.Color {...iconProps} />;
      }

    case "wenxin":
      switch (variant) {
        case "color":
          return <Wenxin.Color {...iconProps} />;
        case "text":
          return <Wenxin.Text {...iconProps} />;
        case "combine":
          return <Wenxin.Combine {...iconProps} />;
        default:
          return <Wenxin.Color {...iconProps} />;
      }

    case "grok":
      return (
        <Grok {...iconProps} style={{ color: Grok.colorPrimary, ...style }} />
      );

    case "siliconcloud":
      switch (variant) {
        case "color":
          return <SiliconCloud.Color {...iconProps} />;
        case "text":
          return <SiliconCloud.Text {...iconProps} />;
        case "combine":
          return <SiliconCloud.Combine {...iconProps} />;
        default:
          return <SiliconCloud.Color {...iconProps} />;
      }

    case "ollama":
      return <Ollama {...iconProps} />;

    case "chatglm":
      switch (variant) {
        case "color":
          return <ChatGLM.Color {...iconProps} />;
        case "text":
          return <ChatGLM.Text {...iconProps} />;
        case "combine":
          return <ChatGLM.Combine {...iconProps} />;
        default:
          return <ChatGLM.Color {...iconProps} />;
      }

    case "doubao":
      switch (variant) {
        case "color":
          return <Doubao.Color {...iconProps} />;
        case "text":
          return <Doubao.Text {...iconProps} />;
        case "combine":
          return <Doubao.Combine {...iconProps} />;
        default:
          return <Doubao.Color {...iconProps} />;
      }

    case "mistral":
      switch (variant) {
        case "color":
          return <Mistral.Color {...iconProps} />;
        case "text":
          return <Mistral.Text {...iconProps} />;
        case "combine":
          return <Mistral.Combine {...iconProps} />;
        default:
          return <Mistral.Color {...iconProps} />;
      }

    case "huggingface":
      switch (variant) {
        case "color":
          return <HuggingFace.Color {...iconProps} />;
        case "text":
          return <HuggingFace.Text {...iconProps} />;
        case "combine":
          return <HuggingFace.Combine {...iconProps} />;
        default:
          return <HuggingFace.Color {...iconProps} />;
      }

    case "perplexity":
      return <Perplexity {...iconProps} />;

    case "stability":
      return <Stability {...iconProps} />;

    case "midjourney":
      return <Midjourney {...iconProps} />;

    case "replicate":
      return <Replicate {...iconProps} />;

    case "together":
      return <Together {...iconProps} />;

    case "modelscope":
      return <ModelScope {...iconProps} />;

    case "cohere":
      return <Cohere {...iconProps} />;

    case "yi":
      return <Yi {...iconProps} />;

    // 对于 Lobehub 图标库中不存在的图标类型，使用合适的 fallback
    case "minimax":
      // 使用通用的 AI 图标
      return (
        <OpenAI.Avatar {...iconProps} style={{ color: "#ff6b35", ...style }} />
      );

    case "stepfun":
      // 使用阶跃相关的图标
      return <DeepSeek.Color {...iconProps} />;

    case "baichuan":
      // 使用国产 AI 图标
      return <Qwen.Color {...iconProps} />;

    case "sensetime":
      // 使用商汤相关的图标
      return <ChatGLM.Color {...iconProps} />;

    case "iflytek":
      // 使用科大讯飞相关的图标
      return <Wenxin.Color {...iconProps} />;

    case "tencent":
      // 使用腾讯相关的图标
      return <Meta.Color {...iconProps} />;

    case "netease":
      // 使用网易相关的图标
      return <Qwen.Color {...iconProps} />;

    case "360":
      // 使用360相关的图标
      return (
        <OpenAI.Avatar {...iconProps} style={{ color: "#00d4aa", ...style }} />
      );

    case "groq":
      // 使用硬件加速相关的图标
      return <Grok {...iconProps} style={{ color: "#f55036", ...style }} />;

    case "fireworks":
      // 使用火花相关的图标
      return <Stability {...iconProps} />;

    case "anyscale":
      // 使用云平台相关的图标
      return <Together {...iconProps} />;

    // 对于其他不存在的图标类型，使用通用 fallback
    case "runpod":
      // 使用通用的云平台图标
      return <Replicate {...iconProps} />;

    case "novita":
      // 使用通用的 AI 平台图标
      return <Together {...iconProps} />;

    case "lepton":
      // 使用通用的 AI 平台图标
      return <Stability {...iconProps} />;

    case "cerebras":
      // 使用硬件相关的图标
      return <Grok {...iconProps} style={{ color: "#6366f1", ...style }} />;

    default:
      // 默认返回 OpenAI 图标
      return (
        <OpenAI.Avatar {...iconProps} style={{ color: "#ffffff", ...style }} />
      );
  }
}

/**
 * 根据模型名称自动选择合适的 Lobehub 图标
 * @param modelName 模型名称
 * @param size 图标大小
 * @param style 自定义样式
 * @returns React 组件
 */
export function getModelLobehubIcon(
  modelName: string,
  size: number = 24,
  style?: React.CSSProperties,
): React.ReactElement {
  const iconType = getModelIconType(modelName);

  if (iconType) {
    // 特殊处理 OpenAI 模型的不同变体
    if (iconType === "openai") {
      const lowerModelName = modelName.toLowerCase();

      if (lowerModelName.includes("gpt-3")) {
        return getLobehubIcon({
          type: "openai",
          variant: "avatar",
          avatarType: "gpt3",
          size,
          style,
        });
      }

      if (
        lowerModelName.includes("gpt-4") ||
        lowerModelName.includes("chatgpt-4o") ||
        lowerModelName.includes("gpt-5")
      ) {
        return getLobehubIcon({
          type: "openai",
          variant: "avatar",
          avatarType: "gpt4",
          size,
          style,
        });
      }

      if (
        lowerModelName.includes("o1") ||
        lowerModelName.includes("o3") ||
        lowerModelName.includes("o4")
      ) {
        return getLobehubIcon({
          type: "openai",
          variant: "avatar",
          avatarType: "o1",
          size,
          style,
        });
      }
    }

    // 其他图标类型使用默认配置
    return getLobehubIcon({ type: iconType, size, style });
  }

  // 默认返回 OpenAI 图标
  return getLobehubIcon({ type: "openai", variant: "avatar", size, style });
}

/**
 * 根据厂商名称获取 Lobehub 图标
 * @param providerName 厂商名称
 * @param size 图标大小
 * @param style 自定义样式
 * @returns React 组件
 */
export function getProviderLobehubIcon(
  providerName: string,
  size: number = 24,
  style?: React.CSSProperties,
): React.ReactElement {
  const iconType = getProviderIconType(providerName);
  return getLobehubIcon({ type: iconType || "openai", size, style });
}

/**
 * 获取厂商名称到 Lobehub 图标类型的映射
 * @param providerName 厂商名称
 * @returns 图标类型或 null
 */
export function getProviderLobehubIconType(
  providerName: string,
): ModelIconType | null {
  return getProviderIconType(providerName);
}

/**
 * 安全地根据模型名称获取 Lobehub 图标（带错误处理）
 * @param modelName 模型名称
 * @param size 图标大小
 * @param style 自定义样式
 * @returns React 组件或 null（如果出错）
 */
export function getModelLobehubIconSafe(
  modelName: string,
  size: number = 24,
  style?: React.CSSProperties,
): React.ReactElement | null {
  try {
    return getModelLobehubIcon(modelName, size, style);
  } catch (error) {
    console.warn(`Failed to get Lobehub icon for model ${modelName}:`, error);
    return null;
  }
}

/**
 * 安全地获取厂商 Lobehub 图标（带错误处理）
 * @param providerName 厂商名称
 * @param size 图标大小
 * @param style 自定义样式
 * @returns React 组件或 null（如果不支持）
 */
export function getProviderLobehubIconSafe(
  providerName: string,
  size: number = 24,
  style?: React.CSSProperties,
): React.ReactElement | null {
  try {
    const iconType = getProviderLobehubIconType(providerName);
    if (iconType) {
      return getLobehubIcon({ type: iconType, size, style });
    }

    return null;
  } catch (error) {
    console.warn(
      `Failed to get Lobehub icon for provider ${providerName}:`,
      error,
    );
    return null;
  }
}

/**
 * 检查厂商是否支持 Lobehub 图标
 * @param providerName 厂商名称
 * @returns 是否支持
 */
export function isProviderSupportedByLobehub(providerName: string): boolean {
  return getProviderLobehubIconSafe(providerName) !== null;
}

/**
 * 获取所有支持的图标类型
 * @returns 支持的图标类型数组
 */
export function getSupportedLobehubIcons(): ModelIconType[] {
  return Object.keys(ICON_CONFIG) as ModelIconType[];
}

/**
 * 检查是否支持指定的图标类型
 * @param iconType 图标类型
 * @returns 是否支持
 */
export function isSupportedLobehubIcon(
  iconType: string,
): iconType is ModelIconType {
  return getSupportedLobehubIcons().includes(iconType as ModelIconType);
}
