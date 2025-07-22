import React, { useState, useRef, useEffect } from "react";
import styles from "./model-capability-icons.module.scss";

// Tooltip组件，支持动态定位
function CapabilityTooltip({
  show,
  text,
  targetRef,
}: {
  show: boolean;
  text: string;
  targetRef: React.RefObject<HTMLDivElement>;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (show && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8, // 在图标上方8px
        left: rect.left + rect.width / 2, // 水平居中
      });
    }
  }, [show, targetRef]);

  if (!show) return null;

  return (
    <div
      className={styles["capability-tooltip"]}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {text}
    </div>
  );
}

// 视觉能力图标
export function VisionIcon({
  size = 16,
  colorful = false,
}: {
  size?: number;
  colorful?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={wrapperRef}
        className={`${styles["capability-icon-wrapper"]} no-dark`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`${styles["capability-icon"]} ${
            colorful ? styles["colorful"] : ""
          }`}
          data-capability="vision"
        >
          <path
            d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
            fill="currentColor"
          />
        </svg>
      </div>
      <CapabilityTooltip
        show={showTooltip}
        text="视觉能力"
        targetRef={wrapperRef}
      />
    </>
  );
}

// 联网能力图标
export function WebIcon({
  size = 16,
  colorful = false,
}: {
  size?: number;
  colorful?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={wrapperRef}
        className={`${styles["capability-icon-wrapper"]} no-dark`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`${styles["capability-icon"]} ${
            colorful ? styles["colorful"] : ""
          }`}
          data-capability="web"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            fill="currentColor"
          />
        </svg>
      </div>
      <CapabilityTooltip
        show={showTooltip}
        text="联网能力"
        targetRef={wrapperRef}
      />
    </>
  );
}

// 推理能力图标
export function ReasoningIcon({
  size = 16,
  colorful = false,
}: {
  size?: number;
  colorful?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={wrapperRef}
        className={`${styles["capability-icon-wrapper"]} no-dark`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`${styles["capability-icon"]} ${
            colorful ? styles["colorful"] : ""
          }`}
          data-capability="reasoning"
        >
          <path
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M12 6.5c3.5 0 6.5 1.5 6.5 4.5s-3 4.5-6.5 4.5-6.5-1.5-6.5-4.5 3-4.5 6.5-4.5z"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
          />
        </svg>
      </div>
      <CapabilityTooltip
        show={showTooltip}
        text="推理能力"
        targetRef={wrapperRef}
      />
    </>
  );
}

// 工具能力图标
export function ToolIcon({
  size = 16,
  colorful = false,
}: {
  size?: number;
  colorful?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={wrapperRef}
        className={`${styles["capability-icon-wrapper"]} no-dark`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={`${styles["capability-icon"]} ${
            colorful ? styles["colorful"] : ""
          }`}
          data-capability="tools"
        >
          <path
            d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"
            fill="currentColor"
          />
        </svg>
      </div>
      <CapabilityTooltip
        show={showTooltip}
        text="工具能力"
        targetRef={wrapperRef}
      />
    </>
  );
}

// 能力图标容器组件
export function ModelCapabilityIcons({
  capabilities,
  size = 16,
  colorful = false,
}: {
  capabilities: {
    vision?: boolean;
    web?: boolean;
    reasoning?: boolean;
    tools?: boolean;
  };
  size?: number;
  colorful?: boolean;
}) {
  return (
    <div className={styles["capability-icons"]}>
      {capabilities.vision && <VisionIcon size={size} colorful={colorful} />}
      {capabilities.web && <WebIcon size={size} colorful={colorful} />}
      {capabilities.reasoning && (
        <ReasoningIcon size={size} colorful={colorful} />
      )}
      {capabilities.tools && <ToolIcon size={size} colorful={colorful} />}
    </div>
  );
}
