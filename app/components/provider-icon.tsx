import React from "react";
import { ServiceProvider } from "../constant";
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
  Doubao,
  Meta,
  Ollama,
} from "@lobehub/icons";

// 根据模型名称判断应该使用的图标类型
function getModelIconType(
  provider: ServiceProvider,
  modelName?: string,
):
  | "gpt3"
  | "gpt4"
  | "o1"
  | "claude"
  | "gemini"
  | "kimi"
  | "qwen"
  | "wenxin"
  | "doubao"
  | "llama"
  | "deepseek"
  | "default" {
  if (!modelName) return "default";

  const lowerModelName = modelName.toLowerCase();

  // 跨服务商模型识别 - 优先级最高（SiliconFlow等聚合服务）
  if (lowerModelName.includes("llama")) return "llama";
  if (lowerModelName.includes("deepseek")) return "deepseek";
  if (lowerModelName.includes("qwen")) return "qwen";
  if (lowerModelName.includes("claude")) return "claude";
  if (lowerModelName.includes("gemini")) return "gemini";
  if (lowerModelName.includes("gpt-4") || lowerModelName.includes("chatgpt-4o"))
    return "gpt4";
  if (lowerModelName.includes("gpt-3")) return "gpt3";
  if (lowerModelName.includes("o1")) return "o1";
  if (lowerModelName.includes("doubao") || lowerModelName.includes("豆包"))
    return "doubao";
  if (lowerModelName.includes("kimi") || lowerModelName.includes("moonshot"))
    return "kimi";
  if (lowerModelName.includes("wenxin") || lowerModelName.includes("文心"))
    return "wenxin";

  // 服务商特定模型判断 - 作为后备
  if (
    provider === ServiceProvider.OpenAI ||
    provider === ServiceProvider.Azure
  ) {
    if (lowerModelName.includes("o1")) return "o1";
    if (
      lowerModelName.includes("gpt-4") ||
      lowerModelName.includes("chatgpt-4o")
    )
      return "gpt4";
    if (lowerModelName.includes("gpt-3")) return "gpt3";
  }

  if (provider === ServiceProvider.Anthropic) {
    return "claude"; // Anthropic 主要提供 Claude 模型
  }

  if (provider === ServiceProvider.Google) {
    return "gemini"; // Google 主要提供 Gemini 模型
  }

  if (provider === ServiceProvider.Moonshot) {
    return "kimi"; // 月之暗面主要提供 Kimi 模型
  }

  if (provider === ServiceProvider.Alibaba) {
    return "qwen"; // 阿里云主要提供 Qwen 模型
  }

  if (provider === ServiceProvider.ByteDance) {
    return "doubao"; // 字节跳动主要提供豆包模型
  }

  if (provider === ServiceProvider.DeepSeek) {
    return "deepseek"; // DeepSeek 主要提供 DeepSeek 模型
  }

  return "default";
}

interface ProviderIconProps {
  provider: ServiceProvider;
  size?: number;
  modelName?: string; // 新增：模型名称，用于显示具体模型的图标
}

export function ProviderIcon({
  provider,
  size = 24,
  modelName,
}: ProviderIconProps) {
  const iconProps = { size };
  const iconType = getModelIconType(provider, modelName);

  // 根据模型类型显示相应的图标
  switch (iconType) {
    case "gpt3":
      // GPT-3: 紫色背景 + 白色线条
      return (
        <OpenAI.Avatar
          {...iconProps}
          type="gpt3"
          style={{ color: "#ffffff" }}
        />
      );

    case "gpt4":
      // GPT-4: 绿色背景 + 白色线条
      return (
        <OpenAI.Avatar
          {...iconProps}
          type="gpt4"
          style={{ color: "#ffffff" }}
        />
      );

    case "o1":
      // O1: 蓝色背景 + 白色线条
      return (
        <OpenAI.Avatar {...iconProps} type="o1" style={{ color: "#ffffff" }} />
      );

    case "claude":
      return <Claude.Color {...iconProps} />;

    case "gemini":
      return <Gemini.Color {...iconProps} />;

    case "kimi":
      return <Kimi.Color {...iconProps} />;

    case "qwen":
      return <Qwen.Color {...iconProps} />;

    case "wenxin":
      return <Wenxin.Color {...iconProps} />;

    case "doubao":
      return <Doubao.Color {...iconProps} />;

    case "llama":
      return <Meta.Color {...iconProps} />;

    case "deepseek":
      return <DeepSeek.Color {...iconProps} />;

    default:
      // 如果没有具体模型信息，则根据服务商显示图标
      switch (provider) {
        case ServiceProvider.OpenAI:
          // OpenAI 默认显示彩色背景 + 白色线条的 Avatar
          return <OpenAI.Avatar {...iconProps} style={{ color: "#ffffff" }} />;

        case ServiceProvider.Azure:
          // Azure 提供的是 OpenAI 模型，显示 Azure 彩色图标
          return <Azure.Color {...iconProps} />;

        case ServiceProvider.Google:
          // Google 主要提供 Gemini 模型，显示 Gemini 彩色图标
          return <Gemini.Color {...iconProps} />;

        case ServiceProvider.Anthropic:
          // Anthropic 主要提供 Claude 模型，显示 Claude 彩色图标
          return <Claude.Color {...iconProps} />;

        case ServiceProvider.ByteDance:
          // 字节跳动主要提供豆包模型，显示豆包彩色图标
          return <Doubao.Color {...iconProps} />;

        case ServiceProvider.Alibaba:
          // 阿里云主要提供 Qwen 模型，显示 Qwen 彩色图标
          return <Qwen.Color {...iconProps} />;

        case ServiceProvider.Moonshot:
          // 月之暗面主要提供 Kimi 模型，显示 Kimi 彩色图标
          return <Kimi.Color {...iconProps} />;

        case ServiceProvider.DeepSeek:
          // DeepSeek 主要提供 DeepSeek 模型，显示 DeepSeek 彩色图标
          return <DeepSeek.Color {...iconProps} />;

        case ServiceProvider.XAI:
          // xAI 主要提供 Grok 模型，显示 Grok 图标（使用品牌色）
          return <Grok {...iconProps} style={{ color: Grok.colorPrimary }} />;

        case ServiceProvider.SiliconFlow:
          // SiliconFlow 是聚合服务，显示 SiliconCloud 彩色图标
          return <SiliconCloud.Color {...iconProps} />;

        default:
          // 返回一个通用的AI图标
          return (
            <div
              style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: size * 0.6,
                fontWeight: "bold",
              }}
            >
              AI
            </div>
          );
      }
  }
}

// 为模型管理页面提供更大的图标，支持传入模型名称
export function ModelProviderIcon({
  provider,
  size = 32,
  modelName,
}: {
  provider: ServiceProvider;
  size?: number;
  modelName?: string;
}) {
  return <ProviderIcon provider={provider} size={size} modelName={modelName} />;
}
