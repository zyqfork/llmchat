/* eslint-disable @next/next/no-img-element */
import { ChatMessage, useAppConfig, useChatStore } from "../store";
import Locale from "../locales";
import styles from "./exporter.module.scss";
import Image from "next/image";
import {
  List,
  ListItem,
  Modal,
  Select,
  showImageModal,
  showModal,
  showToast,
} from "./ui-lib";
import { IconButton } from "./button";
import {
  copyToClipboard,
  downloadAs,
  getMessageImages,
  useMobileScreen,
} from "../utils";

import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import ShareIcon from "../icons/share.svg";

import DownloadIcon from "../icons/download.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSelector, useMessageSelector } from "./message-selector";
import { Avatar } from "./emoji";
import dynamic from "next/dynamic";

import { toBlob, toPng } from "html-to-image";

import { prettyObject } from "../utils/format";
import { EXPORT_MESSAGE_CLASS_NAME } from "../constant";
import { getClientConfig } from "../config/client";
import { type ClientApi, getClientApi } from "../client/api";
import {
  getMessageTextContent,
  getMessageTextContentWithoutThinking,
} from "../utils";
import { MaskAvatar } from "./mask";
import { getMaskEffectiveModel } from "../utils/model-resolver";
import clsx from "clsx";
import { logger } from "../utils/logger";

// 模型图标 SVG 字符串（用于打印功能）
const MODEL_ICON_SVGS: Record<string, string> = {
  openai: `<svg fill="#333" fill-rule="evenodd" height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><path d="M21.55 10.004a5.416 5.416 0 00-.478-4.501c-1.217-2.09-3.662-3.166-6.05-2.66A5.59 5.59 0 0010.831 1C8.39.995 6.224 2.546 5.473 4.838A5.553 5.553 0 001.76 7.496a5.487 5.487 0 00.691 6.5 5.416 5.416 0 00.477 4.502c1.217 2.09 3.662 3.165 6.05 2.66A5.586 5.586 0 0013.168 23c2.443.006 4.61-1.546 5.361-3.84a5.553 5.553 0 003.715-2.66 5.488 5.488 0 00-.693-6.497v.001zm-8.381 11.558a4.199 4.199 0 01-2.675-.954c.034-.018.093-.05.132-.074l4.44-2.53a.71.71 0 00.364-.623v-6.176l1.877 1.069c.02.01.033.029.036.05v5.115c-.003 2.274-1.87 4.118-4.174 4.123zM4.192 17.78a4.059 4.059 0 01-.498-2.763c.032.02.09.055.131.078l4.44 2.53c.225.13.504.13.73 0l5.42-3.088v2.138a.068.068 0 01-.027.057L9.9 19.288c-1.999 1.136-4.552.46-5.707-1.51h-.001zM3.023 8.216A4.15 4.15 0 015.198 6.41l-.002.151v5.06a.711.711 0 00.364.624l5.42 3.087-1.876 1.07a.067.067 0 01-.063.005l-4.489-2.559c-1.995-1.14-2.679-3.658-1.53-5.63h.001zm15.417 3.54l-5.42-3.088L14.896 7.6a.067.067 0 01.063-.006l4.489 2.557c1.998 1.14 2.683 3.662 1.529 5.633a4.163 4.163 0 01-2.174 1.807V12.38a.71.71 0 00-.363-.623zm1.867-2.773a6.04 6.04 0 00-.132-.078l-4.44-2.53a.731.731 0 00-.729 0l-5.42 3.088V7.325a.068.068 0 01.027-.057L14.1 4.713c2-1.137 4.555-.46 5.707 1.513.487.833.664 1.809.499 2.757h.001zm-11.741 3.81l-1.877-1.068a.065.065 0 01-.036-.051V6.559c.001-2.277 1.873-4.122 4.181-4.12.976 0 1.92.338 2.671.954-.034.018-.092.05-.131.073l-4.44 2.53a.71.71 0 00-.365.623l-.003 6.173v.002zm1.02-2.168L12 9.25l2.414 1.375v2.75L12 14.75l-2.415-1.375v-2.75z"></path></g></svg>`,
  claude: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fill-rule="nonzero"></path></g></svg>`,
  deepseek: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(4, 4)"><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" fill="#4D6BFE"></path></g></svg>`,
  gemini: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="url(#gemini_gradient)"/><defs><radialGradient id="gemini_gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12 12) rotate(90) scale(12)"><stop stop-color="#1BA1E3"/><stop offset=".3" stop-color="#5489D6"/><stop offset=".55" stop-color="#9B72CB"/><stop offset=".75" stop-color="#D96570"/><stop offset="1" stop-color="#F49C46"/></radialGradient></defs></g></svg>`,
  qwen: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><circle cx="12" cy="12" r="12" fill="#615EF0"/><path d="M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="#fff"/></g></svg>`,
  doubao: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><circle cx="12" cy="12" r="12" fill="#00D6B9"/><path d="M8 8h8v8H8z" fill="#fff"/></g></svg>`,
  moonshot: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><circle cx="12" cy="12" r="12" fill="#000"/><path d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" fill="#fff"/></g></svg>`,
  meta: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><circle cx="12" cy="12" r="12" fill="#0668E1"/><path d="M7 17V7h2l3 6 3-6h2v10h-2v-6l-2 4h-2l-2-4v6H7z" fill="#fff"/></g></svg>`,
  grok: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><circle cx="12" cy="12" r="12" fill="#000"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">X</text></g></svg>`,
  mistral: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><rect width="24" height="24" fill="#F7931E" rx="4"/><path d="M6 6h4v4H6zM14 6h4v4h-4zM6 14h4v4H6zM14 14h4v4h-4z" fill="#fff"/></g></svg>`,
  ollama: `<svg height="36" viewBox="0 0 30 30" width="36" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="30" fill="#E7F8FF" rx="6"/><g transform="translate(3, 3)"><circle cx="12" cy="12" r="12" fill="#333"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="8" font-weight="bold">🦙</text></g></svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 30 30"><rect width="30" height="30" fill="#E7F8FF" rx="10"/><g transform="translate(4.77 4.77)"><path fill="#1f948c" d="M19.11 8.37C19.28 7.85 19.37 7.31 19.37 6.76c0-.9-.24-1.79-.71-2.57-1.93-1.6-3.66-2.59-5.53-2.59-.37 0-.73.04-1.09.11C11.06.62 9.65 0 8.17 0h-.03C5.86 0 3.86 1.44 3.16 3.57c-1.46.29-2.72 1.19-3.45 2.47C-.76 6.83-1 7.72-1 8.63c0 1.27.48 2.51 1.35 3.45-.18.52-.27 1.07-.27 1.61 0 .91.25 1.8.71 2.58 1.13 1.94 3.41 2.94 5.63 2.47.98 1.09 2.38 1.71 3.86 1.71h.02c2.26 0 4.27-1.44 4.97-3.57 1.46-.29 2.71-1.19 3.44-2.47.46-.78.7-1.67.7-2.58 0-1.28-.48-2.51-1.34-3.46z"/></g></svg>`,
};

