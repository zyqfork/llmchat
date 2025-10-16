/* eslint-disable @next/next/no-img-element */
import styles from "./ui-lib.module.scss";
import LoadingIcon from "../icons/three-dots.svg";
import CloseIcon from "../icons/close.svg";
import EyeIcon from "../icons/eye.svg";
import EyeOffIcon from "../icons/eye-off.svg";
import DownIcon from "../icons/down.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";

import Locale from "../locales";

import Image from "next/image";

import { createRoot } from "react-dom/client";
import React, {
  CSSProperties,
  HTMLProps,
  MouseEvent,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { IconButton } from "./button";
import { Avatar } from "./emoji";
import clsx from "clsx";

export function Popover(props: {
  children: JSX.Element;
  content: JSX.Element;
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className={styles.popover}>
      {props.children}
      {props.open && (
        <div className={styles["popover-mask"]} onClick={props.onClose}></div>
      )}
      {props.open && (
        <div className={styles["popover-content"]}>{props.content}</div>
      )}
    </div>
  );
}

export function Card(props: { children: JSX.Element[]; className?: string }) {
  return (
    <div className={clsx(styles.card, props.className)}>{props.children}</div>
  );
}

export function ListItem(props: {
  title?: string;
  subTitle?: string | JSX.Element;
  children?: JSX.Element | JSX.Element[];
  icon?: JSX.Element;
  className?: string;
  onClick?: (e: MouseEvent) => void;
  vertical?: boolean;
}) {
  return (
    <div
      className={clsx(
        styles["list-item"],
        {
          [styles["vertical"]]: props.vertical,
        },
        props.className,
      )}
      onClick={props.onClick}
    >
      <div className={styles["list-header"]}>
        {props.icon && <div className={styles["list-icon"]}>{props.icon}</div>}
        <div className={styles["list-item-title"]}>
          <div>{props.title}</div>
          {props.subTitle && (
            <div className={styles["list-item-sub-title"]}>
              {props.subTitle}
            </div>
          )}
        </div>
      </div>
      {props.children}
    </div>
  );
}

export function List(props: { children: React.ReactNode; id?: string }) {
  return (
    <div className={styles.list} id={props.id}>
      {props.children}
    </div>
  );
}

export function Loading() {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoadingIcon />
    </div>
  );
}

