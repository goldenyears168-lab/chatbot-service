// lib/api/chat-helpers.ts
// Chat API 辅助函数

import { DatabaseManager } from '@/lib/db'
import { getKnowledgeBase, type KnowledgeBase } from '@/lib/knowledge'
import { logger } from '@/lib/logger'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai'
import type {
  ChatRequestBody,
  ValidatedChatRequest,
  StreamTextResult,
} from '@/types/chat'
import type { GeminiModelId } from '@/types/knowledge'
import { isUIMessage, isChatRequestBody, isTextPart } from '@/types/chat'
import { ValidationError } from '@/lib/error-handler'
import { validateChatRequest } from '@/lib/validation'
import { generateMessageId } from '@/lib/utils'

/**
 * 解析聊天请求体
 */
export async function parseChatRequest(
  requestBody: unknown,
  company: string
): Promise<ValidatedChatRequest> {
  if (!isChatRequestBody(requestBody)) {
    throw new ValidationError('Request body must be an object with message or messages field')
  }

  const body: ChatRequestBody = requestBody

  // 优先处理 Vercel AI SDK 标准格式（useChat 发送的格式）
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    const lastMessage = body.messages[body.messages.length - 1]

    if (!isUIMessage(lastMessage)) {
      throw new ValidationError(
        `Invalid message format in messages array: last message must be a valid UIMessage, got ${typeof lastMessage}`
      )
    }

    // 提取消息内容
    let extractedContent: string | undefined

    // 方法 1: 检查是否有 parts 数组（UIMessage 标准格式）
    if (Array.isArray(lastMessage.parts)) {
      const textParts = lastMessage.parts.filter(isTextPart)
      if (textParts.length > 0) {
        extractedContent = textParts.map(part => part.text).join('')
        logger.debug('Extracted content from parts array', { company, contentLength: extractedContent.length })
      }
    }

    // 方法 2: 检查是否有 content 字段
    if (!extractedContent && lastMessage.content) {
      if (typeof lastMessage.content === 'string') {
        extractedContent = lastMessage.content
        logger.debug('Extracted content from content field', { company, contentLength: extractedContent.length })
      }
    }

    // 方法 3: 检查是否有 text 字段
    if (!extractedContent && lastMessage.text) {
      if (typeof lastMessage.text === 'string') {
        extractedContent = lastMessage.text
        logger.debug('Extracted content from text field', { company, contentLength: extractedContent.length })
      }
    }

    if (extractedContent && extractedContent.trim().length > 0) {
      return {
        message: extractedContent,
        sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
        conversationId: typeof body.conversationId === 'string' ? body.conversationId : undefined,
      }
    }

    throw new ValidationError(
      'Message must have valid text content (in parts, content, or text field). Received message structure: ' +
        JSON.stringify(Object.keys(lastMessage))
    )
  } else if (body.message) {
    // 回退到旧格式（message 字段）
    const validated = validateChatRequest(requestBody)
    return {
      message: validated.message,
      sessionId: validated.sessionId,
      conversationId: validated.conversationId,
    }
  }

  throw new ValidationError('Request body must contain either "message" field or "messages" array')
}

/**
 * 根据用户问题检索相关的知识块
 */
