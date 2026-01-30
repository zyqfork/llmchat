"use client";

/**
 * 厂商图标优先级测试页面
 * 访问 /test-icons 查看图标优先级效果
 */

import React from "react";
import { ProviderIconTest } from "../components/provider-icon-test";

export default function TestIconsPage() {
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
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <ProviderIconTest />
      </div>
    </div>
  );
}
