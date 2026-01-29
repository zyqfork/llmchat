import React from "react";
import {
  ServiceProvider,
  getProviderConfig,
  getAllProviders,
} from "../constant";
import { CustomProviderType } from "../store/access";
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

// 导入项目自带的 SVG 图标
import BotIconDefault from "../icons/llm-icons/default.svg";
import BotIconOpenAI from "../icons/llm-icons/openai.svg";
import BotIconGemini from "../icons/llm-icons/gemini.svg";
import BotIconGemma from "../icons/llm-icons/gemma.svg";
import BotIconClaude from "../icons/llm-icons/claude.svg";
import BotIconMeta from "../icons/llm-icons/meta.svg";
import BotIconMistral from "../icons/llm-icons/mistral.svg";
import BotIconDeepseek from "../icons/llm-icons/deepseek.svg";
import BotIconMoonshot from "../icons/llm-icons/moonshot.svg";
import BotIconQwen from "../icons/llm-icons/qwen.svg";
import BotIconGrok from "../icons/llm-icons/grok.svg";
import BotIconOllama from "../icons/llm-icons/ollama.svg";

// 动态图标组件，支持从ServiceProvider配置获取图标
const DynamicProviderIcon = React.memo(function DynamicProviderIcon({
  providerId,
  size = 24,
  fallback,
}: {
  providerId: string;
  size?: number;
  fallback?: React.ReactNode;
}) {
  const [iconUrl, setIconUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    // 优先使用 ServiceProvider 中配置的图标
    const providerConfig = getProviderConfig(providerId);
    if (providerConfig?.iconUrl) {
      setIconUrl(providerConfig.iconUrl);
      setError(false);
    } else {
      // 如果没有配置，尝试根据厂商名称查找
      const providerByName = getAllProviders().find(
        (p) => p.name === providerId,
      );
      if (providerByName?.iconUrl) {
        setIconUrl(providerByName.iconUrl);
        setError(false);
      }
    }
  }, [providerId]);

  if (error || !iconUrl) {
    return (
      fallback || (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: "#ccc",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: size * 0.5,
            fontWeight: "bold",
          }}
        >
          AI
        </div>
      )
    );
  }

  return (
    <img
      src={iconUrl}
      alt={`${providerId} icon`}
      width={size}
      height={size}
      onError={() => setError(true)}
      style={{ borderRadius: "4px" }}
    />
  );
});

