// lib/validation.ts
// 输入验证和清理工具

import { ValidationError } from './error-handler'

/**
 * 清理用户输入，防止 XSS 攻击
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string')
  }

  // 移除潜在的 HTML 标签
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // 移除事件处理器

  // 转义特殊字符
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  return sanitized.trim()
}

/**
 * 验证消息内容
 */
export function validateMessage(message: unknown): string {
  if (!message) {
    throw new ValidationError('Message is required')
  }

  if (typeof message !== 'string') {
    throw new ValidationError('Message must be a string')
  }

  const trimmed = message.trim()

  if (trimmed.length === 0) {
    throw new ValidationError('Message cannot be empty')
  }

  if (trimmed.length > 2000) {
    throw new ValidationError('Message is too long (max 2000 characters)')
  }

  // 检查是否包含过多的特殊字符（可能是注入攻击）
  const specialCharCount = (trimmed.match(/[<>{}[\]\\|`~!@#$%^&*()+=]/g) || []).length
  if (specialCharCount > trimmed.length * 0.3) {
    throw new ValidationError('Message contains too many special characters')
  }

  // 检查是否包含可疑模式
  const suspiciousPatterns = [
    /SELECT\s+.*\s+FROM/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+.*\s+SET/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      throw new ValidationError('Message contains suspicious content')
    }
  }

  return trimmed
}

/**
 * 验证公司 ID
 */
export function validateCompanyId(companyId: unknown): string {
  if (!companyId) {
    throw new ValidationError('Company ID is required')
  }

  if (typeof companyId !== 'string') {
    throw new ValidationError('Company ID must be a string')
  }

  // 只允许字母、数字、连字符和下划线
  if (!/^[a-z0-9_-]+$/i.test(companyId)) {
    throw new ValidationError('Company ID contains invalid characters')
  }

  if (companyId.length < 2 || companyId.length > 50) {
    throw new ValidationError('Company ID must be between 2 and 50 characters')
  }

  return companyId.toLowerCase()
}

/**
 * 验证会话 ID
 */
export function validateSessionId(sessionId: unknown): string | undefined {
  if (!sessionId) {
    return undefined
  }

  if (typeof sessionId !== 'string') {
    throw new ValidationError('Session ID must be a string')
  }

  // 会话 ID 格式：session_xxx 或 conv_xxx
  // 允许字母、数字、下划线和连字符
  if (!/^(session_|conv_)[a-zA-Z0-9_-]+$/i.test(sessionId)) {
    throw new ValidationError(`Invalid session ID format: ${sessionId.substring(0, 50)}`)
  }

  if (sessionId.length > 200) {
    throw new ValidationError('Session ID is too long')
  }

  return sessionId
}

/**
 * 验证对话 ID
 */
export function validateConversationId(conversationId: unknown): string | undefined {
  if (!conversationId) {
    return undefined
  }

  if (typeof conversationId !== 'string') {
    throw new ValidationError('Conversation ID must be a string')
  }

  // 对话 ID 格式：conv_xxx 或 session_xxx（兼容性）
  // 允许字母、数字、下划线和连字符
  if (!/^(conv_|session_)[a-zA-Z0-9_-]+$/i.test(conversationId)) {
    throw new ValidationError(`Invalid conversation ID format: ${conversationId.substring(0, 50)}`)
  }

  if (conversationId.length > 200) {
    throw new ValidationError('Conversation ID is too long')
  }

  return conversationId
}

/**
 * 验证请求体
 */
export interface ChatRequest {
  message: string
  sessionId?: string
  conversationId?: string
}

export function validateChatRequest(body: unknown): ChatRequest {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object')
  }

  const request = body as Record<string, unknown>

  return {
    message: validateMessage(request.message),
    sessionId: validateSessionId(request.sessionId),
    conversationId: validateConversationId(request.conversationId),
  }
}

