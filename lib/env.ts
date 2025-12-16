// lib/env.ts
// 环境变量验证工具

/**
 * 获取必需的环境变量，如果不存在则抛出错误
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please check your .env.local file or deployment configuration.`
    )
  }
  return value
}

/**
 * 获取可选的环境变量，如果不存在则返回默认值
 */
export function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}

/**
 * 获取布尔类型的环境变量
 */
export function getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key]
  if (!value) return defaultValue
  return value.toLowerCase() === 'true' || value === '1'
}

/**
 * 获取数字类型的环境变量
 */
export function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (!value) return defaultValue
  const num = parseInt(value, 10)
  return isNaN(num) ? defaultValue : num
}

/**
 * 获取允许的 CORS 源列表
 */
export function getAllowedOrigins(): string[] {
  const origins = getOptionalEnv('ALLOWED_ORIGINS', '')
  if (!origins) {
    // 开发环境允许所有来源，生产环境必须配置
    if (process.env.NODE_ENV === 'development') {
      return ['*'] // 开发环境允许所有
    }
    throw new Error(
      'ALLOWED_ORIGINS environment variable is required in production. ' +
      'Please set it to a comma-separated list of allowed origins.'
    )
  }
  return origins.split(',').map(origin => origin.trim()).filter(Boolean)
}

/**
 * 检查给定的 origin 是否在允许列表中
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  const allowedOrigins = getAllowedOrigins()
  
  // 开发环境允许所有
  if (allowedOrigins.includes('*')) {
    return true
  }
  
  return allowedOrigins.includes(origin)
}

