import React, { useRef } from "react";
import { Modal, showModal } from "./ui-lib";
import { IconButton } from "./button";
import { HTMLPreview, HTMLPreviewHander } from "./artifacts";
import EyeIcon from "../icons/eye.svg";

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
            height: "80vh",
            minHeight: "500px",
            width: "100%",
          }}
        >
          <HTMLPreview
            ref={previewRef}
            code={props.code}
            autoHeight={false}
            height="100%"
          />
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
      style={{ marginLeft: "10px" }}
    />
  );
});
