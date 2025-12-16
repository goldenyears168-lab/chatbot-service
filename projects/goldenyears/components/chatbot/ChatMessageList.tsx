// components/chatbot/ChatMessageList.tsx
// 聊天消息列表组件

'use client'

import { memo, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { cn } from '@/lib/utils'
import { SuggestedQuestions } from './SuggestedQuestions'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestedQuestions?: string[]
}

interface ChatMessageListProps {
  messages: Message[]
  isLoading: boolean
  onQuestionClick?: (question: string) => void
  removeMarkdownBold?: boolean
}

export const ChatMessageList = memo(function ChatMessageList({ 
  messages, 
  isLoading, 
  onQuestionClick,
  removeMarkdownBold = true,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>开始对话...</p>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                  <AvatarFallback className="text-white font-bold">AI</AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  'max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm',
                  'break-words',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                )}
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                <div 
                  className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  {(() => {
                    let content = msg.content || (msg.role === 'assistant' && isLoading ? '...' : '')
                    
                    // 如果启用 removeMarkdownBold，移除常见的 markdown 格式
                    // 注意：这只是简单的文本处理，复杂的 markdown 应该在后端处理或使用专门的 renderer
                    if (msg.role === 'assistant' && removeMarkdownBold && content) {
                      // 移除粗体标记 **text**
                      content = content.replace(/\*\*(.*?)\*\*/g, '$1')
                      // 移除斜体标记 *text*（但保留可能的列表项）
                      content = content.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '$1')
                      // 移除行内代码标记 `code`
                      content = content.replace(/`([^`]+?)`/g, '$1')
                    }
                    
                    return content
                  })()}
                </div>
                {/* 显示预测问题选项 */}
                {msg.role === 'assistant' && !isLoading && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <SuggestedQuestions
                    questions={msg.suggestedQuestions}
                    onQuestionClick={onQuestionClick || (() => {})}
                    isLoading={isLoading}
                  />
                )}
              </div>

              {msg.role === 'user' && (
                <Avatar className="h-10 w-10 bg-gray-300 flex-shrink-0">
                  <AvatarFallback className="text-gray-700 font-semibold">你</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {/* 使用 isLoading 状态判断，而不是检查最后一条消息的 content */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                <AvatarFallback className="text-white font-bold">AI</AvatarFallback>
              </Avatar>
              <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
})

