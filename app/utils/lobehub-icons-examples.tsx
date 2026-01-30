/**
 * Lobehub Icons 使用示例
 *
 * 这个文件展示了如何使用 lobehub-icons.tsx 中的工具函数
 */

import React from "react";
import {
  getLobehubIcon,
  getModelLobehubIcon,
  getProviderLobehubIcon,
  getSupportedLobehubIcons,
  isSupportedLobehubIcon,
} from "./lobehub-icons";

// 示例组件：显示不同的图标用法
export function LobehubIconExamples() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Lobehub Icons 使用示例</h2>

      {/* 1. 基础图标使用 */}
      <section>
        <h3>1. 基础图标使用</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* OpenAI 不同变体 */}
          {getLobehubIcon({ type: "openai", variant: "color", size: 32 })}
          {getLobehubIcon({
            type: "openai",
            variant: "avatar",
            avatarType: "gpt4",
            size: 32,
          })}
          {getLobehubIcon({
            type: "openai",
            variant: "avatar",
            avatarType: "o1",
            size: 32,
          })}

          {/* Claude 不同变体 */}
          {getLobehubIcon({ type: "claude", variant: "color", size: 32 })}
          {getLobehubIcon({ type: "claude", variant: "text", size: 32 })}

          {/* Gemini */}
          {getLobehubIcon({ type: "gemini", variant: "color", size: 32 })}

          {/* Meta Llama */}
          {getLobehubIcon({ type: "meta", variant: "color", size: 32 })}
        </div>
      </section>

      {/* 2. 根据模型名称自动选择图标 */}
      <section>
        <h3>2. 根据模型名称自动选择图标</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {getModelLobehubIcon("gpt-4o", 32)}
          {getModelLobehubIcon("claude-3-sonnet", 32)}
          {getModelLobehubIcon("gemini-pro", 32)}
          {getModelLobehubIcon("llama-3.1-70b", 32)}
          {getModelLobehubIcon("deepseek-chat", 32)}
          {getModelLobehubIcon("qwen-max", 32)}
          {getModelLobehubIcon("kimi-chat", 32)}
        </div>
      </section>

      {/* 3. 根据厂商名称获取图标 */}
      <section>
        <h3>3. 根据厂商名称获取图标</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {getProviderLobehubIcon("OpenAI", 32)}
          {getProviderLobehubIcon("Anthropic", 32)}
          {getProviderLobehubIcon("Google", 32)}
          {getProviderLobehubIcon("Alibaba Cloud", 32)}
          {getProviderLobehubIcon("DeepSeek", 32)}
          {getProviderLobehubIcon("MoonshotAI", 32)}
        </div>
      </section>

      {/* 4. 自定义样式 */}
      <section>
        <h3>4. 自定义样式</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {getLobehubIcon({
            type: "openai",
            variant: "avatar",
            avatarType: "gpt4",
            size: 48,
            style: { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" },
          })}

          {getLobehubIcon({
            type: "claude",
            variant: "color",
            size: 48,
            style: {
              borderRadius: "50%",
              padding: "8px",
              backgroundColor: "#f0f0f0",
            },
          })}
        </div>
      </section>

      {/* 5. 工具函数使用 */}
      <section>
        <h3>5. 工具函数使用</h3>
        <div>
          <p>支持的图标类型: {getSupportedLobehubIcons().join(", ")}</p>
          <p>
            是否支持 &quot;openai&quot;:{" "}
            {isSupportedLobehubIcon("openai") ? "是" : "否"}
          </p>
          <p>
            是否支持 &quot;unknown&quot;:{" "}
            {isSupportedLobehubIcon("unknown") ? "是" : "否"}
          </p>
        </div>
      </section>
    </div>
  );
}

// 示例：在聊天界面中使用模型图标
export function ChatModelIcon({ modelName }: { modelName: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {getModelLobehubIcon(modelName, 20)}
      <span>{modelName}</span>
    </div>
  );
}

// 示例：在设置页面中使用厂商图标
export function ProviderSettingItem({
  providerName,
  children,
}: {
  providerName: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
      }}
    >
      {getProviderLobehubIcon(providerName, 24)}
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0 }}>{providerName}</h4>
        {children}
      </div>
    </div>
  );
}

// 示例：模型选择器中的图标
export function ModelSelector({
  models,
}: {
  models: Array<{ name: string; provider: string }>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {models.map((model, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {getModelLobehubIcon(model.name, 16)}
          <span style={{ fontSize: "14px" }}>{model.name}</span>
          <span style={{ fontSize: "12px", color: "#666", marginLeft: "auto" }}>
            {model.provider}
          </span>
        </div>
      ))}
    </div>
  );
}

// 示例：图标网格展示
export function IconGrid() {
  const supportedIcons = getSupportedLobehubIcons();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: "16px",
        padding: "20px",
      }}
    >
      {supportedIcons.map((iconType) => (
        <div
          key={iconType}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "16px",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          {getLobehubIcon({ type: iconType, size: 32 })}
          <span style={{ fontSize: "12px", textTransform: "capitalize" }}>
            {iconType}
          </span>
        </div>
      ))}
    </div>
  );
}
