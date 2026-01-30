"use client";

/**
 * Lobehub 图标测试页面
 * 访问 /test-lobehub 查看图标是否正常显示
 */

import React from "react";
import {
  getLobehubIcon,
  getProviderLobehubIconSafe,
} from "../utils/lobehub-icons";

export default function TestLobehubPage() {
  const testProviders = [
    "OpenAI",
    "Anthropic",
    "Google",
    "Alibaba Cloud",
    "DeepSeek",
    "xAI",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: "20px",
        }}
      >
        <h1>Lobehub 图标测试</h1>

        <h2>直接使用 getLobehubIcon</h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          {[
            { type: "openai", name: "OpenAI" },
            { type: "claude", name: "Claude" },
            { type: "gemini", name: "Gemini" },
            { type: "qwen", name: "Qwen" },
            { type: "deepseek", name: "DeepSeek" },
            { type: "grok", name: "Grok" },
          ].map(({ type, name }) => (
            <div key={type} style={{ textAlign: "center" }}>
              {getLobehubIcon({ type: type as any, size: 32 })}
              <div style={{ fontSize: "12px", marginTop: "4px" }}>{name}</div>
            </div>
          ))}
        </div>

        <h2>使用 getProviderLobehubIconSafe</h2>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {testProviders.map((provider) => {
            const icon = getProviderLobehubIconSafe(provider, 32);
            return (
              <div key={provider} style={{ textAlign: "center" }}>
                {icon || (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: "#ccc",
                      borderRadius: "4px",
                    }}
                  />
                )}
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                  {provider}
                </div>
                <div style={{ fontSize: "10px", color: "#666" }}>
                  {icon ? "✅ Lobehub" : "❌ Fallback"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
