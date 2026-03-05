import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessStore } from "../../store";
import { Path } from "../../constant";
import Locale from "../../locales";
import { logger } from "../../utils/logger";
import styles from "../chat.module.scss";

/**
 * 根据 providerId 解析出展示用名称（自定义厂商用 name，内置用 id）
 */
export function getProviderDisplayName(
  providerId: string,
  accessStore: { customProviders?: Array<{ id: string; name: string }> },
): string {
  if (!providerId) {
    logger.warn(`[Chat] Provider ID is empty`);
    return "Unknown";
  }
  logger.debug(`[Chat] Looking up provider display name for: ${providerId}`);
  if (providerId.startsWith("custom_")) {
    const customProvider = accessStore.customProviders?.find(
      (p: { id: string }) => p.id === providerId,
    );
    if (customProvider) {
      return customProvider.name;
    }
    logger.warn(`[Chat] Custom provider not found for ID: ${providerId}`);
    return providerId;
  }
  return providerId;
}

const PROVIDER_KEY_MAP: Record<string, string> = {
  OpenAI: "openai",
  Azure: "azure",
  Google: "google",
  Anthropic: "anthropic",
  Alibaba: "alibaba",
  Moonshot: "moonshot",
  XAI: "xai",
  DeepSeek: "deepseek",
  SiliconFlow: "siliconflow",
  Ollama: "ollama",
};

export function ProviderTooltip({
  children,
  providerName,
}: {
  children: React.ReactNode;
  providerName: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const accessStore = useAccessStore();
  const navigate = useNavigate();

  const providerKey =
    PROVIDER_KEY_MAP[providerName] || providerName.toLowerCase();
  const providerConfig = accessStore.getEffectiveProviderConfig(providerKey);

  useEffect(() => {
    if (!showTooltip || !wrapperRef.current || !tooltipRef.current) return;
    requestAnimationFrame(() => {
      const wrapperRect = wrapperRef.current!.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const margin = 12;
      const gap = 8;
      const spaceAbove = wrapperRect.top;
      const spaceBelow = window.innerHeight - wrapperRect.bottom;
      const tooltipHeight = tooltipRect.height;
      const tooltipWidth = tooltipRect.width;

      let top: number;
      if (
        spaceAbove >= tooltipHeight + gap + margin &&
        spaceBelow < tooltipHeight + gap
      ) {
        top = wrapperRect.top - tooltipHeight - gap;
      } else if (spaceBelow >= tooltipHeight + gap + margin) {
        top = wrapperRect.bottom + gap;
      } else if (spaceAbove > spaceBelow) {
        top = Math.max(margin, wrapperRect.top - tooltipHeight - gap);
      } else {
        top = wrapperRect.bottom + gap;
      }

      const centerLeft =
        wrapperRect.left + wrapperRect.width / 2 - tooltipWidth / 2;
      let left: number;
      if (
        centerLeft >= margin &&
        centerLeft + tooltipWidth <= window.innerWidth - margin
      ) {
        left = centerLeft;
      } else if (centerLeft < margin) {
        left = Math.max(margin, wrapperRect.left);
      } else {
        left = Math.min(
          window.innerWidth - tooltipWidth - margin,
          wrapperRect.right - tooltipWidth,
        );
      }

      top = Math.max(
        margin,
        Math.min(top, window.innerHeight - tooltipHeight - margin),
      );
      left = Math.max(
        margin,
        Math.min(left, window.innerWidth - tooltipWidth - margin),
      );
      setTooltipStyle({ top: `${top}px`, left: `${left}px` });
    });
  }, [showTooltip]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(Path.Settings);
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("switchToModelService", {
          detail: { provider: providerName },
        }),
      );
    }, 100);
  };

  const getTooltipContent = () => {
    if (!providerConfig) {
      return [
        `${Locale.Chat.ProviderTooltip.Provider}: ${providerName}`,
        Locale.Chat.ProviderTooltip.NoConfig,
      ];
    }
    const lines = [
      `${Locale.Chat.ProviderTooltip.Provider}: ${providerName}`,
      `${Locale.Chat.ProviderTooltip.Source}: ${
        providerConfig.source === "frontend"
          ? Locale.Chat.ProviderTooltip.Frontend
          : Locale.Chat.ProviderTooltip.Server
      }`,
    ];
    if (providerConfig.baseUrl) {
      lines.push(
        `${Locale.Chat.ProviderTooltip.BaseUrl}: ${providerConfig.baseUrl}`,
      );
    }
    if (providerConfig.apiVersion) {
      lines.push(
        `${Locale.Chat.ProviderTooltip.ApiVersion}: ${providerConfig.apiVersion}`,
      );
    }
    if (providerConfig.apiKey) {
      const keyLength = providerConfig.apiKey.length;
      const maskedKey =
        keyLength > 8
          ? `${providerConfig.apiKey.substring(
              0,
              4,
            )}...${providerConfig.apiKey.substring(keyLength - 4)}`
          : "****";
      lines.push(`${Locale.Chat.ProviderTooltip.ApiKey}: ${maskedKey}`);
    }
    return lines;
  };

  return (
    <span
      ref={wrapperRef}
      className={styles["provider-tooltip-wrapper"]}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleClick}
    >
      {children}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={styles["provider-tooltip"]}
          style={tooltipStyle}
        >
          {getTooltipContent().map((line, index) => (
            <div key={index}>{line}</div>
          ))}
          <div className={styles["provider-tooltip-hint"]}>
            {Locale.Chat.ProviderTooltip.ClickToConfig}
          </div>
        </div>
      )}
    </span>
  );
}
