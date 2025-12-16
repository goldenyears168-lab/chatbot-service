// app/api/[company]/chat/route.ts
import { DatabaseManager } from '@/lib/db'
import { validateCompanyId } from '@/lib/config'
import { formatErrorResponse, logError, ValidationError, NotFoundError } from '@/lib/error-handler'
import { createTimer } from '@/lib/performance'
import { isOriginAllowed } from '@/lib/env'
import { createRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { validateCompanyId as validateCompanyIdInput } from '@/lib/validation'
import { hasStatusCode, isStreamTextResult } from '@/types/chat'
import {
  parseChatRequest,
  loadKnowledgeContext,
  createGeminiModel,
  generateAIResponse,
} from '@/lib/api/chat-helpers'
import { generateConversationId, generateMessageId } from '@/lib/utils'

export const runtime = 'edge' // 使用 Edge Runtime
export const maxDuration = 30 // 最大执行时间（秒）

// 速率限制：每分钟 30 次请求
const rateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 30, // 30 次请求
})

/**
 * 获取 CORS 响应头
 */
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  } else if (process.env.NODE_ENV === 'development') {
    // 开发环境允许所有来源
    headers['Access-Control-Allow-Origin'] = origin || '*'
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  
  return headers
}

// 处理 OPTIONS 预检请求
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ company: string }> }
) {
  // 速率限制检查
  const rateLimitResponse = await rateLimit(request)
  if (rateLimitResponse) {
    // 添加 CORS 头到速率限制响应
    const corsHeaders = getCorsHeaders(request)
    rateLimitResponse.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
    Object.entries(corsHeaders).forEach(([key, value]) => {
      rateLimitResponse.headers.set(key, value)
    })
    return rateLimitResponse
  }
  
  const resolvedParams = await params
  const timer = createTimer(`Chat API - ${resolvedParams.company}`)
  const corsHeaders = getCorsHeaders(request)
  
  try {
    // 验证并清理输入
    const company = validateCompanyIdInput(resolvedParams.company)
    
    // 验证公司是否存在
    const isValidCompany = await validateCompanyId(company)
    if (!isValidCompany) {
      throw new NotFoundError(`Company ${company} not found`)
    }
    
    // 解析并验证请求体
    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      throw new ValidationError('Invalid JSON in request body')
    }

    // 解析聊天请求（支持多种格式）
    const { message, sessionId, conversationId } = await parseChatRequest(requestBody, company)
    
    // 验证 message 不为空
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new ValidationError('Message is required and must be a non-empty string')
    }
    
    const db = new DatabaseManager()
    const finalConversationId = conversationId || sessionId || generateConversationId()
    
    // 1. 保存用户消息（立即保存，不等待 AI 响应）
    try {
      await db.saveMessage({
        id: generateMessageId(),
        conversation_id: finalConversationId,
        role: 'user',
        content: message,
        timestamp: new Date(),
      })
      
      // 确保会话存在
      try {
        await db.getConversation(finalConversationId)
      } catch {
        // 会话不存在，创建新会话
        await db.saveConversation({
          id: generateConversationId(),
          company_id: company,
          conversation_id: finalConversationId,
          start_time: new Date(),
          message_count: 1,
          status: 'active',
        })
      }
    } catch (error) {
      logger.error('Failed to save user message', error, { company, conversationId: finalConversationId })
      // 继续执行，不阻塞响应
    }
    
    // 2. 加载知识库和上下文（传入用户消息以进行检索）
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const { systemPrompt } = await loadKnowledgeContext(company, baseUrl, message)
    const contextMessages = await db.getConversationMessages(finalConversationId)

    // 3. 创建 Gemini 模型
    const googleModel = createGeminiModel()

    // 4. 生成 AI 响应
    const result = await generateAIResponse({
      model: googleModel,
      systemPrompt,
      messages: [
        ...contextMessages
          .slice(-10)
          .filter(msg => {
            const role = msg.role
            return role === 'user' || role === 'assistant' || role === 'system'
          })
          .map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          })),
        {
          role: 'user',
          content: message,
        },
      ],
      conversationId: finalConversationId,
      company,
      db,
    })

    // 5. 返回串流响应
    if (!isStreamTextResult(result)) {
      logger.error('streamText returned invalid result', new Error('Result does not have toUIMessageStreamResponse method'), {
        company,
        resultType: typeof result,
        resultKeys: typeof result === 'object' && result !== null ? Object.keys(result) : [],
      })
      throw new Error('Invalid streamText result: missing toUIMessageStreamResponse method')
    }

    const response = result.toUIMessageStreamResponse()
    
    // 调试日志：确认响应格式
    const contentType = response.headers.get('Content-Type')
    logger.debug('Stream response created', {
      company,
      contentType,
      hasBody: !!response.body,
      allHeaders: Object.fromEntries(response.headers.entries()),
    })
    
    // 确保 Content-Type 正确（应该是 text/plain 或 application/x-ndjson）
    if (!contentType || (!contentType.includes('text/plain') && !contentType.includes('application/x-ndjson') && !contentType.includes('text/event-stream'))) {
      logger.warn('Unexpected Content-Type in stream response', {
        company,
        contentType,
        expected: 'text/plain, application/x-ndjson, or text/event-stream',
      })
    }
    
    // 添加 CORS 头到响应
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // 记录性能指标
    const duration = timer.end()
    logger.debug('Chat API completed', { company, duration })
    
    return response
  } catch (error) {
    // 安全地获取公司 ID（可能验证失败）
    let companyId: string = 'unknown'
    try {
      companyId = resolvedParams?.company || 'unknown'
    } catch {
      // 如果获取失败，使用默认值
    }
    
    // 记录错误（包含完整上下文，但不泄露给用户）
    logError(error, { 
      company: companyId, 
      endpoint: '/api/[company]/chat',
      timestamp: new Date().toISOString(),
    })
    
    // 格式化错误响应（生产环境不泄露敏感信息）
    const errorResponse = formatErrorResponse(error)
    
    // 确定状态码
    let statusCode = 500
    if (error instanceof ValidationError) {
      statusCode = 400
    } else if (error instanceof NotFoundError) {
      statusCode = 404
    } else if (hasStatusCode(error)) {
      statusCode = error.statusCode ?? 500
    }
    
    const errorResponseHeaders = {
      'Content-Type': 'application/json',
      ...corsHeaders,
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: statusCode, 
        headers: errorResponseHeaders,
      }
    )
  }
}

