// lib/knowledge-cache.ts
// 知识库缓存管理

import type { KnowledgeBase } from './knowledge'
import { logger } from './logger'

interface CacheEntry {
  data: KnowledgeBase
  timestamp: number
  expiry: number
}

// 内存缓存（Edge Runtime 兼容）
// 生产环境建议使用 Cloudflare KV 或 Redis
const cache = new Map<string, CacheEntry>()

/**
 * 缓存配置
 */
interface CacheConfig {
  ttl: number // 缓存时间（毫秒），默认 5 分钟
  maxSize: number // 最大缓存条目数，默认 100
}

const defaultConfig: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 分钟
  maxSize: 100,
}

/**
 * 清理过期缓存
 */
function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (entry.expiry < now) {
      cache.delete(key)
    }
  }
}

/**
 * 清理缓存以保持最大大小
 */
function enforceMaxSize(): void {
  if (cache.size <= defaultConfig.maxSize) {
    return
  }

  // 按时间戳排序，删除最旧的条目
  const entries = Array.from(cache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)

  const toDelete = entries.slice(0, cache.size - defaultConfig.maxSize)
  for (const [key] of toDelete) {
    cache.delete(key)
  }
}

/**
 * 获取缓存的知识库
 */
export function getCachedKnowledgeBase(
  companyId: string,
  _config: CacheConfig = defaultConfig
): KnowledgeBase | null {
  // 定期清理过期缓存
  if (cache.size > 0 && Math.random() < 0.1) {
    // 10% 的概率清理（避免每次都清理）
    cleanExpiredCache()
  }

  const entry = cache.get(companyId)
  if (!entry) {
    return null
  }

  const now = Date.now()
  if (entry.expiry < now) {
    // 缓存已过期
    cache.delete(companyId)
    logger.debug(`Cache expired for ${companyId}`, { companyId })
    return null
  }

  logger.debug(`Cache hit for ${companyId}`, { companyId })
  return entry.data
}

/**
 * 设置缓存的知识库
 */
export function setCachedKnowledgeBase(
  companyId: string,
  data: KnowledgeBase,
  config: CacheConfig = defaultConfig
): void {
  // 清理过期缓存
  cleanExpiredCache()

  // 确保不超过最大大小
  enforceMaxSize()

  const now = Date.now()
  cache.set(companyId, {
    data: { ...data }, // 深拷贝，避免引用问题
    timestamp: now,
    expiry: now + config.ttl,
  })

  logger.debug(`Cache set for ${companyId}`, { companyId, ttl: config.ttl })
}

/**
 * 清除指定公司的缓存
 */
export function clearKnowledgeBaseCache(companyId: string): void {
  cache.delete(companyId)
  logger.debug(`Cache cleared for ${companyId}`, { companyId })
}

/**
 * 清除所有缓存
 */
export function clearAllKnowledgeBaseCache(): void {
  cache.clear()
  logger.debug('All knowledge base cache cleared')
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
  size: number
  maxSize: number
  entries: Array<{ companyId: string; age: number; expiresIn: number }>
} {
  const now = Date.now()
  const entries = Array.from(cache.entries()).map(([companyId, entry]) => ({
    companyId,
    age: now - entry.timestamp,
    expiresIn: entry.expiry - now,
  }))

  return {
    size: cache.size,
    maxSize: defaultConfig.maxSize,
    entries,
  }
}

