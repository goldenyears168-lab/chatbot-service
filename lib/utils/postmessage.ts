// lib/utils/postmessage.ts
// 安全的 postMessage 工具函数

/**
 * 检查 origin 是否在允许列表中
 * 支持通配符匹配（如 "https://*.pages.dev"）
 */
function isOriginAllowed(targetOrigin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some(allowed => {
    // 精确匹配
    if (allowed === targetOrigin) {
      return true
    }
    
    // 通配符匹配（如 "https://*.pages.dev"）
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(targetOrigin)
    }
    
    return false
  })
}

/**
 * 安全地发送 postMessage
 * @param message 要发送的消息
 * @param allowedOrigins 允许的 origin 列表（从配置中获取）
 * @param fallbackOrigin 回退 origin（如果配置未设置）
 */
export function safePostMessage(
  message: any,
  allowedOrigins?: string[],
  fallbackOrigin?: string
): void {
  if (window.parent === window) {
    // 不在 iframe 中，不需要发送
    return
  }

  const parentOrigin = document.referrer ? new URL(document.referrer).origin : null
  
  // 如果配置了允许的 origins，使用配置
  if (allowedOrigins && allowedOrigins.length > 0) {
    // 如果知道 parent origin，检查是否允许
    if (parentOrigin && isOriginAllowed(parentOrigin, allowedOrigins)) {
      window.parent.postMessage(message, parentOrigin)
      return
    }
    
    // 如果不知道 parent origin，尝试发送到所有允许的 origins
    // 注意：postMessage 的 targetOrigin 必须是单个 origin，不能是数组
    // 所以我们需要选择一个安全的默认值
    const defaultOrigin = allowedOrigins.find(origin => !origin.includes('*')) || allowedOrigins[0]
    // 移除通配符，使用第一个非通配符的 origin，或使用 fallback
    const safeOrigin = defaultOrigin.replace(/\*/g, '')
    window.parent.postMessage(message, safeOrigin || '*')
    return
  }
  
  // 如果没有配置，使用环境变量或 fallback
  const envOrigin = process.env.NEXT_PUBLIC_WIDGET_ORIGIN
  if (envOrigin) {
    window.parent.postMessage(message, envOrigin)
    return
  }
  
  // 最后回退：如果知道 parent origin 且是开发环境，允许
  if (parentOrigin && process.env.NODE_ENV === 'development') {
    window.parent.postMessage(message, parentOrigin)
    return
  }
  
  // 最安全的回退：不发送，或发送到当前 origin（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    window.parent.postMessage(message, window.location.origin)
  } else {
    console.warn('postMessage blocked: No allowed origins configured and not in development mode')
  }
}