// 根据模型名称获取对应的 SVG 图标字符串
function getModelIconSvg(modelName?: string): string {
  if (!modelName) return MODEL_ICON_SVGS.default;

  const lowerModelName = modelName.toLowerCase();

  if (
    lowerModelName.startsWith("gpt") ||
    lowerModelName.startsWith("chatgpt") ||
    lowerModelName.startsWith("o1") ||
    lowerModelName.startsWith("o3") ||
    lowerModelName.startsWith("o4")
  ) {
    return MODEL_ICON_SVGS.openai;
  }
  if (lowerModelName.startsWith("claude")) {
    return MODEL_ICON_SVGS.claude;
  }
  if (lowerModelName.includes("deepseek")) {
    return MODEL_ICON_SVGS.deepseek;
  }
  if (
    lowerModelName.startsWith("gemini") ||
    lowerModelName.startsWith("learnlm")
  ) {
    return MODEL_ICON_SVGS.gemini;
  }
  if (
    lowerModelName.startsWith("qwen") ||
    lowerModelName.startsWith("qwq") ||
    lowerModelName.startsWith("qvq")
  ) {
    return MODEL_ICON_SVGS.qwen;
  }
  if (lowerModelName.startsWith("doubao") || lowerModelName.startsWith("ep-")) {
    return MODEL_ICON_SVGS.doubao;
  }
  if (
    lowerModelName.startsWith("moonshot") ||
    lowerModelName.startsWith("kimi")
  ) {
    return MODEL_ICON_SVGS.moonshot;
  }
  if (lowerModelName.includes("llama")) {
    return MODEL_ICON_SVGS.meta;
  }
  if (lowerModelName.startsWith("grok")) {
    return MODEL_ICON_SVGS.grok;
  }
  if (
    lowerModelName.startsWith("mixtral") ||
    lowerModelName.startsWith("codestral") ||
    lowerModelName.startsWith("mistral")
  ) {
    return MODEL_ICON_SVGS.mistral;
  }
  if (lowerModelName.startsWith("ollama")) {
    return MODEL_ICON_SVGS.ollama;
  }

  return MODEL_ICON_SVGS.default;
}

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

export function ExportMessageModal(props: { onClose: () => void }) {
  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Export.Title}
        onClose={props.onClose}
        footer={
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontSize: 14,
              opacity: 0.5,
            }}
          >
            {Locale.Exporter.Description.Title}
          </div>
        }
      >
        <div style={{ minHeight: "40vh" }}>
          <MessageExporter />
        </div>
      </Modal>
    </div>
  );
}

function useSteps(
  steps: Array<{
    name: string;
    value: string;
  }>,
) {
  const stepCount = steps.length;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const nextStep = () =>
    setCurrentStepIndex((currentStepIndex + 1) % stepCount);
  const prevStep = () =>
    setCurrentStepIndex((currentStepIndex - 1 + stepCount) % stepCount);

  return {
    currentStepIndex,
    setCurrentStepIndex,
    nextStep,
    prevStep,
    currentStep: steps[currentStepIndex],
  };
}

