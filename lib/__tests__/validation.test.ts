// lib/__tests__/validation.test.ts
// 输入验证单元测试
import {
  sanitizeInput,
  validateMessage,
  validateCompanyId,
  validateSessionId,
  validateConversationId,
  validateChatRequest,
} from '../validation'
import { ValidationError } from '../error-handler'

describe('sanitizeInput', () => {
  it('should remove script tags', () => {
    const input = '<script>alert("xss")</script>Hello'
    const result = sanitizeInput(input)
    expect(result).not.toContain('<script>')
    expect(result).toContain('Hello')
  })

  it('should remove iframe tags', () => {
    const input = '<iframe src="evil.com"></iframe>Content'
    const result = sanitizeInput(input)
    expect(result).not.toContain('<iframe>')
    expect(result).toContain('Content')
  })

  it('should escape HTML entities', () => {
    const input = '<div>Test & "quotes"</div>'
    const result = sanitizeInput(input)
    expect(result).toContain('&lt;')
    expect(result).toContain('&amp;')
    expect(result).toContain('&quot;')
  })

  it('should remove javascript: protocol', () => {
    const input = 'javascript:alert(1)'
    const result = sanitizeInput(input)
    expect(result).not.toContain('javascript:')
  })

  it('should throw error for non-string input', () => {
    expect(() => sanitizeInput(123 as unknown as string)).toThrow(ValidationError)
    expect(() => sanitizeInput(null as unknown as string)).toThrow(ValidationError)
    expect(() => sanitizeInput(undefined as unknown as string)).toThrow(ValidationError)
  })
})

describe('validateMessage', () => {
  it('should accept valid messages', () => {
    const result = validateMessage('Hello, how can I help you?')
    expect(result).toBe('Hello, how can I help you?')
  })

  it('should reject empty messages', () => {
    expect(() => validateMessage('')).toThrow(ValidationError)
    expect(() => validateMessage('   ')).toThrow(ValidationError)
  })

  it('should reject messages that are too long', () => {
    const longMessage = 'a'.repeat(2001)
    expect(() => validateMessage(longMessage)).toThrow(ValidationError)
  })

  it('should reject messages with SQL injection', () => {
    expect(() => validateMessage("'; DROP TABLE users; --")).toThrow(ValidationError)
    expect(() => validateMessage('SELECT * FROM users')).toThrow(ValidationError)
    expect(() => validateMessage('INSERT INTO users VALUES')).toThrow(ValidationError)
  })

  it('should reject messages with XSS attempts', () => {
    expect(() => validateMessage('<script>alert(1)</script>')).toThrow(ValidationError)
    expect(() => validateMessage('javascript:alert(1)')).toThrow(ValidationError)
  })

  it('should reject messages with too many special characters', () => {
    const suspiciousMessage = '<>{[]}\\|`~!@#$%^&*()+=<>{[]}\\|`~!@#$%^&*()+='
    expect(() => validateMessage(suspiciousMessage)).toThrow(ValidationError)
  })

  it('should trim whitespace', () => {
    const result = validateMessage('  Hello World  ')
    expect(result).toBe('Hello World')
  })

  it('should reject non-string input', () => {
    expect(() => validateMessage(null as unknown as string)).toThrow(ValidationError)
    expect(() => validateMessage(123 as unknown as string)).toThrow(ValidationError)
    expect(() => validateMessage({} as unknown as string)).toThrow(ValidationError)
  })
})

describe('validateCompanyId', () => {
  it('should accept valid company IDs', () => {
    expect(validateCompanyId('goldenyears')).toBe('goldenyears')
    expect(validateCompanyId('company-b')).toBe('company-b')
    expect(validateCompanyId('COMPANY_C')).toBe('company_c')
  })

  it('should convert to lowercase', () => {
    expect(validateCompanyId('GOLDENYEARS')).toBe('goldenyears')
  })

  it('should reject empty company IDs', () => {
    expect(() => validateCompanyId('')).toThrow(ValidationError)
    expect(() => validateCompanyId(null as unknown as string)).toThrow(ValidationError)
    expect(() => validateCompanyId(undefined as unknown as string)).toThrow(ValidationError)
  })

  it('should reject company IDs that are too short', () => {
    expect(() => validateCompanyId('a')).toThrow(ValidationError)
  })

  it('should reject company IDs that are too long', () => {
    const longId = 'a'.repeat(51)
    expect(() => validateCompanyId(longId)).toThrow(ValidationError)
  })

  it('should reject company IDs with invalid characters', () => {
    expect(() => validateCompanyId('company@b')).toThrow(ValidationError)
    expect(() => validateCompanyId('company.b')).toThrow(ValidationError)
    expect(() => validateCompanyId('company b')).toThrow(ValidationError)
  })

  it('should accept company IDs with hyphens and underscores', () => {
    expect(validateCompanyId('company-b')).toBe('company-b')
    expect(validateCompanyId('company_b')).toBe('company_b')
    expect(validateCompanyId('company-123_test')).toBe('company-123_test')
  })
})

