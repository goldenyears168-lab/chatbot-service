// lib/__tests__/rate-limit.test.ts
// 速率限制单元测试
import { checkRateLimit, createRateLimit } from '../rate-limit'

describe('checkRateLimit', () => {
  let mockRequest: Request

  beforeEach(() => {
    mockRequest = new Request('https://example.com/api', {
      headers: {
        'cf-connecting-ip': '192.168.1.1',
      },
    })
  })

  it('should allow first request', async () => {
    const config = {
      windowMs: 60000,
      maxRequests: 5,
    }
    
    const result = await checkRateLimit(mockRequest, config)
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })

  it('should allow requests within limit', async () => {
    const config = {
      windowMs: 60000,
      maxRequests: 3,
    }
    
    // Make 2 requests
    await checkRateLimit(mockRequest, config)
    const result = await checkRateLimit(mockRequest, config)
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
  })

  it('should reject requests exceeding limit', async () => {
    const config = {
      windowMs: 60000,
      maxRequests: 2,
    }
    
    // Make 2 requests (limit)
    await checkRateLimit(mockRequest, config)
    await checkRateLimit(mockRequest, config)
    
    // Third request should be rejected
    const result = await checkRateLimit(mockRequest, config)
    
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset after window expires', async () => {
    const config = {
      windowMs: 100, // Very short window for testing
      maxRequests: 1,
    }
    
    // First request
    await checkRateLimit(mockRequest, config)
    
    // Second request should be rejected
    const result1 = await checkRateLimit(mockRequest, config)
    expect(result1.allowed).toBe(false)
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Should be allowed again
    const result2 = await checkRateLimit(mockRequest, config)
    expect(result2.allowed).toBe(true)
  })

  it('should use custom key generator', async () => {
    const config = {
      windowMs: 60000,
      maxRequests: 2,
      keyGenerator: (_req: Request) => 'custom-key',
    }
    
    const result1 = await checkRateLimit(mockRequest, config)
    expect(result1.allowed).toBe(true)
    
    // Same request should count towards limit
    const result2 = await checkRateLimit(mockRequest, config)
    expect(result2.allowed).toBe(true)
    
    const result3 = await checkRateLimit(mockRequest, config)
    expect(result3.allowed).toBe(false)
  })

  it('should extract IP from Cloudflare header', async () => {
    const request = new Request('https://example.com', {
      headers: {
        'cf-connecting-ip': '1.2.3.4',
      },
    })
    
    const config = {
      windowMs: 60000,
      maxRequests: 1,
    }
    
    const result = await checkRateLimit(request, config)
    expect(result.allowed).toBe(true)
  })

  it('should extract IP from x-real-ip header', async () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-real-ip': '5.6.7.8',
      },
    })
    
    const config = {
      windowMs: 60000,
      maxRequests: 1,
    }
    
    const result = await checkRateLimit(request, config)
    expect(result.allowed).toBe(true)
  })

  it('should extract IP from x-forwarded-for header', async () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '9.10.11.12, 13.14.15.16',
      },
    })
    
    const config = {
      windowMs: 60000,
      maxRequests: 1,
    }
    
    const result = await checkRateLimit(request, config)
    expect(result.allowed).toBe(true)
  })
})

describe('createRateLimit', () => {
  it('should return null when request is allowed', async () => {
    const rateLimit = createRateLimit({
      windowMs: 60000,
      maxRequests: 5,
    })
    
    const request = new Request('https://example.com', {
      headers: { 'cf-connecting-ip': '1.2.3.4' },
    })
    
    const result = await rateLimit(request)
    expect(result).toBeNull()
  })

  it('should return 429 response when limit exceeded', async () => {
    const rateLimit = createRateLimit({
      windowMs: 60000,
      maxRequests: 1,
    })
    
    const request = new Request('https://example.com', {
      headers: { 'cf-connecting-ip': '1.2.3.4' },
    })
    
    // First request allowed
    await rateLimit(request)
    
    // Second request should be rejected
    const result = await rateLimit(request)
    
    expect(result).not.toBeNull()
    expect(result?.status).toBe(429)
    
    const body = await result?.json()
    expect(body.error).toBe('Too many requests')
    expect(body.message).toContain('Rate limit exceeded')
  })

  it('should include rate limit headers', async () => {
    const rateLimit = createRateLimit({
      windowMs: 60000,
      maxRequests: 3,
    })
    
    const request = new Request('https://example.com', {
      headers: { 'cf-connecting-ip': '1.2.3.4' },
    })
    
    // Exceed limit
    await rateLimit(request)
    await rateLimit(request)
    await rateLimit(request)
    const result = await rateLimit(request)
    
    expect(result?.headers.get('X-RateLimit-Limit')).toBe('3')
    expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(result?.headers.get('Retry-After')).toBeTruthy()
  })
})

