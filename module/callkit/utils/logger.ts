// 日志级别枚举
export enum LogLevel {
  ERROR = 0, // 错误日志
  WARN = 1, // 警告日志
  INFO = 2, // 信息日志
  DEBUG = 3, // 调试日志
  VERBOSE = 4, // 详细日志
}

// 日志级别名称映射
export const LogLevelNames = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.VERBOSE]: 'VERBOSE',
};

// 日志管理配置
export interface LoggerConfig {
  level: LogLevel; // 当前日志级别
  enableConsole: boolean; // 是否启用控制台输出
  enablePrefix: boolean; // 是否启用日志前缀
  prefix?: string; // 自定义前缀
}

// 日志管理类
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.ERROR, // 默认只输出错误日志
      enableConsole: true, // 默认启用控制台输出
      enablePrefix: true, // 默认启用前缀
      prefix: '[CallKit]', // 默认前缀
      ...config,
    };
  }

  // 获取单例实例
  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    } else if (config) {
      // 更新现有实例的配置
      Logger.instance.updateConfig(config);
    }
    return Logger.instance;
  }

  // 更新配置
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 获取当前配置
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // 设置日志级别
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  // 启用/禁用控制台输出
  public setConsoleEnabled(enabled: boolean): void {
    this.config.enableConsole = enabled;
  }

  // 启用/禁用前缀
  public setPrefixEnabled(enabled: boolean): void {
    this.config.enablePrefix = enabled;
  }

  // 设置自定义前缀
  public setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }

  // 检查是否应该输出指定级别的日志
  private shouldLog(level: LogLevel): boolean {
    return this.config.enableConsole && level <= this.config.level;
  }

  // 格式化日志消息
  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevelNames[level];

    let formattedMessage = '';

    if (this.config.enablePrefix) {
      formattedMessage += `${this.config.prefix} `;
    }

    formattedMessage += `[${timestamp}] [${levelName}] ${message}`;

    return formattedMessage;
  }

  // 错误日志
  public error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage(LogLevel.ERROR, message);
      console.error(formattedMessage, ...args);
    }
  }

  // 警告日志
  public warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formattedMessage = this.formatMessage(LogLevel.WARN, message);
      console.warn(formattedMessage, ...args);
    }
  }

  // 信息日志
  public info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formattedMessage = this.formatMessage(LogLevel.INFO, message);
      console.info(formattedMessage, ...args);
    }
  }

  // 调试日志
  public debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = this.formatMessage(LogLevel.DEBUG, message);
      console.log(formattedMessage, ...args);
    }
  }

  // 详细日志
  public verbose(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      const formattedMessage = this.formatMessage(LogLevel.VERBOSE, message);
      console.log(formattedMessage, ...args);
    }
  }

  // 兼容性方法：直接输出到控制台（不受级别控制）
  public log(message: string, ...args: any[]): void {
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(LogLevel.INFO, message);
      console.log(formattedMessage, ...args);
    }
  }

  // 兼容性方法：直接输出到控制台（不受级别控制）
  public console(message: string, ...args: any[]): void {
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(LogLevel.INFO, message);
      console.log(formattedMessage, ...args);
    }
  }

  // 获取当前日志级别名称
  public getCurrentLevelName(): string {
    return LogLevelNames[this.config.level];
  }

  // 检查是否启用了指定级别的日志
  public isLevelEnabled(level: LogLevel): boolean {
    return this.shouldLog(level);
  }
}

// 导出默认实例
export const logger = Logger.getInstance();

// 便捷方法
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
export const logVerbose = (message: string, ...args: any[]) => logger.verbose(message, ...args);
export const log = (message: string, ...args: any[]) => logger.log(message, ...args);
