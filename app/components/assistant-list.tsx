import React from "react";
import styles from "./home.module.scss";
import { IconButton } from "./button";
import { Modal } from "./ui-lib";
import AddIcon from "../icons/add.svg";
import SettingsIcon from "../icons/settings.svg";
import { useChatStore } from "../store";
import { useMaskStore } from "../store/mask";
import { useAppConfig } from "../store/config";
import { MaskAvatar } from "./mask";
import Locale, { ALL_LANG_OPTIONS } from "../locales";
import { Path } from "../constant";
import { useNavigate } from "react-router-dom";

interface MaskListProps {
  onClose: () => void;
}

export function MaskList(props: MaskListProps) {
  const chatStore = useChatStore();
  const maskStore = useMaskStore();
  const appConfig = useAppConfig();
  const navigate = useNavigate();

  // 获取所有可用的面具，默认面具排在最前面
  const allMasks = maskStore.getAll().sort((a, b) => {
    if (a.id === "default-mask") return -1;
    if (b.id === "default-mask") return 1;
    return 0;
  });

  const currentMaskId = chatStore.currentMaskId;

  // 获取面具应该显示的模型
  const getDisplayModel = (mask: any) => {
    console.log(`getDisplayModel调用 - 面具: ${mask.name}`);
    console.log(`  - mask.defaultModel: "${mask.defaultModel}"`);
    console.log(`  - mask.defaultModel类型: ${typeof mask.defaultModel}`);
    console.log(`  - !!mask.defaultModel: ${!!mask.defaultModel}`);
    console.log(
      `  - appConfig.modelConfig.model: "${appConfig.modelConfig.model}"`,
    );

    // 如果面具设置了默认模型，使用默认模型
    if (mask.defaultModel) {
      console.log(`  - 返回面具默认模型: ${mask.defaultModel}`);
      return mask.defaultModel;
    }
    // 如果没有设置默认模型，使用全局默认模型
    console.log(`  - 返回全局默认模型: ${appConfig.modelConfig.model}`);
    return appConfig.modelConfig.model;
  };

  // 调试日志：输出面具列表信息
  console.log("=== 面具列表调试信息 ===");
  console.log("完整的appConfig:", appConfig);
  console.log("appConfig.modelConfig:", appConfig.modelConfig);
  console.log(`全局默认模型: ${appConfig.modelConfig.model}`);
  console.log("getDisplayModel函数测试:");

  allMasks.forEach((mask, index) => {
    const displayModel = getDisplayModel(mask);
    console.log(`面具 ${index + 1}: ${mask.name} (ID: ${mask.id})`);
    console.log(`  - defaultModel: ${mask.defaultModel || "未设置"}`);
    console.log(`  - modelConfig.model: ${mask.modelConfig.model}`);
    console.log(`  - mask.defaultModel存在: ${!!mask.defaultModel}`);
    console.log(
      `  - appConfig.modelConfig.model: ${appConfig.modelConfig.model}`,
    );
    console.log(`  - getDisplayModel返回: ${displayModel}`);
    console.log(`  - 语言: ${mask.lang}`);
    console.log(`  - 预设对话数: ${mask.context.length}`);
    console.log(`  - 是否内置: ${mask.builtin}`);
    console.log(`  - 创建时间: ${new Date(mask.createdAt).toLocaleString()}`);
    console.log("---");
  });

  const handleSelectMask = (maskId: string) => {
    // 选择面具
    chatStore.selectMask(maskId);

    // 检查该面具下是否有话题
    const maskSessions = chatStore.getSessionsByMask(maskId);
    if (maskSessions.length === 0) {
      // 如果没有话题，创建一个新话题
      const selectedMask = allMasks.find((m) => m.id === maskId);
      if (selectedMask) {
        console.log("=== 创建新对话调试信息 ===");
        console.log(`选中面具: ${selectedMask.name} (ID: ${selectedMask.id})`);
        console.log(
          `面具 defaultModel: ${selectedMask.defaultModel || "未设置"}`,
        );
        console.log(
          `面具 modelConfig.model: ${selectedMask.modelConfig.model}`,
        );
        console.log(
          `将要使用的模型: ${
            selectedMask.defaultModel || selectedMask.modelConfig.model
          }`,
        );
        console.log("面具完整信息:", selectedMask);

        // 使用该面具创建新session
        chatStore.newSession(selectedMask);
        // 导航到聊天页面
        navigate("/chat");
      }
    } else {
      // 如果有话题，切换到最新的话题（按创建时间排序的第一个）
      const latestSession = maskSessions.sort(
        (a, b) => b.lastUpdate - a.lastUpdate,
      )[0];
      const sessionIndex = chatStore.sessions.findIndex(
        (s) => s.id === latestSession.id,
      );
      if (sessionIndex !== -1) {
        chatStore.selectSession(sessionIndex);
        // 导航到聊天页面
        navigate("/chat");
      }
    }

    props.onClose();
  };

  const handleCreateMask = () => {
    // 跳转到面具创建页面
    navigate(Path.Masks);
    props.onClose();
  };

  const handleMaskManagement = () => {
    // 跳转到面具管理页面
    navigate(Path.Masks);
    props.onClose();
  };

  return (
    <div
      className="modal-mask"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className={styles["mask-list-modal-container"]}>
        <Modal
          title={Locale.Mask.Name}
          onClose={props.onClose}
          actions={[
            <IconButton
              key="manage"
              icon={<SettingsIcon />}
              text="面具管理"
              onClick={handleMaskManagement}
              bordered
            />,
            <IconButton
              key="add"
              icon={<AddIcon />}
              text="新建面具"
              onClick={handleCreateMask}
              bordered
            />,
          ]}
        >
          <div className={styles["mask-list-content"]}>
            {allMasks.map((mask) => (
              <div
                key={mask.id}
                className={`${styles["mask-item"]} ${
                  currentMaskId === mask.id ? styles["mask-item-selected"] : ""
                }`}
                onClick={() => handleSelectMask(mask.id)}
              >
                <div className={styles["mask-item-avatar"]}>
                  <MaskAvatar
                    avatar={mask.avatar}
                    model={getDisplayModel(mask)}
                  />
                </div>
                <div className={styles["mask-item-info"]}>
                  <div className={styles["mask-item-name"]}>{mask.name}</div>
                  <div className={styles["mask-item-desc"]}>
                    {`${Locale.Mask.Item.Info(mask.context.length)} / ${
                      ALL_LANG_OPTIONS[mask.lang]
                    } / ${getDisplayModel(mask)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </div>
  );
}
