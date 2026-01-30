/**
 * 厂商图标优先级测试组件
 * 用于验证 Lobehub 图标优先级逻辑
 */

import React from "react";
import { ProviderIcon, ModelProviderIcon } from "./provider-icon";

// 测试用的厂商列表
const testProviders = [
  // Lobehub 支持的厂商（应该显示 Lobehub 图标）
  { name: "OpenAI", id: "openai", hasLobehub: true },
  { name: "Anthropic", id: "anthropic", hasLobehub: true },
  { name: "Google", id: "google", hasLobehub: true },
  { name: "Alibaba Cloud", id: "alibaba", hasLobehub: true },
  { name: "MoonshotAI", id: "moonshotai", hasLobehub: true },
  { name: "DeepSeek", id: "deepseek", hasLobehub: true },
  { name: "Meta", id: "meta", hasLobehub: true },
  { name: "xAI", id: "xai", hasLobehub: true },
  { name: "SiliconFlow", id: "siliconflow", hasLobehub: true },
  { name: "Ollama", id: "ollama", hasLobehub: true },
  { name: "Azure OpenAI", id: "azure", hasLobehub: true },

  // Lobehub 不支持的厂商（应该回退到默认图标）
  { name: "ZAI", id: "zai", hasLobehub: false },
  { name: "Custom Provider", id: "custom_provider", hasLobehub: false },
  { name: "Unknown Provider", id: "unknown", hasLobehub: false },
];

export function ProviderIconTest() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>厂商图标优先级测试</h2>
      <p>
        <strong>测试逻辑：</strong>
        <br />
        1. 优先使用 Lobehub 图标（彩色、高质量）
        <br />
        2. 如果 Lobehub 不支持，回退到 ServiceProvider 配置的图标
        <br />
        3. 最后回退到项目自带的 SVG 图标
      </p>

      {/* ProviderIcon 测试 */}
      <section style={{ marginBottom: "40px" }}>
        <h3>ProviderIcon 组件测试 (24px)</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {testProviders.map((provider) => (
            <div
              key={provider.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: provider.hasLobehub ? "#f0f9ff" : "#fafafa",
              }}
            >
              <ProviderIcon provider={provider.name} size={24} />
              <div>
                <div style={{ fontWeight: "500", fontSize: "14px" }}>
                  {provider.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: provider.hasLobehub ? "#0066cc" : "#666",
                  }}
                >
                  {provider.hasLobehub ? "Lobehub 支持" : "回退图标"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ModelProviderIcon 测试 */}
      <section style={{ marginBottom: "40px" }}>
        <h3>ModelProviderIcon 组件测试 (32px)</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {testProviders.map((provider) => (
            <div
              key={provider.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: provider.hasLobehub ? "#f0f9ff" : "#fafafa",
              }}
            >
              <ModelProviderIcon provider={provider.name} size={32} />
              <div>
                <div style={{ fontWeight: "500", fontSize: "14px" }}>
                  {provider.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: provider.hasLobehub ? "#0066cc" : "#666",
                  }}
                >
                  {provider.hasLobehub ? "Lobehub 支持" : "回退图标"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 不同尺寸测试 */}
      <section>
        <h3>不同尺寸测试</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {[16, 20, 24, 28, 32, 40, 48].map((size) => (
            <div key={size} style={{ textAlign: "center" }}>
              <ProviderIcon provider="OpenAI" size={size} />
              <div style={{ fontSize: "12px", marginTop: "4px" }}>{size}px</div>
            </div>
          ))}
        </div>
      </section>

      {/* 中文厂商名称测试 */}
      <section style={{ marginTop: "40px" }}>
        <h3>中文厂商名称测试</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {[
            { name: "阿里巴巴", expected: "qwen" },
            { name: "阿里云", expected: "qwen" },
            { name: "月之暗面", expected: "kimi" },
            { name: "百度", expected: "wenxin" },
          ].map((provider) => (
            <div
              key={provider.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
              }}
            >
              <ProviderIcon provider={provider.name} size={20} />
              <span style={{ fontSize: "14px" }}>{provider.name}</span>
              <span style={{ fontSize: "12px", color: "#666" }}>
                (→ {provider.expected})
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// 简化的测试组件，用于快速验证
export function QuickProviderIconTest() {
  const quickTestProviders = [
    "OpenAI",
    "Anthropic",
    "Google",
    "DeepSeek",
    "Unknown",
  ];

  return (
    <div style={{ padding: "16px" }}>
      <h4>快速图标测试</h4>
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        {quickTestProviders.map((provider) => (
          <div key={provider} style={{ textAlign: "center" }}>
            <ProviderIcon provider={provider} size={24} />
            <div style={{ fontSize: "12px", marginTop: "4px" }}>{provider}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