interface ModalProps {
  title: string;
  children?: any;
  actions?: React.ReactNode[];
  defaultMax?: boolean;
  footer?: React.ReactNode;
  onClose?: () => void;
}
export function Modal(props: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isMax, setMax] = useState(!!props.defaultMax);

  return (
    <div
      className={clsx(styles["modal-container"], {
        [styles["modal-container-max"]]: isMax,
      })}
    >
      <div className={styles["modal-header"]}>
        <div className={styles["modal-title"]}>{props.title}</div>

        <div className={styles["modal-header-actions"]}>
          <div
            className={styles["modal-header-action"]}
            onClick={() => setMax(!isMax)}
          >
            {isMax ? <MinIcon /> : <MaxIcon />}
          </div>
          <div
            className={styles["modal-header-action"]}
            onClick={props.onClose}
          >
            <CloseIcon />
          </div>
        </div>
      </div>

      <div className={styles["modal-content"]}>{props.children}</div>

      <div className={styles["modal-footer"]}>
        {props.footer}
        <div className={styles["modal-actions"]}>
          {props.actions?.map((action, i) => (
            <div key={i} className={styles["modal-action"]}>
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function showModal(props: ModalProps) {
  const div = document.createElement("div");
  div.className = "modal-mask";
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    props.onClose?.();
    root.unmount();
    div.remove();
  };

  div.onclick = (e) => {
    if (e.target === div) {
      closeModal();
    }
  };

  root.render(<Modal {...props} onClose={closeModal}></Modal>);
}

export type ToastProps = {
  content: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  onClose?: () => void;
};

export function Toast(props: ToastProps) {
  return (
    <div className={styles["toast-container"]}>
      <div className={styles["toast-content"]}>
        <span>{props.content}</span>
        {props.action && (
          <button
            onClick={() => {
              props.action?.onClick?.();
              props.onClose?.();
            }}
            className={styles["toast-action"]}
          >
            {props.action.text}
          </button>
        )}
      </div>
    </div>
  );
}

export function showToast(
  content: string,
  action?: ToastProps["action"],
  delay = 3000,
) {
  const div = document.createElement("div");
  div.className = styles.show;
  document.body.appendChild(div);

  const root = createRoot(div);
  const close = () => {
    div.classList.add(styles.hide);

    setTimeout(() => {
      root.unmount();
      div.remove();
    }, 300);
  };

  setTimeout(() => {
    close();
  }, delay);

  root.render(<Toast content={content} action={action} onClose={close} />);
}

export type InputProps = React.HTMLProps<HTMLTextAreaElement> & {
  autoHeight?: boolean;
  rows?: number;
};

export function Input(props: InputProps) {
  return (
    <textarea
      {...props}
      className={clsx(styles["input"], props.className)}
    ></textarea>
  );
}

export function PasswordInput(
  props: HTMLProps<HTMLInputElement> & { "aria-label"?: string },
) {
  const [visible, setVisible] = useState(false);
  function changeVisibility() {
    setVisible(!visible);
  }

  return (
    <div className={"password-input-container"}>
      <IconButton
        aria-label={props["aria-label"]}
        icon={visible ? <EyeIcon /> : <EyeOffIcon />}
        onClick={changeVisibility}
        className={"password-eye"}
      />
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={"password-input"}
      />
    </div>
  );
}

export function Select(
  props: React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement> & {
      align?: "left" | "center";
    },
    HTMLSelectElement
  >,
) {
  const { className, children, align, ...otherProps } = props;
  return (
    <div
      className={clsx(
        styles["select-with-icon"],
        {
          [styles["left-align-option"]]: align === "left",
        },
        className,
      )}
    >
      <select className={styles["select-with-icon-select"]} {...otherProps}>
        {children}
      </select>
      <DownIcon className={styles["select-with-icon-icon"]} />
    </div>
  );
}

export function showConfirm(content: any) {
  const div = document.createElement("div");
  div.className = "modal-mask";
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    root.unmount();
    div.remove();
  };

  return new Promise<boolean>((resolve) => {
    root.render(
      <Modal
        title={Locale.UI.Confirm}
        actions={[
          <IconButton
            key="cancel"
            text={Locale.UI.Cancel}
            onClick={() => {
              resolve(false);
              closeModal();
            }}
            icon={<CancelIcon />}
            tabIndex={0}
            bordered
            shadow
          ></IconButton>,
          <IconButton
            key="confirm"
            text={Locale.UI.Confirm}
            type="primary"
            onClick={() => {
              resolve(true);
              closeModal();
            }}
            icon={<ConfirmIcon />}
            tabIndex={0}
            autoFocus
            bordered
            shadow
          ></IconButton>,
        ]}
        onClose={closeModal}
      >
        {content}
      </Modal>,
    );
  });
}

function PromptInput(props: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const [input, setInput] = useState(props.value);
  const onInput = (value: string) => {
    props.onChange(value);
    setInput(value);
  };

  return (
    <textarea
      className={styles["modal-input"]}
      autoFocus
      value={input}
      onInput={(e) => onInput(e.currentTarget.value)}
      rows={props.rows ?? 3}
    ></textarea>
  );
}

export function showPrompt(content: any, value = "", rows = 3) {
  const div = document.createElement("div");
  div.className = "modal-mask";
  document.body.appendChild(div);

  const root = createRoot(div);
  const closeModal = () => {
    root.unmount();
    div.remove();
  };

  return new Promise<string>((resolve) => {
    let userInput = value;

    root.render(
      <Modal
        title={content}
        actions={[
          <IconButton
            key="cancel"
            text={Locale.UI.Cancel}
            onClick={() => {
              closeModal();
            }}
            icon={<CancelIcon />}
            bordered
            shadow
            tabIndex={0}
          ></IconButton>,
          <IconButton
            key="confirm"
            text={Locale.UI.Confirm}
            type="primary"
            onClick={() => {
              resolve(userInput);
              closeModal();
            }}
            icon={<ConfirmIcon />}
            bordered
            shadow
            tabIndex={0}
          ></IconButton>,
        ]}
        onClose={closeModal}
      >
        <PromptInput
          onChange={(val) => (userInput = val)}
          value={value}
          rows={rows}
        ></PromptInput>
      </Modal>,
    );
  });
}

export function showImageModal(
  img: string,
  defaultMax?: boolean,
  style?: CSSProperties,
  boxStyle?: CSSProperties,
) {
  showModal({
    title: Locale.Export.Image.Modal,
    defaultMax: defaultMax,
    children: (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: "100%",
          height: "60vh",
          minHeight: "400px",
          ...boxStyle,
        }}
      >
        <Image
          src={img}
          alt="preview"
          fill
          unoptimized
          style={
            style ?? {
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }
          }
        />
      </div>
    ),
  });
}

