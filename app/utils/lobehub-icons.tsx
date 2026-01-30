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
} from "@lobehub/icons";

// 支持的图标类型
export type LobehubIconType =
  | "openai"
  | "azure"
  | "claude"
  | "gemini"
  | "meta"
  | "deepseek"
  | "kimi"
  | "qwen"
  | "wenxin"
  | "grok"
  | "siliconcloud"
  | "ollama";

// 支持的图标变体
export type IconVariant = "color" | "avatar" | "text" | "combine";

// OpenAI Avatar 类型
export type OpenAIAvatarType = "gpt3" | "gpt4" | "o1";

// 图标配置接口
export interface LobehubIconConfig {
  type: LobehubIconType;
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
  const lowerModelName = modelName.toLowerCase();

  // 根据模型名称智能选择图标类型和变体
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

  if (lowerModelName.includes("claude")) {
    return getLobehubIcon({ type: "claude", size, style });
  }

  if (lowerModelName.includes("gemini") || lowerModelName.includes("learnlm")) {
    return getLobehubIcon({ type: "gemini", size, style });
  }

  if (lowerModelName.includes("llama")) {
    return getLobehubIcon({ type: "meta", size, style });
  }

  if (lowerModelName.includes("deepseek")) {
    return getLobehubIcon({ type: "deepseek", size, style });
  }

  if (lowerModelName.includes("kimi") || lowerModelName.includes("moonshot")) {
    return getLobehubIcon({ type: "kimi", size, style });
  }

  if (
    lowerModelName.includes("qwen") ||
    lowerModelName.includes("qwq") ||
    lowerModelName.includes("qvq")
  ) {
    return getLobehubIcon({ type: "qwen", size, style });
  }

  if (lowerModelName.includes("wenxin") || lowerModelName.includes("文心")) {
    return getLobehubIcon({ type: "wenxin", size, style });
  }

  if (lowerModelName.includes("grok")) {
    return getLobehubIcon({ type: "grok", size, style });
  }

  if (lowerModelName.includes("ollama")) {
    return getLobehubIcon({ type: "ollama", size, style });
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
  const lowerProviderName = providerName.toLowerCase();

  const providerMap: Record<string, LobehubIconType> = {
    openai: "openai",
    "azure openai": "azure",
    azure: "azure",
    anthropic: "claude",
    google: "gemini",
    "alibaba cloud": "qwen",
    alibaba: "qwen",
    moonshotai: "kimi",
    moonshot: "kimi",
    deepseek: "deepseek",
    meta: "meta",
    xai: "grok",
    siliconflow: "siliconcloud",
    ollama: "ollama",
    "ollama cloud": "ollama",
  };

  const iconType = providerMap[lowerProviderName] || "openai";
  return getLobehubIcon({ type: iconType, size, style });
}

/**
 * 获取厂商名称到 Lobehub 图标类型的映射
 * @param providerName 厂商名称
 * @returns Lobehub 图标类型或 null
 */
export function getProviderLobehubIconType(
  providerName: string,
): LobehubIconType | null {
  const lowerProviderName = providerName.toLowerCase();

  const providerMap: Record<string, LobehubIconType> = {
    // 主要厂商
    openai: "openai",
    "azure openai": "azure",
    azure: "azure",
    anthropic: "claude",
    google: "gemini",
    "alibaba cloud": "qwen",
    alibaba: "qwen",
    moonshotai: "kimi",
    moonshot: "kimi",
    deepseek: "deepseek",
    meta: "meta",
    xai: "grok",
    siliconflow: "siliconcloud",
    ollama: "ollama",
    "ollama cloud": "ollama",

    // 中文厂商名称
    阿里巴巴: "qwen",
    阿里云: "qwen",
    月之暗面: "kimi",
    智谱: "claude", // 可以根据实际情况调整
    百度: "wenxin",
    腾讯: "meta", // 可以根据实际情况调整
  };

  const iconType = providerMap[lowerProviderName];
  return iconType && isSupportedLobehubIcon(iconType) ? iconType : null;
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
 * 获取所有支持的 Lobehub 图标类型
 * @returns 支持的图标类型数组
 */
export function getSupportedLobehubIcons(): LobehubIconType[] {
  return [
    "openai",
    "azure",
    "claude",
    "gemini",
    "meta",
    "deepseek",
    "kimi",
    "qwen",
    "wenxin",
    "grok",
    "siliconcloud",
    "ollama",
  ];
}

/**
 * 检查是否支持指定的图标类型
 * @param iconType 图标类型
 * @returns 是否支持
 */
export function isSupportedLobehubIcon(
  iconType: string,
): iconType is LobehubIconType {
  return getSupportedLobehubIcons().includes(iconType as LobehubIconType);
}
