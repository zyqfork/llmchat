import React, { useRef } from "react";
import { Modal, showModal, FullScreen } from "./ui-lib";
import { IconButton } from "./button";
import { HTMLPreview, HTMLPreviewHander } from "./artifacts";
import EyeIcon from "../icons/eye.svg";
import ReloadButtonIcon from "../icons/reload.svg";

export interface HTMLPreviewModalProps {
  code: string;
  title?: string;
}

export const HTMLPreviewModal = React.forwardRef<
  HTMLPreviewHander,
  HTMLPreviewModalProps
>(function HTMLPreviewModal(props, ref) {
  const previewRef = useRef<HTMLPreviewHander>(null);

  const handleOpenModal = () => {
    showModal({
      title: props.title || "HTML 预览",
      defaultMax: true,
      children: (
        <div
          style={{
            height: "calc(100vh - 140px)",
            minHeight: "400px",
            width: "100%",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <FullScreen
            className="no-dark html"
            right={80}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* 浮动按钮容器 */}
            <div
              style={{
                position: "absolute",
                right: 20,
                top: 10,
                zIndex: 1000,
                display: "flex",
                gap: "10px",
              }}
            >
              <IconButton
                bordered
                icon={<ReloadButtonIcon />}
                shadow
                onClick={() => previewRef.current?.reload()}
                title="刷新预览"
              />
              c{" "}
            </div>
            {/* 内容容器 - 占据全部空间 */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <HTMLPreview
                ref={previewRef}
                code={props.code}
                autoHeight={true}
                height="100%"
              />
            </div>
          </FullScreen>
        </div>
      ),
    });
  };

  return (
    <IconButton
      icon={<EyeIcon />}
      onClick={handleOpenModal}
      bordered
      shadow
      title="弹窗查看"
    />
  );
});
