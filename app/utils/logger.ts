/**
 * 统一的日志工具
 *
 * 在生产环境中自动禁用调试日志，但保留错误和警告日志
 * 支持日志级别控制和格式化输出
 */

// 判断是否为开发环境
const isDev =
  typeof process !== "undefined"
    ? process.env.NODE_ENV === "development"
    : typeof window !== "undefined"
    ? window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("localhost")
    : false;

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// 当前日志级别（可通过环境变量配置）
const getLogLevel = (): LogLevel => {
  if (typeof process !== "undefined") {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case "DEBUG":
        return LogLevel.DEBUG;
      case "INFO":
        return LogLevel.INFO;
      case "WARN":
        return LogLevel.WARN;
      case "ERROR":
        return LogLevel.ERROR;
      default:
        return isDev ? LogLevel.DEBUG : LogLevel.ERROR;
    }
  }
  return isDev ? LogLevel.DEBUG : LogLevel.ERROR;
};

const currentLogLevel = getLogLevel();

/**
 * 格式化日志消息
 */
function formatMessage(prefix: string, ...args: any[]): [string, ...any[]] {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${prefix}]`, ...args];
}

/**
 * 日志工具类
 */
export const logger = {
  /**
   * 调试日志 - 仅在开发环境输出
   */
  debug: (...args: any[]): void => {
    if (currentLogLevel <= LogLevel.DEBUG && isDev) {
      console.debug(...formatMessage("DEBUG", ...args));
    }
  },

  /**
   * 信息日志 - 仅在开发环境输出
   */
  log: (...args: any[]): void => {
    if (currentLogLevel <= LogLevel.INFO && isDev) {
      console.log(...formatMessage("INFO", ...args));
    }
  },

  /**
   * 警告日志 - 始终输出
   */
  warn: (...args: any[]): void => {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(...formatMessage("WARN", ...args));
    }
  },

  /**
   * 错误日志 - 始终输出
   */
  error: (...args: any[]): void => {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(...formatMessage("ERROR", ...args));
    }
  },

  /**
   * 分组日志 - 仅在开发环境输出
   */
  group: (label: string): void => {
    if (isDev) {
      console.group(label);
    }
  },

  /**
   * 结束分组 - 仅在开发环境输出
   */
  groupEnd: (): void => {
    if (isDev) {
      console.groupEnd();
    }
  },

  /**
   * 表格日志 - 仅在开发环境输出
   */
  table: (data: any): void => {
    if (isDev) {
      console.table(data);
    }
  },

  /**
   * 时间测量开始 - 仅在开发环境输出
   */
  time: (label: string): void => {
    if (isDev) {
      console.time(label);
    }
  },

  /**
   * 时间测量结束 - 仅在开发环境输出
   */
  timeEnd: (label: string): void => {
    if (isDev) {
      console.timeEnd(label);
    }
  },
};

// 导出默认实例
export default logger;
