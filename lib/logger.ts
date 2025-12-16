// lib/logger.ts
// 日志服务 - 替换 console.log

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  // private isProduction = process.env.NODE_ENV === 'production' // Reserved for future use

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  /**
   * 记录调试信息（仅开发环境）
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  /**
   * 记录信息
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context))
    }
    // 生产环境可以发送到日志服务（如 Sentry, LogRocket）
    // if (this.isProduction) {
    //   sendToLogService('info', message, context)
    // }
  }

  /**
   * 记录警告
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context))
    }
    // 生产环境发送到日志服务
    // if (this.isProduction) {
    //   sendToLogService('warn', message, context)
    // }
  }

  /**
   * 记录错误
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : String(error),
    }

    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, errorContext))
      if (error instanceof Error) {
        console.error(error.stack)
      }
    }

    // 生产环境发送到错误追踪服务（如 Sentry）
    // if (this.isProduction) {
    //   sendToErrorTracking(message, error, errorContext)
    // }
  }

  /**
   * 记录性能指标
   */
  performance(label: string, duration: number, context?: LogContext): void {
    const message = `${label}: ${duration.toFixed(2)}ms`
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', `[Performance] ${message}`, context))
    }
  }
}

// 导出单例
export const logger = new Logger()

// 导出便捷方法
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context)
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context)
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context)
export const logError = (message: string, error?: Error | unknown, context?: LogContext) => 
  logger.error(message, error, context)
export const logPerformance = (label: string, duration: number, context?: LogContext) => 
  logger.performance(label, duration, context)