function retrieveRelevantChunks(
  userMessage: string,
  knowledgeBase: KnowledgeBase
): string[] {
  // 尝试从多个可能的路径获取 retrieval 数据
  const knowledgeBaseData = 
    knowledgeBase['3-knowledge_base'] || 
    knowledgeBase.knowledge_base || 
    knowledgeBase['knowledgeBase'] ||
    {}
  
  const knowledgeBaseDataObj = typeof knowledgeBaseData === 'object' && knowledgeBaseData !== null ? knowledgeBaseData as Record<string, unknown> : {}
  const retrieval = knowledgeBaseDataObj.retrieval
  
  const retrievalObj = retrieval && typeof retrieval === 'object' && retrieval !== null ? retrieval as Record<string, unknown> : {}
  if (!retrievalObj.chunks || !Array.isArray(retrievalObj.chunks)) {
    logger.debug('No retrieval chunks found in knowledge base', {
      hasKnowledgeBaseData: !!knowledgeBaseData,
      hasRetrieval: !!retrieval,
      knowledgeBaseKeys: Object.keys(knowledgeBase),
    })
    return []
  }

  const relevantChunks: string[] = []
  const messageLower = userMessage.toLowerCase().trim()

  if (!messageLower) {
    return []
  }

  // 方法1: 通过 q_triggers 匹配（精确匹配）
  const matchedChunkIds = new Set<string>()
  
  for (const chunk of retrievalObj.chunks as unknown[]) {
    const chunkObj = typeof chunk === 'object' && chunk !== null ? chunk as Record<string, unknown> : {}
    if (chunkObj.q_triggers && Array.isArray(chunkObj.q_triggers)) {
      for (const trigger of chunkObj.q_triggers) {
        if (messageLower.includes(String(trigger).toLowerCase())) {
          const chunkText = `【${String(chunkObj.title || chunkObj.chunk_id || '')}】\n${String(chunkObj.content || '')}`
          relevantChunks.push(chunkText)
          matchedChunkIds.add(String(chunkObj.chunk_id || chunkObj.title || ''))
          break // 找到匹配就跳出，避免重复
        }
      }
    }
  }

  // 方法2: 通过 tags 和 aliases 匹配（如果方法1没找到足够内容）
  if (relevantChunks.length === 0 && retrievalObj.aliases) {
    const aliasesObj = retrievalObj.aliases as Record<string, unknown>
    for (const [key, aliases] of Object.entries(aliasesObj)) {
      const allKeywords = [key, ...(Array.isArray(aliases) ? aliases as string[] : [])]
      for (const keyword of allKeywords) {
        if (messageLower.includes(keyword.toLowerCase())) {
          // 找到包含相关 tag 的 chunks
          for (const chunk of retrievalObj.chunks as unknown[]) {
            const chunkObj = typeof chunk === 'object' && chunk !== null ? chunk as Record<string, unknown> : {}
            if (chunkObj.tags && Array.isArray(chunkObj.tags)) {
              const hasMatchingTag = chunkObj.tags.some((tag: unknown) => {
                const tagLower = String(tag).toLowerCase()
                const keyLower = key.toLowerCase()
                return tagLower.includes(keyLower) || keyLower.includes(tagLower)
              })
              
              if (hasMatchingTag && !matchedChunkIds.has(String(chunkObj.chunk_id || chunkObj.title || ''))) {
                relevantChunks.push(
                  `【${String(chunkObj.title || chunkObj.chunk_id || '')}】\n${String(chunkObj.content || '')}`
                )
                matchedChunkIds.add(String(chunkObj.chunk_id || chunkObj.title || ''))
              }
            }
          }
          break
        }
      }
    }
  }

  // 方法3: 通过 tags 直接匹配（如果前两种方法都没找到）
  if (relevantChunks.length === 0 && retrievalObj.tags && Array.isArray(retrievalObj.tags)) {
    for (const tag of retrievalObj.tags) {
      if (messageLower.includes(String(tag).toLowerCase())) {
        for (const chunk of retrievalObj.chunks as unknown[]) {
          const chunkObj = typeof chunk === 'object' && chunk !== null ? chunk as Record<string, unknown> : {}
          if (chunkObj.tags && Array.isArray(chunkObj.tags) && chunkObj.tags.includes(tag)) {
            if (!matchedChunkIds.has(String(chunkObj.chunk_id || chunkObj.title || ''))) {
              relevantChunks.push(
                `【${String(chunkObj.title || chunkObj.chunk_id || '')}】\n${String(chunkObj.content || '')}`
              )
              matchedChunkIds.add(String(chunkObj.chunk_id || chunkObj.title || ''))
            }
          }
        }
        break
      }
    }
  }

  logger.debug('Retrieved relevant chunks', {
    userMessageLength: userMessage.length,
    chunksFound: relevantChunks.length,
    chunkIds: Array.from(matchedChunkIds),
  })

  return relevantChunks
}

