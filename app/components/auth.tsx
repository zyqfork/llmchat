import styles from "./auth.module.scss";
import { IconButton } from "./button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Path, SAAS_CHAT_URL } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";
import Delete from "../icons/close.svg";
import Arrow from "../icons/arrow.svg";
import Logo from "../icons/logo.svg";
import { useMobileScreen } from "@/app/utils";
import BotIcon from "../icons/bot.svg";
import { getClientConfig } from "../config/client";
import { PasswordInput, showToast } from "./ui-lib";
import LeftIcon from "@/app/icons/left.svg";
import { safeLocalStorage } from "@/app/utils";
import {
  trackSettingsPageGuideToCPaymentClick,
  trackAuthorizationPageButtonToCPaymentClick,
} from "../utils/auth-settings-events";
import clsx from "clsx";

const storage = safeLocalStorage();

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  const [isVerifying, setIsVerifying] = useState(false);

  const goHome = () => navigate(Path.Home);
  const goChat = () => navigate(Path.Chat);
  const goSaas = () => {
    trackAuthorizationPageButtonToCPaymentClick();
    window.location.href = SAAS_CHAT_URL;
  };

  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
    });
  }; // Reset access code to empty string

  // 验证访问码
  const verifyAccessCode = async () => {
    if (isVerifying) return;

    setIsVerifying(true);

    try {
      // 检查是否有服务器端访问码（环境变量设置）
      if (accessStore.hasServerAccessCode) {
        if (!accessStore.accessCode) {
          showToast("请输入访问码");
          setIsVerifying(false);
          return;
        }

        const isValid = await accessStore.verifyServerAccessCode(
          accessStore.accessCode,
        );
        if (isValid) {
          // 验证成功后，获取服务器端配置
          await accessStore.fetchServerConfig(accessStore.accessCode);
          showToast("访问码验证成功");
          goChat();
        } else {
          showToast("访问码错误，请重新输入");
          // 验证失败时不退出界面，只是清空输入框
          accessStore.update((access) => (access.accessCode = ""));
        }
        setIsVerifying(false);
        return;
      }

      // 如果没有设置环境变量访问码，直接进入
      goChat();
    } catch (error) {
      console.error("访问码验证失败:", error);
      showToast("验证失败，请重试");
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-header"]}>
        <IconButton
          icon={<LeftIcon />}
          text={Locale.Auth.Return}
          onClick={() => navigate(Path.Home)}
        ></IconButton>
      </div>
      <div className={clsx("no-dark", styles["auth-logo"])}>
        <BotIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>
        {accessStore.hasServerAccessCode
          ? "请输入访问码以继续使用系统"
          : Locale.Auth.Tips}
      </div>

      {/* 只在访问码模式下显示访问码输入框 */}
      {accessStore.hasServerAccessCode ? (
        <PasswordInput
          style={{ marginTop: "3vh", marginBottom: "3vh" }}
          aria-label="访问码"
          value={accessStore.accessCode}
          type="text"
          placeholder="请输入访问码"
          onChange={(e) => {
            accessStore.updateAccessCode(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isVerifying) {
              verifyAccessCode();
            }
          }}
        />
      ) : (
        <>
          <PasswordInput
            style={{ marginTop: "3vh", marginBottom: "3vh" }}
            aria-label={Locale.Auth.Input}
            value={accessStore.accessCode}
            type="text"
            placeholder={Locale.Auth.Input}
            onChange={(e) => {
              accessStore.updateAccessCode(e.currentTarget.value);
            }}
          />

          {!accessStore.hideUserApiKey ? (
            <>
              <div className={styles["auth-tips"]}>{Locale.Auth.SubTips}</div>
              <PasswordInput
                style={{ marginTop: "3vh", marginBottom: "3vh" }}
                aria-label={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
                value={accessStore.openaiApiKey}
                type="text"
                placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
                onChange={(e) => {
                  accessStore.update(
                    (access) => (access.openaiApiKey = e.currentTarget.value),
                  );
                }}
              />
              <PasswordInput
                style={{ marginTop: "3vh", marginBottom: "3vh" }}
                aria-label={Locale.Settings.Access.Google.ApiKey.Placeholder}
                value={accessStore.googleApiKey}
                type="text"
                placeholder={Locale.Settings.Access.Google.ApiKey.Placeholder}
                onChange={(e) => {
                  accessStore.update(
                    (access) => (access.googleApiKey = e.currentTarget.value),
                  );
                }}
              />
            </>
          ) : null}
        </>
      )}

      <div className={styles["auth-actions"]}>
        {accessStore.hasServerAccessCode ? (
          // 访问码模式：只显示验证按钮
          <IconButton
            text={isVerifying ? "验证中..." : "验证访问码"}
            type="primary"
            onClick={verifyAccessCode}
            disabled={isVerifying}
          />
        ) : (
          // 原有模式：显示确认和SaaS按钮
          <>
            <IconButton
              text={isVerifying ? "验证中..." : Locale.Auth.Confirm}
              type="primary"
              onClick={verifyAccessCode}
              disabled={isVerifying}
            />
            <IconButton
              text={Locale.Auth.SaasTips}
              onClick={() => {
                goSaas();
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