export function Selector<T>(props: {
  items: Array<{
    title: string;
    subTitle?: string;
    value: T;
    disable?: boolean;
  }>;
  defaultSelectedValue?: T[] | T;
  onSelection?: (selection: T[]) => void;
  onClose?: () => void;
  multiple?: boolean;
}) {
  const [selectedValues, setSelectedValues] = useState<T[]>(
    Array.isArray(props.defaultSelectedValue)
      ? props.defaultSelectedValue
      : props.defaultSelectedValue !== undefined
      ? [props.defaultSelectedValue]
      : [],
  );

  const handleSelection = (e: MouseEvent, value: T) => {
    if (props.multiple) {
      e.stopPropagation();
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(newSelectedValues);
      props.onSelection?.(newSelectedValues);
    } else {
      setSelectedValues([value]);
      props.onSelection?.([value]);
      props.onClose?.();
    }
  };

  return (
    <div className={styles["selector"]} onClick={() => props.onClose?.()}>
      <div className={styles["selector-content"]}>
        <List>
          {props.items.map((item, i) => {
            const selected = selectedValues.includes(item.value);
            return (
              <ListItem
                className={clsx(styles["selector-item"], {
                  [styles["selector-item-disabled"]]: item.disable,
                })}
                key={i}
                title={item.title}
                subTitle={item.subTitle}
                icon={<Avatar model={item.value as string} />}
                onClick={(e) => {
                  if (item.disable) {
                    e.stopPropagation();
                  } else {
                    handleSelection(e, item.value);
                  }
                }}
              >
                {selected ? (
                  <div
                    style={{
                      height: 10,
                      width: 10,
                      backgroundColor: "var(--primary)",
                      borderRadius: 10,
                    }}
                  ></div>
                ) : (
                  <></>
                )}
              </ListItem>
            );
          })}
        </List>
      </div>
    </div>
  );
}