/**
 * 加载知识库上下文（增强版：包含检索机制）
 */
export async function loadKnowledgeContext(
  company: string, 
  baseUrl: string,
  userMessage?: string  // 新增参数：用户消息
) {
  const knowledgeBase = await getKnowledgeBase(company, baseUrl)
  const aiConfig = knowledgeBase.aiConfig || knowledgeBase.ai_config || {}
  const personas = knowledgeBase.personas || {}
  const services = knowledgeBase.services || {}
  const companyInfo = knowledgeBase.company_info || knowledgeBase.contactInfo || {}
  
  // 尝试加载 knowledge_base.json（包含 retrieval chunks）
  const knowledgeBaseData = 
    knowledgeBase['3-knowledge_base'] || 
    knowledgeBase.knowledge_base || 
    knowledgeBase['knowledgeBase'] ||
    {}

  const aiConfigObj = typeof aiConfig === 'object' && aiConfig !== null ? aiConfig as Record<string, unknown> : {}
  const personasObj = typeof personas === 'object' && personas !== null ? personas as Record<string, unknown> : {}
  const companyInfoObj = typeof companyInfo === 'object' && companyInfo !== null ? companyInfo as Record<string, unknown> : {}
  const knowledgeBaseDataObj = typeof knowledgeBaseData === 'object' && knowledgeBaseData !== null ? knowledgeBaseData as Record<string, unknown> : {}
  
  const personaObj = personasObj.persona && typeof personasObj.persona === 'object' && personasObj.persona !== null ? personasObj.persona as Record<string, unknown> : {}
  const aiConfigPersonaObj = aiConfigObj.persona && typeof aiConfigObj.persona === 'object' && aiConfigObj.persona !== null ? aiConfigObj.persona as Record<string, unknown> : {}
  const personaName = (personaObj.name && typeof personaObj.name === 'string' ? personaObj.name : null) || 
                      (aiConfigPersonaObj.name && typeof aiConfigPersonaObj.name === 'string' ? aiConfigPersonaObj.name : null) || 
                      '公司'

  // 构建基础 system prompt
  let systemPrompt = `你是一个专业的 AI 客服助手，为 ${personaName} 提供服务。

公司信息：
${JSON.stringify(services, null, 2)}

${companyInfoObj.contact ? `联系方式：${JSON.stringify(companyInfoObj.contact, null, 2)}` : ''}

${aiConfigObj.instructions ? `特殊指示：${aiConfigObj.instructions}` : ''}`

  // 如果提供了用户消息，进行知识检索
  if (userMessage && userMessage.trim()) {
    const relevantChunks = retrieveRelevantChunks(userMessage, knowledgeBase)
    
    if (relevantChunks.length > 0) {
      systemPrompt += `\n\n【重要：请严格按照以下知识库内容回答用户问题】\n\n`
      systemPrompt += relevantChunks.join('\n\n---\n\n')
      systemPrompt += `\n\n请基于以上知识库内容，准确、详细地回答用户的问题。如果用户的问题与知识库内容相关，必须引用知识库中的具体信息。不要使用知识库中没有的信息。`
      
      logger.debug('Added retrieved chunks to system prompt', {
        company,
        chunksCount: relevantChunks.length,
        userMessageLength: userMessage.length,
      })
    } else {
      // 如果没有找到相关 chunks，可以包含完整的知识库结构（作为后备）
      if (knowledgeBaseDataObj.entities || knowledgeBaseDataObj.examples) {
        systemPrompt += `\n\n知识库结构：\n${JSON.stringify({
          entities: knowledgeBaseDataObj.entities,
          examples: knowledgeBaseDataObj.examples
        }, null, 2)}`
        
        logger.debug('No relevant chunks found, using full knowledge base structure', {
          company,
          hasEntities: !!knowledgeBaseDataObj.entities,
          hasExamples: !!knowledgeBaseDataObj.examples,
        })
      }
    }
  } else {
    // 没有用户消息时，包含完整的知识库（向后兼容）
    if (knowledgeBaseDataObj.entities || knowledgeBaseDataObj.examples) {
      systemPrompt += `\n\n知识库结构：\n${JSON.stringify({
        entities: knowledgeBaseDataObj.entities,
        examples: knowledgeBaseDataObj.examples
      }, null, 2)}`
    }
  }

  systemPrompt += `\n\n请根据以上信息，友好、专业地回答用户的问题。如果问题超出你的知识范围，请礼貌地引导用户联系人工客服。`

  const responseTemplates = knowledgeBase.responseTemplates || knowledgeBase.response_templates || {}
  const uiConfigValue = aiConfigObj.ui || {}

  return {
    systemPrompt,
    knowledgeBase,
    uiConfig: uiConfigValue,
    responseTemplates,
  }
}

