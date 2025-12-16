// lib/client-logger.ts
// 客户端日志服务（用于 'use client' 组件）

/**
 * 客户端日志配置
 */
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * 客户端日志服务
 * 在生产环境中，错误会发送到错误追踪服务（如 Sentry）
 */
export const clientLogger = {
  /**
   * 记录错误
   */
  error: (message: string, error?: unknown) => {
    if (isDevelopment) {
      console.error(`[Client Error] ${message}`, error)
    }
    // 生产环境发送到错误追踪服务
    // if (isProduction && error) {
    //   captureException(error, { extra: { message } })
    // }
  },

  /**
   * 记录警告
   */
  warn: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.warn(`[Client Warn] ${message}`, data)
    }
  },

  /**
   * 记录调试信息（仅开发环境）
   */
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.debug(`[Client Debug] ${message}`, data)
    }
  },

  /**
   * 记录信息（仅开发环境）
   */
  info: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.info(`[Client Info] ${message}`, data)
    }
  },
}

