import React from "react";
import LoadingIcon from "../../icons/loading.svg";
import Locale from "../../locales";
import styles from "../chat.module.scss";

export function CompressedContextDivider(props: { loading?: boolean }) {
  return (
    <div className={styles["compressed-context-banner"]}>
      <div className={styles["compressed-context-tips"]}>
        {props.loading ? Locale.Context.Compressing : Locale.Context.Compressed}
      </div>
      {props.loading && (
        <div className={styles["compressed-context-loading"]}>
          <LoadingIcon />
        </div>
      )}
    </div>
  );
}
