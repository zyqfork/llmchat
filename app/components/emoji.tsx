import React, { useMemo } from "react";
import dynamic from "next/dynamic";

import { ModelType } from "../store";

// 统一使用 @lobehub/icons 提供的厂商图标（本地 llm-icons 已移除）
import {
  OpenAI,
  Gemini,
  Gemma,
  Claude,
  Meta,
  Mistral,
  DeepSeek,
  Moonshot,
  Qwen,
  Grok,
  Ollama,
  LobeHub,
} from "@lobehub/icons";

export const EMOJI_STYLE = "apple";

export function getEmojiUrl(unified: string) {
  // Whoever owns this Content Delivery Network (CDN), I am using your CDN to serve emojis
  // Old CDN broken, so I had to switch to this one
  // Author: https://github.com/H0llyW00dzZ
  // 浏览器会自动缓存这个 CDN 图片（Cache-Control: public, max-age=31536000, immutable）
  return `https://fastly.jsdelivr.net/npm/emoji-datasource-apple/img/${EMOJI_STYLE}/64/${unified}.png`;
}

// AvatarPicker 仅存在于设置页 / 面具页（动态加载页面）中，因此整个
// emoji-picker-react 包（约 490KB）只在打开选择器时才被按需加载，
// 不再进入首屏主包。
export const AvatarPicker = dynamic(
  async () => {
    const mod = await import("emoji-picker-react");
    const EmojiPicker = mod.default;
    return function AvatarPickerImpl(props: {
      onEmojiClick: (emojiId: string) => void;
    }) {
      return (
        <EmojiPicker
          width={"100%"}
          lazyLoadEmojis
          theme={mod.Theme.AUTO}
          getEmojiUrl={getEmojiUrl}
          onEmojiClick={(e) => {
            props.onEmojiClick(e.unified);
          }}
        />
      );
    };
  },
  {
    loading: () => <div style={{ minHeight: 320 }} />,
  },
);

// 模型图标映射表 - 更易维护和扩展
// 统一使用 @lobehub/icons 的 Color 变体（无 Color 时用默认 Mono）
const MODEL_ICON_MAP: Array<{
  test: (modelName: string) => boolean;
  icon: any;
}> = [
  {
    // OpenAI 系列
    test: (name) =>
      name.startsWith("gpt") ||
      name.startsWith("chatgpt") ||
      name.startsWith("dall-e") ||
      name.startsWith("dalle") ||
      name.startsWith("o1") ||
      name.startsWith("o3"),
    icon: OpenAI,
  },
  {
    // Google Gemini 系列
    test: (name) => name.startsWith("gemini"),
    icon: Gemini.Color,
  },
  {
    // Google Gemma 系列
    test: (name) => name.startsWith("gemma"),
    icon: Gemma.Color,
  },
  {
    // Anthropic Claude 系列
    test: (name) => name.startsWith("claude"),
    icon: Claude.Color,
  },
  {
    // Meta Llama 系列
    test: (name) => name.includes("llama"),
    icon: Meta.Color,
  },
  {
    // Mistral 系列
    test: (name) => name.startsWith("mixtral") || name.startsWith("codestral"),
    icon: Mistral.Color,
  },
  {
    // DeepSeek 系列
    test: (name) => name.includes("deepseek"),
    icon: DeepSeek.Color,
  },
  {
    // Moonshot/Kimi 系列
    test: (name) => name.startsWith("moonshot") || name.startsWith("kimi"),
    icon: Moonshot,
  },
  {
    // Qwen 系列
    test: (name) => name.startsWith("qwen"),
    icon: Qwen.Color,
  },
  {
    // xAI Grok 系列
    test: (name) => name.startsWith("grok"),
    icon: Grok,
  },
  {
    // Ollama 系列
    test: (name) => name.startsWith("ollama") || name.includes("ollama"),
    icon: Ollama,
  },
];

// 使用 React.memo 缓存 Avatar 组件，避免不必要的重渲染
export const Avatar = React.memo(function Avatar(props: {
  model?: ModelType;
  avatar?: string;
  defaultIcon?: any; // 允许自定义默认图标
}) {
  // 使用 useMemo 缓存 LlmIcon 计算结果
  const LlmIcon = useMemo(() => {
    if (props.model) {
      const modelName = props.model.toLowerCase();
      const match = MODEL_ICON_MAP.find((item) => item.test(modelName));
      return match?.icon || props.defaultIcon || LobeHub;
    }
    return props.defaultIcon || LobeHub;
  }, [props.model, props.defaultIcon]);

  if (props.model) {
    return (
      <div className="no-dark">
        <LlmIcon size={30} className="user-avatar" />
      </div>
    );
  }

  return (
    <div className="user-avatar">
      {props.avatar && <EmojiAvatar avatar={props.avatar} />}
    </div>
  );
});

// 使用 React.memo 缓存 EmojiAvatar 组件，减少不必要的 DOM 操作
// 注意：浏览器会自动缓存 CDN 图片，这里的优化主要是减少 React 重渲染
// 直接渲染 <img>，避免引入 emoji-picker-react 完整包
export const EmojiAvatar = React.memo(function EmojiAvatar(props: {
  avatar: string;
  size?: number;
}) {
  const size = props.size ?? 18;
  // CDN 表情图片：已 immutable 缓存 + loading=lazy，export 模式下不经过 next/image 优化
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getEmojiUrl(props.avatar)}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
      style={{ width: size, height: size }}
    />
  );
});