function Steps<
  T extends {
    name: string;
    value: string;
  }[],
>(props: { steps: T; onStepChange?: (index: number) => void; index: number }) {
  const steps = props.steps;
  const stepCount = steps.length;

  return (
    <div className={styles["steps"]}>
      <div className={styles["steps-progress"]}>
        <div
          className={styles["steps-progress-inner"]}
          style={{
            width: `${((props.index + 1) / stepCount) * 100}%`,
          }}
        ></div>
      </div>
      <div className={styles["steps-inner"]}>
        {steps.map((step, i) => {
          return (
            <div
              key={i}
              className={clsx("clickable", styles["step"], {
                [styles["step-finished"]]: i <= props.index,
                [styles["step-current"]]: i === props.index,
              })}
              onClick={() => {
                props.onStepChange?.(i);
              }}
              role="button"
            >
              <span className={styles["step-index"]}>{i + 1}</span>
              <span className={styles["step-name"]}>{step.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MessageExporter() {
  const steps = [
    {
      name: Locale.Export.Steps.Select,
      value: "select",
    },
    {
      name: Locale.Export.Steps.Preview,
      value: "preview",
    },
  ];
  const { currentStep, setCurrentStepIndex, currentStepIndex } =
    useSteps(steps);
  const formats = ["text", "image", "json"] as const;
  type ExportFormat = (typeof formats)[number];

  const [exportConfig, setExportConfig] = useState({
    format: "image" as ExportFormat,
    includeContext: true,
  });

  function updateExportConfig(updater: (config: typeof exportConfig) => void) {
    const config = { ...exportConfig };
    updater(config);
    setExportConfig(config);
  }

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const { selection, updateSelection } = useMessageSelector();
  const selectedMessages = useMemo(() => {
    const ret: ChatMessage[] = [];
    if (exportConfig.includeContext) {
      ret.push(...session.mask.context);
    }
    ret.push(...session.messages.filter((m) => selection.has(m.id)));
    return ret;
  }, [
    exportConfig.includeContext,
    session.messages,
    session.mask.context,
    selection,
  ]);
  function preview() {
    if (exportConfig.format === "text") {
      return (
        <MarkdownPreviewer messages={selectedMessages} topic={session.topic} />
      );
    } else if (exportConfig.format === "json") {
      return (
        <JsonPreviewer messages={selectedMessages} topic={session.topic} />
      );
    } else {
      return (
        <ImagePreviewer messages={selectedMessages} topic={session.topic} />
      );
    }
  }
  return (
    <>
      <Steps
        steps={steps}
        index={currentStepIndex}
        onStepChange={setCurrentStepIndex}
      />
      <div
        className={styles["message-exporter-body"]}
        style={currentStep.value !== "select" ? { display: "none" } : {}}
      >
        <List>
          <ListItem
            title={Locale.Export.Format.Title}
            subTitle={Locale.Export.Format.SubTitle}
          >
            <Select
              value={exportConfig.format}
              onChange={(e) =>
                updateExportConfig(
                  (config) =>
                    (config.format = e.currentTarget.value as ExportFormat),
                )
              }
            >
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </ListItem>
          <ListItem
            title={Locale.Export.IncludeContext.Title}
            subTitle={Locale.Export.IncludeContext.SubTitle}
          >
            <input
              type="checkbox"
              checked={exportConfig.includeContext}
              onChange={(e) => {
                updateExportConfig(
                  (config) => (config.includeContext = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>
        </List>
        <MessageSelector
          selection={selection}
          updateSelection={updateSelection}
          defaultSelectAll
        />
      </div>
      {currentStep.value === "preview" && (
        <div className={styles["message-exporter-body"]}>{preview()}</div>
      )}
    </>
  );
}

export function RenderExport(props: {
  messages: ChatMessage[];
  onRender: (messages: ChatMessage[]) => void;
}) {
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domRef.current) return;
    const dom = domRef.current;
    const messages = Array.from(
      dom.getElementsByClassName(EXPORT_MESSAGE_CLASS_NAME),
    );

    if (messages.length !== props.messages.length) {
      return;
    }

    const renderMsgs = messages.map((v, i) => {
      const [role, _] = v.id.split(":");
      return {
        id: i.toString(),
        role: role as any,
        content: role === "user" ? v.textContent ?? "" : v.innerHTML,
        date: "",
      };
    });

    props.onRender(renderMsgs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={domRef}>
      {props.messages.map((m, i) => (
        <div
          key={i}
          id={`${m.role}:${i}`}
          className={EXPORT_MESSAGE_CLASS_NAME}
        >
          <Markdown
            content={
              m.role === "user"
                ? getMessageTextContent(m)
                : getMessageTextContentWithoutThinking(m)
            }
            defaultShow
            isUserMessage={m.role === "user"}
          />
        </div>
      ))}
    </div>
  );
}

export function PreviewActions(props: {
  download: () => void;
  copy: () => void;
  showCopy?: boolean;
  messages?: ChatMessage[];
}) {
  const [loading, setLoading] = useState(false);

  const print = async () => {
    if (!props.messages?.length) return;

    setLoading(true);

    const session = useChatStore.getState().currentSession();
    const msgs = props.messages;

    // 使用隐藏 iframe 打印，Web 和 Tauri 统一，不弹新窗口
    const isTauri = typeof window !== "undefined" && (window as any).__TAURI__;
    let cleanup: (() => void) | undefined;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "200vw";
    iframe.style.width = "0";
    iframe.style.height = "0";
    document.body.appendChild(iframe);
    cleanup = () => iframe.remove();
    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      cleanup?.();
      showToast("无法打开打印窗口，请检查浏览器设置");
      setLoading(false);
      return;
    }

    // 构建更丰富的打印内容
    const appConfig = useAppConfig.getState();
    const decodeAvatar = (code: string, fallback: string) => {
      if (!code) return fallback;
      if (/^[0-9a-fA-F]+$/.test(code)) {
        const val = parseInt(code, 16);
        if (!Number.isNaN(val)) return String.fromCodePoint(val);
      }
      return code;
    };
    const userAvatar = decodeAvatar(appConfig.avatar as string, "🙂");
    const safeDate = (d?: string) => {
      const dt = d ? new Date(d) : new Date();
      return isNaN(dt.getTime())
        ? new Date().toLocaleString()
        : dt.toLocaleString();
    };
    const headerTime = safeDate(msgs.at(-1)?.date);

    // 多模型消息分组逻辑
    const groupMessages = () => {
      const groups: Array<{
        type: "single" | "multi-assistant";
        messages: typeof msgs;
      }> = [];

      let i = 0;
      while (i < msgs.length) {
        const message = msgs[i];

        // 检查是否是用户消息，且后面跟着多个多模型assistant消息
        if (message.role === "user") {
          // 查找该用户消息后的所有连续的多模型assistant消息
          const assistantMessages: typeof msgs = [];
          let j = i + 1;
          while (
            j < msgs.length &&
            msgs[j].role === "assistant" &&
            msgs[j].isMultiModel
          ) {
            assistantMessages.push(msgs[j]);
            j++;
          }

          // 先添加用户消息
          groups.push({
            type: "single",
            messages: [message],
          });

          // 如果有多个assistant消息，横向分组
          if (assistantMessages.length > 1) {
            groups.push({
              type: "multi-assistant",
              messages: assistantMessages,
            });
            i = j;
          } else if (assistantMessages.length === 1) {
            // 只有一个assistant消息，正常显示
            groups.push({
              type: "single",
              messages: assistantMessages,
            });
            i = j;
          } else {
            i++;
          }
        } else {
          // 非用户消息，正常显示
          groups.push({
            type: "single",
            messages: [message],
          });
          i++;
        }
      }

      return groups;
    };

    const messageGroups = groupMessages();

    // 收集所有使用的模型
    const usedModels = new Set<string>();
    msgs.forEach((msg) => {
      if (msg.role === "assistant" && msg.isMultiModel && msg.modelKey) {
        const [modelName] = msg.modelKey.split("@");
        if (modelName) usedModels.add(modelName);
      }
    });
    const usedModelsArray = Array.from(usedModels);
    const isMultiModelChat = usedModelsArray.length > 1;

    // 计算实际的消息数（多模型的assistant消息算作一组）
    let actualMessageCount = 0;
    messageGroups.forEach((group) => {
      if (group.type === "multi-assistant") {
        actualMessageCount += 1; // 多个模型回复算作一条
      } else {
        actualMessageCount += group.messages.length;
      }
    });

    // 获取消息文本内容的辅助函数
    const getMsgContent = (msg: ChatMessage) => {
      const content = getMessageTextContentWithoutThinking(msg);
      return content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LLMChat 聊天记录</title>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 16px;
              font-family: "Noto Sans", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background: #fff;
              color: #111827;
              line-height: 1.6;
            }
            .container { max-width: 820px; margin: 0 auto; }
            .header {
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .title { font-size: 22px; font-weight: 700; letter-spacing: 0.2px; }
            .meta {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 8px;
              color: #4b5563;
              font-size: 13px;
            }
            .chip {
              padding: 4px 10px;
              border: 1px solid #e5e7eb;
              border-radius: 999px;
              background: #f9fafb;
            }
            .messages { margin-top: 18px; }
            .message {
              display: flex;
              gap: 12px;
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            .message.user { 
              flex-direction: row-reverse;
            }
            .avatar {
              width: 36px;
              height: 36px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              color: #374151;
              flex-shrink: 0;
              overflow: hidden;
            }
            .avatar svg {
              width: 36px;
              height: 36px;
            }
            .user .avatar {
              background: #e5e7eb;
              border-radius: 50%;
            }
            .bubble {
              flex: 1;
              padding: 12px 14px;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              background: #fff;
              font-size: 14px;
              overflow-wrap: break-word;
              word-break: break-word;
            }
            .user .bubble { 
              background: #f3f4f6; 
              text-align: right;
              flex: none;
              max-width: 70%;
            }
            .assistant .bubble { background: #fff; }
            .msg-head {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 8px;
              margin-bottom: 6px;
              color: #4b5563;
              font-size: 12px;
            }
            .user .msg-head {
              flex-direction: row-reverse;
            }
            .role { font-weight: 700; color: #111827; font-size: 13px; }
            .images {
              display: grid;
              gap: 10px;
              margin-top: 10px;
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            }
            .image {
              width: 100%;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              object-fit: contain;
            }
            .footer {
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
              margin-top: 14px;
              color: #6b7280;
              font-size: 12px;
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              align-items: center;
            }
            /* 多模型横向布局样式 */
            .multi-model-container {
              display: flex;
              gap: 12px;
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            .multi-model-column {
              flex: 1;
              min-width: 0;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 10px;
              background: #fff;
            }
            .multi-model-header {
              display: flex;
              align-items: center;
              gap: 8px;
              padding-bottom: 8px;
              margin-bottom: 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            .multi-model-name {
              font-weight: 600;
              font-size: 13px;
              color: #111827;
            }
            .multi-model-provider {
              font-size: 11px;
              color: #3b82f6;
              opacity: 0.8;
            }
            .multi-model-content {
              font-size: 14px;
              line-height: 1.6;
              overflow-wrap: break-word;
              word-break: break-word;
            }
            @media print {
              body { padding: 0; }
              .container { padding: 12px 16px; }
              .message { page-break-inside: avoid; }
              .multi-model-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">LLMChat 聊天记录</div>
              <div class="meta">
                <span class="chip">模型：${
                  isMultiModelChat
                    ? `${usedModelsArray.length}个模型`
                    : getMaskEffectiveModel(session.mask)
                }</span>
                ${
                  isMultiModelChat
                    ? `<span class="chip">模型列表：${usedModelsArray.join(
                        ", ",
                      )}</span>`
                    : ""
                }
                <span class="chip">消息数：${actualMessageCount}</span>
                <span class="chip">主题：${session.topic}</span>
                <span class="chip">时间：${headerTime}</span>
              </div>
            </div>
            
            <div class="messages">
              ${messageGroups
                .map((group) => {
                  if (group.type === "multi-assistant") {
                    // 多模型横向布局
                    return `
                      <div class="multi-model-container">
                        ${group.messages
                          .map((msg) => {
                            const content = getMsgContent(msg);
                            const [modelName, providerId] = (
                              msg.modelKey || ""
                            ).split("@");
                            const images = getMessageImages(msg);
                            const imagesHtml =
                              images.length > 0
                                ? `<div class="images">${images
                                    .map(
                                      (src, idx) =>
                                        `<div style="break-inside: avoid;">
                                          <img class="image" src="${src}" alt="image-${
                                            idx + 1
                                          }" />
                                        </div>`,
                                    )
                                    .join("")}</div>`
                                : "";

                            return `
                              <div class="multi-model-column">
                                <div class="multi-model-header">
                                  <div class="avatar">${getModelIconSvg(
                                    modelName || msg.model,
                                  )}</div>
                                  <div>
                                    <div class="multi-model-name">${
                                      modelName || msg.model || "助手"
                                    }</div>
                                    ${
                                      providerId
                                        ? `<div class="multi-model-provider">@${providerId}</div>`
                                        : ""
                                    }
                                  </div>
                                </div>
                                <div class="multi-model-content">
                                  ${content}
                                </div>
                                ${imagesHtml}
                              </div>
                            `;
                          })
                          .join("")}
                      </div>
                    `;
                  } else {
                    // 单条消息正常显示
                    const msg = group.messages[0];
                    const content = getMsgContent(msg);
                    const isUser = msg.role === "user";
                    const avatar = isUser
                      ? userAvatar
                      : getModelIconSvg(
                          msg.model || getMaskEffectiveModel(session.mask),
                        );
                    const time = safeDate(msg.date);
                    const modelLabel =
                      msg.model ||
                      (!isUser ? getMaskEffectiveModel(session.mask) : "");
                    const images = getMessageImages(msg);
                    const imagesHtml =
                      images.length > 0
                        ? `<div class="images">${images
                            .map(
                              (src, idx) =>
                                `<div style="break-inside: avoid;">
                                  <img class="image" src="${src}" alt="image-${
                                    idx + 1
                                  }" />
                                </div>`,
                            )
                            .join("")}</div>`
                        : "";

                    return `
                      <div class="message ${isUser ? "user" : "assistant"}">
                        <div class="avatar">${avatar}</div>
                        <div class="bubble">
                          <div class="msg-head">
                            <span class="role">${
                              isUser ? "用户" : "助手"
                            }</span>
                            <span>${time}</span>
                            ${
                              modelLabel
                                ? `<span style="color:#6b7280;">${modelLabel}</span>`
                                : ""
                            }
                          </div>
                          <div>${content}</div>
                          ${imagesHtml}
                        </div>
                      </div>
                    `;
                  }
                })
                .join("")}
            </div>
            
            <div class="footer">
              <span>📊 总:${actualMessageCount}</span>
              <span>用户:${msgs.filter((m) => m.role === "user").length}</span>
              <span>助手:${
                msgs.filter((m) => m.role === "assistant").length
              }</span>
              <span>｜ 由 LLMChat 生成</span>
              <span>© ${new Date().getFullYear()}</span>
            </div>
          </div>
        </body>
      </html>
    `;

    // 写入内容并触发打印
    // 安全断言：经过上面逻辑，此时 printWindow 一定存在
    const pw = printWindow as Window;
    pw.document.write(printContent);
    pw.document.close();

    // Tauri 场景下等 iframe 渲染完成再打印
    const doPrint = () => {
      try {
        pw.focus();
        pw.print();
      } catch (err) {
        logger.error("Print failed", err);
        showToast("打印失败，请检查系统打印设置");
      } finally {
        cleanup?.();
        setLoading(false);
      }
    };

    if (isTauri) {
      // 延迟以等待 iframe DOM 渲染
      setTimeout(doPrint, 300);
    } else {
      setTimeout(() => {
        doPrint();
        setTimeout(() => {
          printWindow?.close();
        }, 2000);
      }, 500);
    }
  };

  return (
    <>
      <div className={styles["preview-actions"]}>
        {props.showCopy && (
          <IconButton
            text={Locale.Export.Copy}
            bordered
            shadow
            icon={<CopyIcon />}
            onClick={props.copy}
          ></IconButton>
        )}
        <IconButton
          text={Locale.Export.Download}
          bordered
          shadow
          icon={<DownloadIcon />}
          onClick={props.download}
        ></IconButton>
        <IconButton
          text="打印"
          bordered
          shadow
          icon={loading ? <LoadingIcon /> : <ShareIcon />}
          onClick={print}
        ></IconButton>
      </div>
    </>
  );
}

export function ImagePreviewer(props: {
  messages: ChatMessage[];
  topic: string;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const mask = session.mask;
  const config = useAppConfig();

  const previewRef = useRef<HTMLDivElement>(null);

  // 多模型消息分组逻辑
  const groupMessages = () => {
    const groups: Array<{
      type: "single" | "multi-assistant";
      messages: typeof props.messages;
    }> = [];

    let i = 0;
    while (i < props.messages.length) {
      const message = props.messages[i];

      // 检查是否是用户消息，且后面跟着多个多模型assistant消息
      if (message.role === "user") {
        // 查找该用户消息后的所有连续的多模型assistant消息
        const assistantMessages: typeof props.messages = [];
        let j = i + 1;
        while (
          j < props.messages.length &&
          props.messages[j].role === "assistant" &&
          props.messages[j].isMultiModel
        ) {
          assistantMessages.push(props.messages[j]);
          j++;
        }

        // 先添加用户消息
        groups.push({
          type: "single",
          messages: [message],
        });

        // 如果有多个assistant消息，横向分组
        if (assistantMessages.length > 1) {
          groups.push({
            type: "multi-assistant",
            messages: assistantMessages,
          });
          i = j;
        } else if (assistantMessages.length === 1) {
          // 只有一个assistant消息，正常显示
          groups.push({
            type: "single",
            messages: assistantMessages,
          });
          i = j;
        } else {
          i++;
        }
      } else {
        // 非用户消息，正常显示
        groups.push({
          type: "single",
          messages: [message],
        });
        i++;
      }
    }

    return groups;
  };

  const messageGroups = groupMessages();

  // 收集所有使用的模型
  const usedModels = useMemo(() => {
    const models = new Set<string>();
    props.messages.forEach((msg) => {
      if (msg.role === "assistant" && msg.isMultiModel && msg.modelKey) {
        const [modelName] = msg.modelKey.split("@");
        if (modelName) models.add(modelName);
      }
    });
    return Array.from(models);
  }, [props.messages]);

  // 判断是否是多模型场景
  const isMultiModelChat = usedModels.length > 1;

  // 计算实际的消息数（多模型的assistant消息算作一组）
  const actualMessageCount = useMemo(() => {
    let count = 0;
    messageGroups.forEach((group) => {
      if (group.type === "multi-assistant") {
        count += 1; // 多个模型回复算作一条
      } else {
        count += group.messages.length;
      }
    });
    return count;
  }, [messageGroups]);

  const copy = () => {
    showToast(Locale.Export.Image.Toast);
    const dom = previewRef.current;
    if (!dom) return;
    toBlob(dom, {
      skipFonts: true,
      style: {},
      filter: (node) => {
        if (node instanceof HTMLLinkElement) return false;
        return true;
      },
    }).then((blob) => {
      if (!blob) return;
      try {
        navigator.clipboard
          .write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ])
          .then(() => {
            showToast(Locale.Copy.Success);
            refreshPreview();
          });
      } catch (e) {
        logger.error("[Copy Image] ", e);
        showToast(Locale.Copy.Failed);
      }
    });
  };

  const isMobile = useMobileScreen();

  const download = async () => {
    showToast(Locale.Export.Image.Toast);
    const dom = previewRef.current;
    if (!dom) return;

    const isApp = getClientConfig()?.isApp;

    try {
      const blob = await toPng(dom, {
        // 避免跨域样式（如谷歌字体）读取 cssRules 报 SecurityError
        skipFonts: true,
        // 不内联外部样式，防止 CSP/跨域限制
        style: {},
        filter: (node) => {
          // 过滤掉 link/style 的跨域规则
          if (node instanceof HTMLLinkElement) return false;
          return true;
        },
      });
      if (!blob) return;

      if (isMobile || (isApp && window.__TAURI__)) {
        if (isApp && window.__TAURI__) {
          const { save } = await import("@tauri-apps/plugin-dialog");
          const fs = await import("@tauri-apps/plugin-fs");

          const result = await save({
            defaultPath: `${props.topic}.png`,
            filters: [
              {
                name: "PNG Files",
                extensions: ["png"],
              },
              {
                name: "All Files",
                extensions: ["*"],
              },
            ],
          });

          if (result !== null) {
            const response = await fetch(blob);
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            await fs.writeFile(result, uint8Array);
            showToast(Locale.Download.Success);
          } else {
            showToast(Locale.Download.Failed);
          }
        } else {
          showImageModal(blob);
        }
      } else {
        const link = document.createElement("a");
        link.download = `${props.topic}.png`;
        link.href = blob;
        link.click();
        refreshPreview();
      }
    } catch (error) {
      showToast(Locale.Download.Failed);
    }
  };

  const refreshPreview = () => {
    const dom = previewRef.current;
    if (dom) {
      dom.innerHTML = dom.innerHTML; // Refresh the content of the preview by resetting its HTML for fix a bug glitching
    }
  };

  return (
    <div className={styles["image-previewer"]}>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={!isMobile}
        messages={props.messages}
      />
      <div
        className={clsx(styles["preview-body"], styles["default-theme"])}
        ref={previewRef}
      >
        <div className={styles["chat-info"]}>
          <div className={styles["chat-info-header"]}>
            <div className={styles["chat-info-brand"]}>
              <ChatGptIcon width={24} height={24} />
              <span className={styles["chat-info-title"]}>LLMChat</span>
            </div>
          </div>
          <div className={styles["chat-info-compact"]}>
            <div className={styles["chat-info-badge"]}>
              <span className={styles["chat-info-icon"]}>🤖</span>
              <span className={styles["chat-info-value"]}>
                {isMultiModelChat
                  ? `${usedModels.length}个模型`
                  : getMaskEffectiveModel(mask)}
              </span>
            </div>
            {isMultiModelChat && (
              <div
                className={styles["chat-info-badge"]}
                title={usedModels.join(", ")}
              >
                <span className={styles["chat-info-icon"]}>📋</span>
                <span className={styles["chat-info-value"]}>
                  {usedModels.length > 2
                    ? `${usedModels.slice(0, 2).join(", ")}...`
                    : usedModels.join(", ")}
                </span>
              </div>
            )}
            <div className={styles["chat-info-badge"]}>
              <span className={styles["chat-info-icon"]}>💬</span>
              <span className={styles["chat-info-value"]}>
                {actualMessageCount}
              </span>
            </div>
            <div className={styles["chat-info-badge"]} title={session.topic}>
              <span className={styles["chat-info-icon"]}>📝</span>
              <span className={styles["chat-info-value"]}>
                {session.topic.length > 15
                  ? session.topic.substring(0, 15) + "..."
                  : session.topic}
              </span>
            </div>
            <div
              className={styles["chat-info-badge"]}
              style={{ whiteSpace: "nowrap" }}
            >
              <span className={styles["chat-info-icon"]}>🕐</span>
              <span className={styles["chat-info-value"]}>
                {new Date(
                  props.messages.at(-1)?.date ?? Date.now(),
                ).toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
        {messageGroups.map((group, groupIndex) => {
          if (group.type === "multi-assistant") {
            // 多模型横向布局
            return (
              <div
                className={styles["multi-model-messages-preview"]}
                key={`group-${groupIndex}`}
              >
                {group.messages.map((m, i) => {
                  const [modelName, providerId] = (m.modelKey || "").split("@");
                  return (
                    <div
                      className={styles["multi-model-column-preview"]}
                      key={i}
                    >
                      <div className={styles["multi-model-header-preview"]}>
                        <div className={styles["avatar"]}>
                          <MaskAvatar
                            avatar={session.mask.avatar}
                            model={
                              m.model ||
                              modelName ||
                              (getMaskEffectiveModel(session.mask) as any)
                            }
                          />
                        </div>
                        <div className={styles["multi-model-info"]}>
                          <div className={styles["multi-model-name-preview"]}>
                            {modelName || m.model || "助手"}
                          </div>
                          {providerId && (
                            <div
                              className={styles["multi-model-provider-preview"]}
                            >
                              @{providerId}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles["body"]}>
                        <Markdown
                          content={getMessageTextContentWithoutThinking(m)}
                          fontSize={config.fontSize}
                          fontFamily={config.fontFamily}
                          defaultShow
                          isUserMessage={false}
                        />
                        {getMessageImages(m).length == 1 && (
                          <div className={styles["message-image-container"]}>
                            <Image
                              src={getMessageImages(m)[0]}
                              alt="message"
                              className={styles["message-image"]}
                              width={1024}
                              height={768}
                              sizes="100vw"
                              style={{ width: "100%", height: "auto" }}
                              unoptimized
                            />
                          </div>
                        )}
                        {getMessageImages(m).length > 1 && (
                          <div
                            className={styles["message-images"]}
                            style={
                              {
                                "--image-count": getMessageImages(m).length,
                              } as React.CSSProperties
                            }
                          >
                            {getMessageImages(m).map((src, imgIndex) => (
                              <div
                                key={imgIndex}
                                className={
                                  styles["message-image-multi-container"]
                                }
                              >
                                <Image
                                  src={src}
                                  alt="message"
                                  className={styles["message-image-multi"]}
                                  width={640}
                                  height={640}
                                  sizes="33vw"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  unoptimized
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else {
            // 单个消息正常显示
            const m = group.messages[0];
            const i = groupIndex;
            return (
              <div
                className={clsx(styles["message"], styles["message-" + m.role])}
                key={i}
              >
                <div className={styles["avatar"]}>
                  {m.role === "user" ? (
                    <Avatar avatar={config.avatar}></Avatar>
                  ) : (
                    <MaskAvatar
                      avatar={session.mask.avatar}
                      model={
                        m.model || (getMaskEffectiveModel(session.mask) as any)
                      }
                    />
                  )}
                </div>

                <div className={styles["body"]}>
                  <Markdown
                    content={
                      m.role === "user"
                        ? getMessageTextContent(m)
                        : getMessageTextContentWithoutThinking(m)
                    }
                    fontSize={config.fontSize}
                    fontFamily={config.fontFamily}
                    defaultShow
                    isUserMessage={m.role === "user"}
                  />
                  {getMessageImages(m).length == 1 && (
                    <div className={styles["message-image-container"]}>
                      <Image
                        key={i}
                        src={getMessageImages(m)[0]}
                        alt="message"
                        className={styles["message-image"]}
                        width={1024}
                        height={768}
                        sizes="100vw"
                        style={{ width: "100%", height: "auto" }}
                        unoptimized
                      />
                    </div>
                  )}
                  {getMessageImages(m).length > 1 && (
                    <div
                      className={styles["message-images"]}
                      style={
                        {
                          "--image-count": getMessageImages(m).length,
                        } as React.CSSProperties
                      }
                    >
                      {getMessageImages(m).map((src, imgIndex) => (
                        <div
                          key={imgIndex}
                          className={styles["message-image-multi-container"]}
                        >
                          <Image
                            src={src}
                            alt="message"
                            className={styles["message-image-multi"]}
                            width={640}
                            height={640}
                            sizes="33vw"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

export function MarkdownPreviewer(props: {
  messages: ChatMessage[];
  topic: string;
}) {
  const mdText =
    `# ${props.topic}\n\n` +
    props.messages
      .map((m) => {
        return m.role === "user"
          ? `## ${Locale.Export.MessageFromYou}:\n${getMessageTextContent(m)}`
          : `## ${
              Locale.Export.MessageFromChatGPT
            }:\n${getMessageTextContentWithoutThinking(m).trim()}`;
      })
      .join("\n\n");

  const copy = () => {
    copyToClipboard(mdText);
  };
  const download = () => {
    downloadAs(mdText, `${props.topic}.md`);
  };
  return (
    <>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={true}
        messages={props.messages}
      />
      <div className="markdown-body">
        <pre className={styles["export-content"]}>{mdText}</pre>
      </div>
    </>
  );
}

export function JsonPreviewer(props: {
  messages: ChatMessage[];
  topic: string;
}) {
  const msgs = {
    messages: [
      {
        role: "system",
        content: `${Locale.FineTuned.Sysmessage} ${props.topic}`,
      },
      ...props.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  };
  const mdText = "```json\n" + JSON.stringify(msgs, null, 2) + "\n```";
  const minifiedJson = JSON.stringify(msgs);

  const copy = () => {
    copyToClipboard(minifiedJson);
  };
  const download = () => {
    downloadAs(JSON.stringify(msgs), `${props.topic}.json`);
  };

  return (
    <>
      <PreviewActions
        copy={copy}
        download={download}
        showCopy={false}
        messages={props.messages}
      />
      <div className="markdown-body" onClick={copy}>
        <Markdown content={mdText} />
      </div>
    </>
  );
}