// 根据模型名称判断应该使用的图标类型
function getModelIconType(
  providerName: string,
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
  | "llama"
  | "deepseek"
  | "default" {
  if (!modelName) return "default";

  const lowerModelName = modelName.toLowerCase();

  // 跨服务商模型识别 - 优先级最高（SiliconFlow等聚合服务）
  if (lowerModelName.includes("llama")) return "llama";
  if (lowerModelName.includes("deepseek")) return "deepseek";
  if (
    lowerModelName.includes("qwen") ||
    lowerModelName.includes("qwq") ||
    lowerModelName.includes("qvq")
  )
    return "qwen";
  if (lowerModelName.includes("claude")) return "claude";
  if (lowerModelName.includes("gemini") || lowerModelName.includes("learnlm"))
    return "gemini";
  if (lowerModelName.includes("gemma")) return "default"; // Gemma 使用默认图标或者可以后续添加专用图标
  if (
    lowerModelName.includes("gpt-4") ||
    lowerModelName.includes("chatgpt-4o") ||
    lowerModelName.includes("gpt-5")
  )
    return "gpt4";
  if (lowerModelName.includes("gpt-3")) return "gpt3";
  if (
    lowerModelName.includes("o1") ||
    lowerModelName.includes("o3") ||
    lowerModelName.includes("o4")
  )
    return "o1";
  // 嵌入模型的特殊处理 - 根据具体模型名称识别提供商
  if (lowerModelName.includes("embedding")) {
    // 阿里云Qwen嵌入模型
    if (
      lowerModelName.includes("qwen") ||
      lowerModelName.includes("text-embedding-v2")
    )
      return "qwen";
    // SiliconFlow平台的嵌入模型
    if (lowerModelName.includes("baai") || lowerModelName.includes("bge"))
      return "default";
    // OpenAI嵌入模型（默认）
    if (
      lowerModelName.includes("text-embedding") ||
      lowerModelName.includes("ada")
    )
      return "gpt4";
    // 其他嵌入模型使用默认图标
    return "default";
  }
  if (lowerModelName.includes("kimi") || lowerModelName.includes("moonshot"))
    return "kimi";
  if (lowerModelName.includes("wenxin") || lowerModelName.includes("文心"))
    return "wenxin";
  if (lowerModelName.includes("grok")) return "default"; // Grok 暂时使用默认图标

  // 服务商特定模型判断 - 作为后备
  if (
    providerName === ServiceProvider.OpenAI.name ||
    providerName === ServiceProvider.Azure.name
  ) {
    if (
      lowerModelName.includes("o1") ||
      lowerModelName.includes("o3") ||
      lowerModelName.includes("o4")
    )
      return "o1";
    if (
      lowerModelName.includes("gpt-4") ||
      lowerModelName.includes("chatgpt-4o")
    )
      return "gpt4";
    if (lowerModelName.includes("gpt-3")) return "gpt3";
    if (
      lowerModelName.includes("text-embedding") ||
      lowerModelName.includes("embedding")
    )
      return "gpt4"; // 嵌入模型使用GPT-4图标
  }

  if (providerName === ServiceProvider.Anthropic.name) {
    return "claude"; // Anthropic 主要提供 Claude 模型
  }

  if (providerName === ServiceProvider.Google.name) {
    return "gemini"; // Google 主要提供 Gemini 模型
  }

  if (providerName === ServiceProvider.Alibaba.name) {
    return "qwen"; // 阿里云主要提供 Qwen 模型
  }

  if (providerName === ServiceProvider.MoonshotAI.name) {
    return "kimi"; // 月之暗面主要提供 Kimi 模型
  }

  if (providerName === ServiceProvider.DeepSeek.name) {
    return "deepseek"; // DeepSeek 主要提供 DeepSeek 模型
  }

  return "default";
}

interface ProviderIconProps {
  provider: string; // 支持厂商名称或ID
  size?: number;
  modelName?: string; // 新增：模型名称，用于显示具体模型的图标
  customProviderType?: string; // 新增：自定义服务商的兼容类型
  useDynamicIcon?: boolean; // 是否使用动态图标（从ServiceProvider配置获取），默认true
}

export const ProviderIcon = React.memo(function ProviderIcon({
  provider,
  size = 24,
  modelName,
  customProviderType,
  useDynamicIcon = true, // 默认启用动态图标
}: ProviderIconProps) {
  const iconProps = { size };

  // 确定实际的厂商名称或ID
  let actualProviderId: string;
  let actualProviderName: string;

  if (provider.startsWith("custom_")) {
    // 自定义厂商：根据兼容类型映射到对应的内置厂商
    const typeToProviderMap: Record<CustomProviderType, string> = {
      openai: ServiceProvider.OpenAI.id,
      google: ServiceProvider.Google.id,
      anthropic: ServiceProvider.Anthropic.id,
    };

    actualProviderId =
      typeToProviderMap[customProviderType as CustomProviderType] ||
      ServiceProvider.OpenAI.id;
    actualProviderName =
      getProviderConfig(actualProviderId)?.name || ServiceProvider.OpenAI.name;
  } else {
    // 内置厂商：尝试通过ID或名称查找
    const providerConfig =
      getProviderConfig(provider) ||
      getAllProviders().find((p) => p.name === provider);

    if (providerConfig) {
      actualProviderId = providerConfig.id;
      actualProviderName = providerConfig.name;
    } else {
      // 如果找不到配置，使用默认值
      actualProviderId = ServiceProvider.OpenAI.id;
      actualProviderName = provider;
    }
  }

  // 优先使用 ServiceProvider 中配置的动态图标
  if (useDynamicIcon) {
    return (
      <DynamicProviderIcon
        providerId={actualProviderId}
        size={size}
        fallback={
          // 如果动态图标加载失败，使用传统图标作为fallback
          <ProviderIcon
            provider={provider}
            size={size}
            modelName={modelName}
            customProviderType={customProviderType}
            useDynamicIcon={false}
          />
        }
      />
    );
  }

  // 传统图标逻辑（作为fallback）
  const iconType = getModelIconType(actualProviderName, modelName);

  // 根据模型类型显示相应的图标
  switch (iconType) {
    case "gpt3":
      return (
        <OpenAI.Avatar
          {...iconProps}
          type="gpt3"
          style={{ color: "#ffffff" }}
        />
      );

    case "gpt4":
      return (
        <OpenAI.Avatar
          {...iconProps}
          type="gpt4"
          style={{ color: "#ffffff" }}
        />
      );

    case "o1":
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

    case "llama":
      return <Meta.Color {...iconProps} />;

    case "deepseek":
      return <DeepSeek.Color {...iconProps} />;

    default:
      // 根据厂商显示默认图标
      switch (actualProviderName) {
        case ServiceProvider.OpenAI.name:
          return <OpenAI.Avatar {...iconProps} style={{ color: "#ffffff" }} />;
        case ServiceProvider.Azure.name:
          return <Azure.Color {...iconProps} />;
        case ServiceProvider.Google.name:
          return <Gemini.Color {...iconProps} />;
        case ServiceProvider.Anthropic.name:
          return <Claude.Color {...iconProps} />;
        case ServiceProvider.Alibaba.name:
          return <Qwen.Color {...iconProps} />;
        case ServiceProvider.MoonshotAI.name:
          return <Kimi.Color {...iconProps} />;
        case ServiceProvider.DeepSeek.name:
          return <DeepSeek.Color {...iconProps} />;
        case ServiceProvider.XAI.name:
          return <Grok {...iconProps} style={{ color: Grok.colorPrimary }} />;
        case ServiceProvider.SiliconFlow.name:
          return <SiliconCloud.Color {...iconProps} />;
        case ServiceProvider.OllamaCloud.name:
        case ServiceProvider.Ollama.name:
          return <Ollama {...iconProps} />;
        default:
          // 通用AI图标
          return (
            <div
              style={{
                width: size,
                height: size,
                borderRadius: "4px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: size * 0.5,
                fontWeight: "bold",
              }}
            >
              AI
            </div>
          );
      }
  }
});

// 使用项目自带 SVG 图标的 Avatar 组件（用于模型管理器）
const ModelAvatar = React.memo(function ModelAvatar({
  modelName,
  size = 32,
}: {
  modelName?: string;
  size?: number;
}) {
  let LlmIcon = BotIconDefault;

  if (modelName) {
    const lowerModelName = modelName.toLowerCase();

    // 嵌入模型的特殊处理
    if (lowerModelName.includes("embedding")) {
      // 阿里云Qwen嵌入模型
      if (
        lowerModelName.includes("qwen") ||
        lowerModelName.includes("text-embedding-v2")
      ) {
        LlmIcon = BotIconQwen;
      }
      // SiliconFlow平台的嵌入模型
      else if (
        lowerModelName.includes("baai") ||
        lowerModelName.includes("bge")
      ) {
        LlmIcon = BotIconDefault; // 使用默认图标
      }
      // OpenAI嵌入模型
      else if (
        lowerModelName.includes("text-embedding") ||
        lowerModelName.includes("ada")
      ) {
        LlmIcon = BotIconOpenAI;
      }
      // 其他嵌入模型使用默认图标
      else {
        LlmIcon = BotIconDefault;
      }
    }
    // 其他模型的识别逻辑
    else if (
      lowerModelName.startsWith("gpt") ||
      lowerModelName.startsWith("chatgpt") ||
      lowerModelName.startsWith("dall-e") ||
      lowerModelName.startsWith("dalle") ||
      lowerModelName.startsWith("o1") ||
      lowerModelName.startsWith("o3") ||
      lowerModelName.startsWith("o4")
    ) {
      LlmIcon = BotIconOpenAI;
    } else if (
      lowerModelName.startsWith("gemini") ||
      lowerModelName.startsWith("learnlm")
    ) {
      LlmIcon = BotIconGemini;
    } else if (lowerModelName.startsWith("gemma")) {
      LlmIcon = BotIconGemma;
    } else if (lowerModelName.startsWith("claude")) {
      LlmIcon = BotIconClaude;
    } else if (lowerModelName.includes("llama")) {
      LlmIcon = BotIconMeta;
    } else if (
      lowerModelName.startsWith("mixtral") ||
      lowerModelName.startsWith("codestral") ||
      lowerModelName.startsWith("mistral")
    ) {
      LlmIcon = BotIconMistral;
    } else if (lowerModelName.includes("deepseek")) {
      LlmIcon = BotIconDeepseek;
    } else if (
      lowerModelName.startsWith("moonshot") ||
      lowerModelName.startsWith("kimi")
    ) {
      LlmIcon = BotIconMoonshot;
    } else if (
      lowerModelName.startsWith("qwen") ||
      lowerModelName.startsWith("qwq") ||
      lowerModelName.startsWith("qvq")
    ) {
      LlmIcon = BotIconQwen;
    } else if (lowerModelName.startsWith("grok")) {
      LlmIcon = BotIconGrok;
    } else if (lowerModelName.startsWith("ollama")) {
      LlmIcon = BotIconOllama;
    }
  }

  return (
    <div className="no-dark">
      <LlmIcon width={size} height={size} />
    </div>
  );
});

// 为模型管理页面提供更大的图标，优先使用ServiceProvider配置的图标
export const ModelProviderIcon = React.memo(function ModelProviderIcon({
  provider,
  size = 32,
  modelName,
}: {
  provider: string; // 支持自定义服务商
  size?: number;
  modelName?: string;
}) {
  // 优先使用 ServiceProvider 中配置的动态图标
  const providerConfig =
    getProviderConfig(provider) ||
    getAllProviders().find((p) => p.name === provider);

  if (providerConfig?.iconUrl) {
    return (
      <DynamicProviderIcon
        providerId={providerConfig.id}
        size={size}
        fallback={<ModelAvatar modelName={modelName} size={size} />}
      />
    );
  }

  // 如果没有配置图标，使用项目自带的 SVG 图标作为fallback
  return <ModelAvatar modelName={modelName} size={size} />;
});
