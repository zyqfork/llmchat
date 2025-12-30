import EmojiPicker, {
  Emoji,
  EmojiStyle,
  Theme as EmojiTheme,
} from "emoji-picker-react";
import React, { useMemo } from "react";

import { ModelType } from "../store";

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
import BotIconDoubao from "../icons/llm-icons/doubao.svg";
import BotIconOllama from "../icons/llm-icons/ollama.svg";

export function getEmojiUrl(unified: string, style: EmojiStyle) {
  // Whoever owns this Content Delivery Network (CDN), I am using your CDN to serve emojis
  // Old CDN broken, so I had to switch to this one
  // Author: https://github.com/H0llyW00dzZ
  // 浏览器会自动缓存这个 CDN 图片（Cache-Control: public, max-age=31536000, immutable）
  return `https://fastly.jsdelivr.net/npm/emoji-datasource-apple/img/${style}/64/${unified}.png`;
}

export function AvatarPicker(props: {
  onEmojiClick: (emojiId: string) => void;
}) {
  return (
    <EmojiPicker
      width={"100%"}
      lazyLoadEmojis
      theme={EmojiTheme.AUTO}
      getEmojiUrl={getEmojiUrl}
      onEmojiClick={(e) => {
        props.onEmojiClick(e.unified);
      }}
    />
  );
}

// 模型图标映射表 - 更易维护和扩展
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
    icon: BotIconOpenAI,
  },
  {
    // Google Gemini 系列
    test: (name) => name.startsWith("gemini"),
    icon: BotIconGemini,
  },
  {
    // Google Gemma 系列
    test: (name) => name.startsWith("gemma"),
    icon: BotIconGemma,
  },
  {
    // Anthropic Claude 系列
    test: (name) => name.startsWith("claude"),
    icon: BotIconClaude,
  },
  {
    // Meta Llama 系列
    test: (name) => name.includes("llama"),
    icon: BotIconMeta,
  },
  {
    // Mistral 系列
    test: (name) => name.startsWith("mixtral") || name.startsWith("codestral"),
    icon: BotIconMistral,
  },
  {
    // DeepSeek 系列
    test: (name) => name.includes("deepseek"),
    icon: BotIconDeepseek,
  },
  {
    // Moonshot/Kimi 系列
    test: (name) => name.startsWith("moonshot") || name.startsWith("kimi"),
    icon: BotIconMoonshot,
  },
  {
    // Qwen 系列
    test: (name) => name.startsWith("qwen"),
    icon: BotIconQwen,
  },
  {
    // xAI Grok 系列
    test: (name) => name.startsWith("grok"),
    icon: BotIconGrok,
  },
  {
    // ByteDance Doubao 系列
    test: (name) => name.startsWith("doubao") || name.startsWith("ep-"),
    icon: BotIconDoubao,
  },
  {
    // Ollama 系列
    test: (name) => name.startsWith("ollama") || name.includes("ollama"),
    icon: BotIconOllama,
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
      return match?.icon || props.defaultIcon || BotIconDefault;
    }
    return props.defaultIcon || BotIconDefault;
  }, [props.model, props.defaultIcon]);

  if (props.model) {
    return (
      <div className="no-dark">
        <LlmIcon className="user-avatar" width={30} height={30} />
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
export const EmojiAvatar = React.memo(function EmojiAvatar(props: {
  avatar: string;
  size?: number;
}) {
  return (
    <Emoji
      unified={props.avatar}
      size={props.size ?? 18}
      getEmojiUrl={getEmojiUrl}
    />
  );
});