/**
 * 创建 Gemini 模型实例
 */
export function createGeminiModel(): ReturnType<ReturnType<typeof createGoogleGenerativeAI>> {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!geminiApiKey) {
    throw new Error(
      'Gemini API key is not configured. Please set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable.'
    )
  }

  const modelIdEnv = process.env.GEMINI_MODEL_ID
  const modelId: GeminiModelId = (
    modelIdEnv &&
    ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-pro-latest'].includes(
      modelIdEnv
    )
      ? modelIdEnv
      : 'gemini-2.0-flash'
  ) as GeminiModelId

  const googleProvider = createGoogleGenerativeAI({
    apiKey: geminiApiKey,
  })

  logger.debug('Using Gemini model', {
    modelId,
    hasApiKey: !!geminiApiKey,
    apiKeyLength: geminiApiKey.length,
  })

  return googleProvider(modelId)
}

/**
 * 生成 AI 响应（带超时处理）
 */
export async function generateAIResponse(config: {
  model: ReturnType<ReturnType<typeof createGoogleGenerativeAI>>
  systemPrompt: string
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  conversationId: string
  company: string
  db: DatabaseManager
  timeoutMs?: number
}): Promise<StreamTextResult> {
  const { model, systemPrompt, messages, conversationId, company, db, timeoutMs = 25000 } = config

  logger.debug('Starting streamText', {
    company,
    messageLength: messages[messages.length - 1]?.content.length || 0,
    contextMessagesCount: messages.length - 1,
    conversationId,
    timeoutMs,
  })

  // 创建 AbortController 用于超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      abortSignal: controller.signal,
      onFinish: async ({ text, usage }) => {
        // 异步保存 AI 回复，不阻塞响应
        try {
          await db.saveMessage({
            id: generateMessageId(),
            conversation_id: conversationId,
            role: 'assistant',
            content: text,
            timestamp: new Date(),
            response_time: usage?.totalTokens ? Math.round(usage.totalTokens * 0.1) : 0,
          })

          await db.incrementMessageCount(conversationId)
        } catch (error) {
          logger.error('Failed to save assistant message', error, { company, conversationId })
        }
      },
    })

    clearTimeout(timeoutId)
    
    logger.debug('streamText completed', {
      company,
      hasResult: !!result,
      resultType: typeof result,
    })

    return result as unknown as StreamTextResult
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    
    const streamError = error instanceof Error ? error : new Error(String(error))

    // 检查是否是超时错误
    if (controller.signal.aborted || streamError.name === 'AbortError') {
      logger.error('streamText timeout', streamError, {
        company,
        timeoutMs,
        conversationId,
      })
      throw new Error(`Request timeout after ${timeoutMs}ms. Please try again.`)
    }

    logger.error('streamText failed', streamError, {
      company,
      errorMessage: streamError.message,
      errorName: streamError.name,
    })

    // 检查是否是模型未找到的错误
    if (streamError.message.includes('not found') || streamError.message.includes('not supported')) {
      throw new Error(
        `Gemini model is not available. Please check your API key and model name. Error: ${streamError.message}`
      )
    }

    throw streamError
  }
}

