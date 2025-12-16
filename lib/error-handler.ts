// lib/error-handler.ts
// 统一错误处理

import { logError as loggerError } from './logger'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

/**
 * 格式化错误响应（不泄露敏感信息）
 */
export function formatErrorResponse(error: unknown): {
  error: string
  code?: string
  details?: unknown
} {
  if (error instanceof AppError) {
    // 用户定义的错误，可以安全返回
    return {
      error: error.message,
      code: error.code,
      // 只在开发环境返回详细信息
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    }
  }
  
  if (error instanceof Error) {
    // 生产环境不返回详细的错误信息，避免泄露系统信息
    if (process.env.NODE_ENV === 'production') {
      return {
        error: 'An internal error occurred. Please try again later.',
        code: 'INTERNAL_ERROR',
      }
    }
    
    // 开发环境返回详细信息
    return {
      error: error.message,
      code: 'INTERNAL_ERROR',
    }
  }
  
  return {
    error: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  }
}

/**
 * 记录错误（生产环境可以发送到错误追踪服务）
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  // 使用统一的日志服务
  loggerError(
    error instanceof Error ? error.message : String(error),
    error,
    context
  )
}