describe('validateSessionId', () => {
  it('should accept valid session IDs', () => {
    expect(validateSessionId('session_123')).toBe('session_123')
    expect(validateSessionId('conv_abc123')).toBe('conv_abc123')
  })

  it('should return undefined for empty input', () => {
    expect(validateSessionId('')).toBeUndefined()
    expect(validateSessionId(null as unknown as string)).toBeUndefined()
    expect(validateSessionId(undefined as unknown as string)).toBeUndefined()
  })

  it('should reject invalid session ID formats', () => {
    expect(() => validateSessionId('invalid')).toThrow(ValidationError)
    expect(() => validateSessionId('123')).toThrow(ValidationError)
    expect(() => validateSessionId('session')).toThrow(ValidationError)
  })

  it('should reject session IDs that are too long', () => {
    const longId = 'session_' + 'a'.repeat(200)
    expect(() => validateSessionId(longId)).toThrow(ValidationError)
  })

  it('should reject non-string input', () => {
    expect(() => validateSessionId(123 as unknown as string)).toThrow(ValidationError)
    expect(() => validateSessionId({} as unknown as string)).toThrow(ValidationError)
  })
})

describe('validateConversationId', () => {
  it('should accept valid conversation IDs', () => {
    expect(validateConversationId('conv_123')).toBe('conv_123')
    expect(validateConversationId('session_abc123')).toBe('session_abc123')
  })

  it('should return undefined for empty input', () => {
    expect(validateConversationId('')).toBeUndefined()
    expect(validateConversationId(null as unknown as string)).toBeUndefined()
    expect(validateConversationId(undefined as unknown as string)).toBeUndefined()
  })

  it('should reject invalid conversation ID formats', () => {
    expect(() => validateConversationId('invalid')).toThrow(ValidationError)
    expect(() => validateConversationId('123')).toThrow(ValidationError)
  })

  it('should reject conversation IDs that are too long', () => {
    const longId = 'conv_' + 'a'.repeat(200)
    expect(() => validateConversationId(longId)).toThrow(ValidationError)
  })
})

describe('validateChatRequest', () => {
  it('should accept valid chat requests', () => {
    const request = {
      message: 'Hello, how can I help?',
      sessionId: 'session_123',
      conversationId: 'conv_456',
    }
    const result = validateChatRequest(request)
    expect(result.message).toBe('Hello, how can I help?')
    expect(result.sessionId).toBe('session_123')
    expect(result.conversationId).toBe('conv_456')
  })

  it('should accept requests with only message', () => {
    const request = { message: 'Hello' }
    const result = validateChatRequest(request)
    expect(result.message).toBe('Hello')
    expect(result.sessionId).toBeUndefined()
    expect(result.conversationId).toBeUndefined()
  })

  it('should reject invalid request body', () => {
    expect(() => validateChatRequest(null as unknown as { message: string })).toThrow(ValidationError)
    expect(() => validateChatRequest(undefined as unknown as { message: string })).toThrow(ValidationError)
    expect(() => validateChatRequest('string' as unknown as { message: string })).toThrow(ValidationError)
    expect(() => validateChatRequest(123 as unknown as { message: string })).toThrow(ValidationError)
  })

  it('should reject requests without message', () => {
    expect(() => validateChatRequest({} as unknown as { message: string })).toThrow(ValidationError)
    expect(() => validateChatRequest({ sessionId: 'session_123' } as unknown as { message: string })).toThrow(ValidationError)
  })

  it('should validate message content', () => {
    expect(() => validateChatRequest({ message: '' })).toThrow(ValidationError)
    expect(() => validateChatRequest({ message: '<script>alert(1)</script>' })).toThrow(ValidationError)
  })

  it('should validate session ID format', () => {
    expect(() => validateChatRequest({
      message: 'Hello',
      sessionId: 'invalid',
    })).toThrow(ValidationError)
  })

  it('should validate conversation ID format', () => {
    expect(() => validateChatRequest({
      message: 'Hello',
      conversationId: 'invalid',
    })).toThrow(ValidationError)
  })
})

