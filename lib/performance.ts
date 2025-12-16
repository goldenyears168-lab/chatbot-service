// lib/performance.ts
// 性能监控和优化工具

import { logPerformance } from './logger'

/**
 * 性能计时器
 */
export class PerformanceTimer {
  private startTime: number
  private label: string

  constructor(label: string) {
    this.label = label
    this.startTime = performance.now()
  }

  end(): number {
    const duration = performance.now() - this.startTime
    logPerformance(this.label, duration)
    return duration
  }
}

/**
 * 创建性能计时器
 */
export function createTimer(label: string): PerformanceTimer {
  return new PerformanceTimer(label)
}

/**
 * 延迟执行（用于节流）
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 缓存函数结果
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  ttl: number = 60000 // 默认 1 分钟
): T {
  const cache = new Map<string, { value: ReturnType<T>; expiry: number }>()
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    
    if (cached && cached.expiry > Date.now()) {
      return cached.value
    }
    
    const result = func(...args)
    cache.set(key, {
      value: result,
      expiry: Date.now() + ttl,
    })
    
    return result
  }) as T
}

