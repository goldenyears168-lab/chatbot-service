// lib/__tests__/error-handler.test.ts
// 错误处理单元测试
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  formatErrorResponse,
  logError,
} from '../error-handler'

// Mock logger
const mockLoggerError = jest.fn()
jest.mock('../logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}))

describe('AppError', () => {
  it('should create error with default status code', () => {
    const error = new AppError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(500)
    expect(error.name).toBe('AppError')
  })

  it('should create error with custom status code', () => {
    const error = new AppError('Not found', 404)
    expect(error.statusCode).toBe(404)
  })

  it('should create error with code and details', () => {
    const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', { field: 'email' })
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.details).toEqual({ field: 'email' })
  })
})

describe('ValidationError', () => {
  it('should create validation error with 400 status', () => {
    const error = new ValidationError('Invalid input')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.name).toBe('ValidationError')
  })

  it('should include details if provided', () => {
    const error = new ValidationError('Invalid input', { field: 'email' })
    expect(error.details).toEqual({ field: 'email' })
  })
})

describe('NotFoundError', () => {
  it('should create not found error with 404 status', () => {
    const error = new NotFoundError()
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.name).toBe('NotFoundError')
  })

  it('should use custom message', () => {
    const error = new NotFoundError('Resource not found')
    expect(error.message).toBe('Resource not found')
  })
})

describe('UnauthorizedError', () => {
  it('should create unauthorized error with 401 status', () => {
    const error = new UnauthorizedError()
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.name).toBe('UnauthorizedError')
  })
})

describe('formatErrorResponse', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: originalEnv },
      writable: true,
      configurable: true,
    })
  })

  it('should format AppError in development', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'development' },
      writable: true,
      configurable: true,
    })
    const error = new ValidationError('Invalid input', { field: 'email' })
    const response = formatErrorResponse(error)
    
    expect(response.error).toBe('Invalid input')
    expect(response.code).toBe('VALIDATION_ERROR')
    expect(response.details).toEqual({ field: 'email' })
  })

  it('should format AppError in production', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'production' },
      writable: true,
      configurable: true,
    })
    const error = new ValidationError('Invalid input', { field: 'email' })
    const response = formatErrorResponse(error)
    
    expect(response.error).toBe('Invalid input')
    expect(response.code).toBe('VALIDATION_ERROR')
    // 生产环境不返回 details
    expect(response.details).toBeUndefined()
  })

  it('should format generic Error in development', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'development' },
      writable: true,
      configurable: true,
    })
    const error = new Error('Something went wrong')
    const response = formatErrorResponse(error)
    
    expect(response.error).toBe('Something went wrong')
    expect(response.code).toBe('INTERNAL_ERROR')
  })

  it('should format generic Error in production', () => {
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: 'production' },
      writable: true,
      configurable: true,
    })
    const error = new Error('Something went wrong')
    const response = formatErrorResponse(error)
    
    expect(response.error).toBe('An internal error occurred. Please try again later.')
    expect(response.code).toBe('INTERNAL_ERROR')
    // 生产环境不泄露错误详情
    expect(response.error).not.toContain('Something went wrong')
  })

  it('should handle unknown error types', () => {
    const response = formatErrorResponse('string error')
    expect(response.error).toBe('An unknown error occurred')
    expect(response.code).toBe('UNKNOWN_ERROR')
  })

  it('should handle null/undefined', () => {
    const response1 = formatErrorResponse(null)
    expect(response1.error).toBe('An unknown error occurred')
    
    const response2 = formatErrorResponse(undefined)
    expect(response2.error).toBe('An unknown error occurred')
  })
})

describe('logError', () => {
  beforeEach(() => {
    mockLoggerError.mockClear()
  })

  it('should log error with context', () => {
    const error = new Error('Test error')
    const context = { company: 'test-company', endpoint: '/api/test' }
    
    logError(error, context)
    
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Test error',
      error,
      context
    )
  })

  it('should handle string errors', () => {
    logError('String error', { company: 'test' })
    
    expect(mockLoggerError).toHaveBeenCalledWith(
      'String error',
      'String error',
      { company: 'test' }
    )
  })

  it('should handle errors without context', () => {
    const error = new Error('Test error')
    
    logError(error)
    
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Test error',
      error,
      undefined
    )
  })
})

