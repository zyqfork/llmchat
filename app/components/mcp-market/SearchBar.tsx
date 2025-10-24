/**
 * MCP Market 搜索栏 - 带防抖优化
 */
import React, { useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "../mcp-market.module.scss";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = React.memo(function SearchBar(props: SearchBarProps) {
  const { value, onChange, placeholder } = props;

  // 防抖搜索 - 300ms 延迟
  const debouncedOnChange = useDebouncedCallback((value: string) => {
    onChange(value);
  }, 300);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedOnChange(e.target.value);
    },
    [debouncedOnChange],
  );

  return (
    <div className={styles["search-bar"]}>
      <input
        type="text"
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder || "搜索服务器..."}
        className={styles["search-input"]}
      />
    </div>
  );
});
