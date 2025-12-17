import { DatabaseManager } from '@/lib/db/operations'
import { validateCompanyId } from '@/lib/config'
import { createTimer } from '@/lib/performance'
import { createRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { validateCompanyId as validateCompanyIdInput } from '@/lib/validation'
import { formatErrorResponse, logError, NotFoundError, ValidationError } from '@/lib/error-handler'
import { hasStatusCode, isStreamTextResult } from '@/types/chat'
import {
  parseChatRequest,
  loadKnowledgeContext,
  createGeminiModel,
  generateAIResponse,
} from '@/lib/api/chat-helpers'
import { generateConversationId, generateMessageId } from '@/lib/utils'
import { getCorsHeaders, withCors } from '@/functions/_utils/cors'

const rateLimit = createRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 30,
})

export const onRequest = async (context: any) => {
  const { request, params } = context as { request: Request; params: Record<string, string> }
  const cors = getCorsHeaders(request, { methods: 'POST, OPTIONS', headers: 'Content-Type, Authorization' })

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (request.method !== 'POST') {
    return withCors(new Response('Method Not Allowed', { status: 405 }), cors)
  }

  const rateLimitResponse = await rateLimit(request)
  if (rateLimitResponse) {
    return withCors(rateLimitResponse, cors)
  }

  const timer = createTimer(`Chat API - ${params.company}`)

  try {
    const company = validateCompanyIdInput(params.company)

    const isValidCompany = await validateCompanyId(company)
    if (!isValidCompany) {
      throw new NotFoundError(`Company ${company} not found`)
    }

    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      throw new ValidationError('Invalid JSON in request body')
    }

    const { message, sessionId, conversationId } = await parseChatRequest(requestBody, company)

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new ValidationError('Message is required and must be a non-empty string')
    }

    const db = new DatabaseManager()
    const finalConversationId = conversationId || sessionId || generateConversationId()

    try {
      await db.saveMessage({
        id: generateMessageId(),
        conversation_id: finalConversationId,
        role: 'user',
        content: message,
        timestamp: new Date(),
      })

      try {
        await db.getConversation(finalConversationId)
      } catch {
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
    }

    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const { systemPrompt } = await loadKnowledgeContext(company, baseUrl, message)
    const contextMessages = await db.getConversationMessages(finalConversationId)

    const googleModel = createGeminiModel()

    const result = await generateAIResponse({
      model: googleModel,
      systemPrompt,
      messages: [
        ...contextMessages
          .slice(-10)
          .filter((msg) => {
            const role = msg.role
            return role === 'user' || role === 'assistant' || role === 'system'
          })
          .map((msg) => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          })),
        { role: 'user', content: message },
      ],
      conversationId: finalConversationId,
      company,
      db,
    })

    if (!isStreamTextResult(result)) {
      throw new Error('Invalid streamText result: missing toUIMessageStreamResponse method')
    }

    const response = result.toUIMessageStreamResponse()
    withCors(response, cors)

    const duration = timer.end()
    logger.debug('Chat API completed', { company, duration })

    return response
  } catch (error) {
    logError(error, {
      company: params.company || 'unknown',
      endpoint: '/api/[company]/chat',
      timestamp: new Date().toISOString(),
    })

    const errorResponse = formatErrorResponse(error)
    let statusCode = 500
    if (error instanceof ValidationError) statusCode = 400
    else if (error instanceof NotFoundError) statusCode = 404
    else if (hasStatusCode(error)) statusCode = error.statusCode ?? 500

    timer.end()

    return withCors(
      new Response(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }),
      cors
    )
  }
}


