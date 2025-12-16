// lib/utils/id.ts
// ID 生成工具函数

/**
 * 生成安全的唯一 ID
 * 使用 crypto.randomUUID() (浏览器) 或 crypto.randomBytes() (Node.js)
 */
export function generateId(prefix: string = 'id'): string {
  // 浏览器环境
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`
  }

  // Node.js 环境（Edge Runtime 可能不支持）
  if (typeof crypto !== 'undefined' && 'randomBytes' in crypto) {
    const bytes = (crypto as any).randomBytes(16)
    const uuid = bytes.toString('hex').replace(
      /(.{8})(.{4})(.{4})(.{4})(.{12})/,
      '$1-$2-$3-$4-$5'
    )
    return `${prefix}_${uuid}`
  }

  // 回退方案：使用时间戳 + 随机数（不够安全，但比单独使用好）
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * 生成会话 ID
 */
export function generateSessionId(companyId: string): string {
  return generateId(`session_${companyId}`)
}

/**
 * 生成对话 ID
 */
export function generateConversationId(): string {
  return generateId('conv')
}

/**
 * 生成消息 ID
 */
export function generateMessageId(): string {
  return generateId('msg')
}

