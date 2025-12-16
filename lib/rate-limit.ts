// lib/rate-limit.ts
// 速率限制工具（Edge Runtime 兼容）

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// 简单的内存存储（Edge Runtime 中可用）
// 生产环境建议使用 Redis 或 Cloudflare KV
const store: RateLimitStore = {}

/**
 * 速率限制配置
 */
interface RateLimitConfig {
  windowMs: number // 时间窗口（毫秒）
  maxRequests: number // 最大请求数
  keyGenerator?: (request: Request) => string // 自定义键生成器
}

/**
 * 默认键生成器（基于 IP 地址）
 */
function defaultKeyGenerator(request: Request): string {
  // 尝试从各种头部获取真实 IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
  
  const forwardedIp = forwarded ? forwarded.split(',')[0]?.trim() : null
  const ip = cfConnectingIp || realIp || forwardedIp || 'unknown'
  return `rate-limit:${ip}`
}

/**
 * 检查速率限制
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(request)
  const now = Date.now()

  // 清理过期条目（简单实现，生产环境应该使用 TTL）
  if (Object.keys(store).length > 10000) {
    // 如果存储过大，清理过期条目
    for (const [k, v] of Object.entries(store)) {
      if (v.resetTime < now) {
        delete store[k]
      }
    }
  }

  const record = store[key]

  // 如果没有记录或已过期，创建新记录
  if (!record || record.resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  // 检查是否超过限制
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  // 增加计数
  record.count++
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * 创建速率限制中间件
 */
export function createRateLimit(config: RateLimitConfig) {
  return async (request: Request): Promise<Response | null> => {
    const result = await checkRateLimit(request, config)

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
          },
        }
      )
    }

    return null // 允许请求继续
  }
}

/**
 * 默认速率限制配置
 */
export const defaultRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 60, // 60 次请求
})

