// types/chat.ts
// 聊天相关的类型定义

/**
 * UI Message Part 类型（Vercel AI SDK v5 格式）
 */
export interface UIMessagePart {
  type: 'text' | 'tool-call' | 'tool-result'
  text?: string
  toolCallId?: string
  toolName?: string
  args?: unknown
  result?: unknown
}

/**
 * UI Message 类型（Vercel AI SDK v5 格式）
 */
export interface UIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content?: string
  parts?: UIMessagePart[]
  text?: string
}

/**
 * 聊天请求体类型
 */
export interface ChatRequestBody {
  message?: string
  messages?: UIMessage[]
  sessionId?: string
  conversationId?: string
}

/**
 * 验证后的聊天请求类型
 */
export interface ValidatedChatRequest {
  message: string
  sessionId?: string
  conversationId?: string
}

/**
 * StreamTextResult 类型（Vercel AI SDK）
 */
export interface StreamTextResult {
  toUIMessageStreamResponse: () => Response
  toDataStreamResponse?: () => Response
  toAIStreamResponse?: () => Response
  toTextStreamResponse?: () => Response
  pipeDataStreamToResponse?: (response: Response) => Response
  textStream?: ReadableStream
  baseStream?: AsyncIterable<unknown>
  [key: string]: unknown
}

/**
 * 带状态码的错误类型
 */
export interface ErrorWithStatusCode extends Error {
  statusCode?: number
}

/**
 * 类型守卫：检查是否为 UIMessage
 */
export function isUIMessage(obj: unknown): obj is UIMessage {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'role' in obj &&
    typeof (obj as UIMessage).role === 'string' &&
    ['user', 'assistant', 'system'].includes((obj as UIMessage).role)
  )
}

/**
 * 类型守卫：检查是否为 ChatRequestBody
 */
export function isChatRequestBody(obj: unknown): obj is ChatRequestBody {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('message' in obj || 'messages' in obj)
  )
}

/**
 * 类型守卫：检查是否为 StreamTextResult
 */
export function isStreamTextResult(obj: unknown): obj is StreamTextResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'toUIMessageStreamResponse' in obj &&
    typeof (obj as StreamTextResult).toUIMessageStreamResponse === 'function'
  )
}

/**
 * 类型守卫：检查错误是否有 statusCode
 */
export function hasStatusCode(error: unknown): error is ErrorWithStatusCode {
  return error instanceof Error && 'statusCode' in error
}

/**
 * 类型守卫：检查是否为文本类型的 UIMessagePart
 */
export function isTextPart(part: UIMessagePart): part is UIMessagePart & { type: 'text'; text: string } {
  return part.type === 'text' && typeof part.text === 'string'
}