export function ModelSelectorModal<T>(props: {
  groups: Array<{
    groupName: string;
    items: Array<{
      title: string | JSX.Element;
      searchText?: string; // 用于搜索的文本
      subTitle?: string;
      value: T;
      disable?: boolean;
      icon?: JSX.Element;
    }>;
  }>;
  defaultSelectedValue?: T;
  onSelection?: (selection: T) => void;
  onClose?: () => void;
  searchPlaceholder?: string;
}) {
  const [selectedValue, setSelectedValue] = useState<T | undefined>(
    props.defaultSelectedValue,
  );
  const [searchInput, setSearchInput] = useState("");

  const handleSelection = (value: T) => {
    setSelectedValue(value);
    props.onSelection?.(value);
    props.onClose?.();
  };

  // 过滤搜索结果
  const filteredGroups = props.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!searchInput) return true;
        const searchText =
          item.searchText || (typeof item.title === "string" ? item.title : "");
        return (
          searchText.toLowerCase().includes(searchInput.toLowerCase()) ||
          item.subTitle?.toLowerCase().includes(searchInput.toLowerCase())
        );
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className={styles["model-selector-overlay"]} onClick={props.onClose}>
      <div
        className={styles["model-selector-modal"]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className={styles["model-selector-header"]}>
          <h3 className={styles["model-selector-title"]}>
            {Locale.Chat.UI.SelectModel}
          </h3>
          <button
            className={`${styles["model-selector-close"]} no-dark`}
            onClick={props.onClose}
          >
            <CloseIcon />
          </button>
        </div>

        {/* 搜索框 */}
        <div className={styles["model-selector-search"]}>
          <input
            type="text"
            placeholder={props.searchPlaceholder || "搜索模型..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles["model-selector-search-input"]}
          />
        </div>

        {/* 模型列表 */}
        <div className={styles["model-selector-content"]}>
          {filteredGroups.length === 0 ? (
            <div className={styles["model-selector-empty"]}>
              {searchInput ? "未找到匹配的模型" : "暂无可用模型"}
            </div>
          ) : (
            filteredGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={styles["model-selector-group"]}>
                <div className={styles["model-selector-group-title"]}>
                  {group.groupName}
                </div>
                <div className={styles["model-selector-group-items"]}>
                  {group.items.map((item, itemIndex) => {
                    const selected = selectedValue === item.value;
                    return (
                      <div
                        key={itemIndex}
                        className={clsx(styles["model-selector-item"], {
                          [styles["model-selector-item-selected"]]: selected,
                          [styles["model-selector-item-disabled"]]:
                            item.disable,
                        })}
                        onClick={() => {
                          if (!item.disable) {
                            handleSelection(item.value);
                          }
                        }}
                      >
                        <div className={styles["model-selector-item-icon"]}>
                          {item.icon || <Avatar model={item.value as string} />}
                        </div>
                        <div className={styles["model-selector-item-info"]}>
                          <div className={styles["model-selector-item-title"]}>
                            {item.title}
                          </div>
                          {item.subTitle && (
                            <div
                              className={styles["model-selector-item-subtitle"]}
                            >
                              {item.subTitle}
                            </div>
                          )}
                        </div>
                        {selected && (
                          <div className={styles["model-selector-item-check"]}>
                            <ConfirmIcon />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 多选模型选择器
export function MultiModelSelectorModal<T>(props: {
  groups: Array<{
    groupName: string;
    items: Array<{
      title: string | JSX.Element;
      searchText?: string; // 用于搜索的文本
      subTitle?: string;
      value: T;
      disable?: boolean;
      icon?: JSX.Element;
    }>;
  }>;
  defaultSelectedValues?: T[];
  onSelection?: (selections: T[]) => void;
  onClose?: () => void;
  searchPlaceholder?: string;
}) {
  const [selectedValues, setSelectedValues] = useState<T[]>(
    props.defaultSelectedValues || [],
  );
  const [searchInput, setSearchInput] = useState("");

  const handleSelection = (value: T) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    setSelectedValues(newSelectedValues);
  };

  const handleConfirm = () => {
    if (selectedValues.length < 2) {
      return; // 不执行任何操作
    }
    props.onSelection?.(selectedValues);
    props.onClose?.();
  };

  // 过滤搜索结果
  const filteredGroups = props.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!searchInput) return true;
        const searchText =
          item.searchText || (typeof item.title === "string" ? item.title : "");
        return (
          searchText.toLowerCase().includes(searchInput.toLowerCase()) ||
          item.subTitle?.toLowerCase().includes(searchInput.toLowerCase())
        );
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className={styles["model-selector-overlay"]} onClick={props.onClose}>
      <div
        className={styles["model-selector-modal"]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className={styles["model-selector-header"]}>
          <h3 className={styles["model-selector-title"]}>
            选择多个模型 ({selectedValues.length} 个已选择)
          </h3>
          <button
            className={`${styles["model-selector-close"]} no-dark`}
            onClick={props.onClose}
          >
            <CloseIcon />
          </button>
        </div>

        {/* 搜索框 */}
        <div className={styles["model-selector-search"]}>
          <input
            type="text"
            placeholder={props.searchPlaceholder || "搜索模型..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles["model-selector-search-input"]}
          />
        </div>

        {/* 模型列表 */}
        <div className={styles["model-selector-content"]}>
          {filteredGroups.length === 0 ? (
            <div className={styles["model-selector-empty"]}>
              {searchInput ? "未找到匹配的模型" : "暂无可用模型"}
            </div>
          ) : (
            filteredGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={styles["model-selector-group"]}>
                <div className={styles["model-selector-group-title"]}>
                  {group.groupName}
                </div>
                <div className={styles["model-selector-group-items"]}>
                  {group.items.map((item, itemIndex) => {
                    const selected = selectedValues.includes(item.value);
                    return (
                      <div
                        key={itemIndex}
                        className={clsx(styles["model-selector-item"], {
                          [styles["model-selector-item-selected"]]: selected,
                          [styles["model-selector-item-disabled"]]:
                            item.disable,
                        })}
                        onClick={() => {
                          if (!item.disable) {
                            handleSelection(item.value);
                          }
                        }}
                      >
                        <div className={styles["model-selector-item-icon"]}>
                          {item.icon || <Avatar model={item.value as string} />}
                        </div>
                        <div className={styles["model-selector-item-info"]}>
                          <div className={styles["model-selector-item-title"]}>
                            {item.title}
                          </div>
                          {item.subTitle && (
                            <div
                              className={styles["model-selector-item-subtitle"]}
                            >
                              {item.subTitle}
                            </div>
                          )}
                        </div>
                        {selected && (
                          <div className={styles["model-selector-item-check"]}>
                            <ConfirmIcon />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部操作按钮 */}
        <div className={styles["model-selector-footer"]}>
          <button
            className={styles["model-selector-clear"]}
            onClick={() => setSelectedValues([])}
            disabled={selectedValues.length === 0}
          >
            清空选择
          </button>
          <button
            className={styles["model-selector-confirm"]}
            onClick={handleConfirm}
            disabled={selectedValues.length < 2}
          >
            确认选择 ({selectedValues.length})
            {selectedValues.length < 2 && (
              <span className={styles["model-selector-confirm-hint"]}>
                (至少选择2个模型)
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FullScreen(props: any) {
  const { children, right = 10, top = 10, ...rest } = props;
  const ref = useRef<HTMLDivElement>();
  const [fullScreen, setFullScreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      ref.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);
  useEffect(() => {
    const handleScreenChange = (e: any) => {
      if (e.target === ref.current) {
        setFullScreen(!!document.fullscreenElement);
      }
    };
    document.addEventListener("fullscreenchange", handleScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleScreenChange);
    };
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }} {...rest}>
      <div style={{ position: "absolute", right, top }}>
        <IconButton
          icon={fullScreen ? <MinIcon /> : <MaxIcon />}
          onClick={toggleFullscreen}
          bordered
        />
      </div>
      {children}
    </div>
  );
}
