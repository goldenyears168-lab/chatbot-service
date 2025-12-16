'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '../ui/button'
import { ChatDialog } from '../ui/chat-dialog'
import { X } from 'lucide-react'
import { useMemo, useCallback } from 'react'
import { clientLogger } from '@/lib/client-logger'
import { ChatMessageList, type Message } from './ChatMessageList'
import { ChatInput } from './ChatInput'
import { ChatWelcome } from './ChatWelcome'
import type { FAQMenu } from './FAQMenu'
import { generateSessionId } from '@/lib/utils'

interface ChatbotWidgetProps {
  companyId: string
  apiEndpoint: string
  apiBaseUrl?: string
  pageType?: 'home' | 'embed'
  autoOpen?: boolean
  companyName?: string
  companyNameEn?: string
}

// Types are now imported from sub-components

export function ChatbotWidget(props: ChatbotWidgetProps) {
  // 防禦性檢查：確保 props 不為 null/undefined
  if (!props) {
    console.error('ChatbotWidget: props is null or undefined')
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-500 font-semibold mb-2">元件參數錯誤</p>
          <p className="text-gray-600 text-sm">元件未接收到有效的參數</p>
        </div>
      </div>
    )
  }

  // 解构 props
  const {
    companyId,
    apiEndpoint,
    pageType = 'home',
    autoOpen = false,
    companyName,
    companyNameEn: _companyNameEn, // 保留以备将来使用（例如多语言支持）
  } = props

  // 验证必需的 props
  if (!companyId || !apiEndpoint) {
    console.error('ChatbotWidget: Missing required props', { companyId, apiEndpoint })
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-500 font-semibold mb-2">组件参数不完整</p>
          <p className="text-gray-600 text-sm">
            缺少必需的参数: {!companyId && 'companyId'} {!apiEndpoint && 'apiEndpoint'}
          </p>
        </div>
      </div>
    )
  }
  const [isOpen, setIsOpen] = useState(autoOpen)
  const [faqMenu, setFaqMenu] = useState<FAQMenu | null>(null)
  const [uiConfig, setUiConfig] = useState<{ removeMarkdownBold?: boolean }>({ removeMarkdownBold: true })
  const sessionIdRef = useRef<string>(generateSessionId(companyId))
  
  // 使用 useChat hook 处理流式响应
  const chat = useChat({
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      body: {
        sessionId: sessionIdRef.current,
        conversationId: sessionIdRef.current,
      },
    }),
    onError: (error) => {
      clientLogger.error('Chat error', error)
      // 如果錯誤是 JSON 格式的錯誤訊息，記錄詳細資訊
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message)
          if (errorData.error || errorData.message) {
            clientLogger.error('Received JSON error response', errorData)
          }
        } catch {
          // 不是 JSON，正常处理
        }
      }
    },
    onFinish: (result) => {
      clientLogger.debug('Message completed', {
        messageId: result.message?.id,
        messageRole: result.message?.role,
        messagesCount: result.messages.length,
        finishReason: result.finishReason,
      })
    },
  })
  
  // 从 chat 对象中提取需要的属性和方法
  const { messages, sendMessage, setMessages, status } = chat
  const isLoading = status === 'streaming' || status === 'submitted'
  
  // 在 FAQ 中查找答案
  // 只使用精确匹配和标准化匹配，确保 next_best_actions 能精确匹配
  const findFAQAnswer = useCallback((question: string): { answer: string; next_best_actions?: string[] } | null => {
    if (!faqMenu || !faqMenu.categories) {
      clientLogger.warn('FAQ menu not loaded', { hasFaqMenu: !!faqMenu })
      return null
    }
    
    // 标准化问题文本（去除标点、空格，转为小写）
    const normalize = (text: string) => text.replace(/[，。！？\s]/g, '').toLowerCase()
    const normalizedQuestion = normalize(question)
    
    // 遍历所有分类和问题
    for (const category of Object.values(faqMenu.categories)) {
      for (const faqItem of category.questions) {
        const faqQuestion = faqItem.question
        
        // 1. 精确匹配
        if (faqQuestion === question) {
          clientLogger.debug('FAQ matched (exact)', { question, faqId: faqItem.id })
          return {
            answer: faqItem.answer,
            next_best_actions: faqItem.next_best_actions || []
          }
        }
        
        // 2. 标准化匹配（去除标点、空格后匹配）
        const normalizedFaqQuestion = normalize(faqQuestion)
        if (normalizedFaqQuestion === normalizedQuestion) {
          clientLogger.debug('FAQ matched (normalized)', { question, faqId: faqItem.id })
          return {
            answer: faqItem.answer,
            next_best_actions: faqItem.next_best_actions || []
          }
        }
      }
    }
    
    clientLogger.debug('FAQ not found', { 
      question, 
      normalizedQuestion,
      availableCategories: Object.keys(faqMenu.categories || {})
    })
    return null
  }, [faqMenu])
  
  // 處理選單問題點擊（直接顯示 FAQ 答案，不呼叫 API）
  // 注意：選單項目和預測問題都應該在 FAQ 中，如果找不到，記錄錯誤但不呼叫 AI
  const handleFAQQuestionClick = useCallback(async (question: string) => {
    const faqAnswer = findFAQAnswer(question)
    
    if (faqAnswer) {
      // 找到預設答案，直接新增訊息，不呼叫 API
      try {
        // 產生訊息 ID（使用 crypto.randomUUID() 避免碰撞）
        const userMessageId = `user-${crypto.randomUUID()}`
        const assistantMessageId = `assistant-${crypto.randomUUID()}`
        
        // 使用 functional update 避免 stale state
        setMessages((prev) => [
          ...prev,
          {
            id: userMessageId,
            role: 'user',
            content: question,
            parts: [{ type: 'text', text: question }],
          } as any,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: faqAnswer.answer,
            parts: [{ type: 'text', text: faqAnswer.answer }],
          } as any,
        ])
      } catch (error) {
        clientLogger.error('Failed to add FAQ messages', error)
      }
    } else {
      // 選單項目或預測問題應該在 FAQ 中，如果找不到，記錄錯誤但不呼叫 AI
      // 這種情況不應該發生，可能是 FAQ 資料設定問題
      clientLogger.error('FAQ question not found in menu/suggested questions', { 
        question,
        availableCategories: faqMenu ? Object.keys(faqMenu.categories || {}) : []
      })
      // 顯示錯誤提示給用戶，但不呼叫 AI API
      const userMessageId = `user-${crypto.randomUUID()}`
      const errorMessageId = `assistant-${crypto.randomUUID()}`
      // 使用 functional update 避免 stale state
      setMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: 'user',
          content: question,
          parts: [{ type: 'text', text: question }],
        } as any,
        {
          id: errorMessageId,
          role: 'assistant',
          content: '抱歉，这个问题暂时无法回答。请尝试其他问题，或直接在输入框中输入您的问题。',
          parts: [{ type: 'text', text: '抱歉，这个问题暂时无法回答。请尝试其他问题，或直接在输入框中输入您的问题。' }],
        } as any,
      ])
    }
  }, [findFAQAnswer, setMessages, faqMenu])
  
  // 處理手動輸入（先嘗試 FAQ，找不到才呼叫 AI）
  const handleSubmit = useCallback(async (messageText: string) => {
    // 先嘗試在 FAQ 中查找
    const faqAnswer = findFAQAnswer(messageText)
    
    if (faqAnswer) {
      // 找到預設答案，直接顯示
      try {
        const userMessageId = `user-${crypto.randomUUID()}`
        const assistantMessageId = `assistant-${crypto.randomUUID()}`
        
        // 使用 functional update 避免 stale state
        setMessages((prev) => [
          ...prev,
          {
            id: userMessageId,
            role: 'user',
            content: messageText,
            parts: [{ type: 'text', text: messageText }],
          } as any,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: faqAnswer.answer,
            parts: [{ type: 'text', text: faqAnswer.answer }],
          } as any,
        ])
      } catch (error) {
        clientLogger.error('Failed to add FAQ messages', error)
      }
    } else {
      // 找不到预设答案，调用 AI
      try {
        await sendMessage({ text: messageText })
      } catch (error) {
        clientLogger.error('Failed to send message', error)
      }
    }
  }, [findFAQAnswer, setMessages, sendMessage])
  
  // 轉換 useChat 的訊息格式為元件使用的格式
  // UIMessage 使用 parts 陣列，需要提取文字內容
  // 使用 useMemo 優化，避免每次渲染都重新計算
  const displayMessages: Message[] = useMemo(() => {
    return messages.map((msg, index) => {
      // 從 parts 中提取所有文字內容
      const textParts = msg.parts?.filter((part): part is { type: 'text'; text: string } => 
        part.type === 'text'
      ) || []
      const content = textParts.map(part => part.text).join('')
      
      // 如果訊息沒有內容，記錄警告
      if (msg.role === 'assistant' && !content) {
        clientLogger.warn('Assistant message has no text content', {
          id: msg.id,
          partsCount: msg.parts?.length || 0,
        })
      }
      
      // 為 AI 訊息新增預測問題（從 FAQ 中查找）
      let suggestedQuestions: string[] | undefined
      if (msg.role === 'assistant' && content) {
        // 找到對應的用戶訊息（上一條訊息）
        const prevMessage = index > 0 ? messages[index - 1] : null
        const userMessage = prevMessage && prevMessage.role === 'user'
          ? prevMessage.parts?.filter((part): part is { type: 'text'; text: string } => 
              part.type === 'text'
            ).map(part => part.text).join('') || ''
          : ''
        
        // 在 FAQ 中查找用戶問題，取得 next_best_actions
        if (userMessage) {
          const faqAnswer = findFAQAnswer(userMessage)
          if (faqAnswer && faqAnswer.next_best_actions && faqAnswer.next_best_actions.length > 0) {
            suggestedQuestions = faqAnswer.next_best_actions
          }
        }
      }
      
      return {
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content,
        suggestedQuestions,
      }
    })
  }, [messages, findFAQAnswer])

  // 通知父窗口（如果在 iframe 中）
  // 使用更安全的 postMessage 策略
  useEffect(() => {
    if (window.parent === window || !isOpen) {
      return
    }
    
    // 尝试从配置 API 获取允许的 origins
    // 如果无法获取，在开发环境使用当前 origin，生产环境使用环境变量
    const sendMessage = async () => {
      try {
        const configEndpoint = apiEndpoint.replace('/chat', '/config')
        const configResponse = await fetch(configEndpoint)
        if (configResponse.ok) {
          // 注意：当前 config API 不返回 allowedOrigins
          // 这里先使用环境变量，后续可以扩展 config API
        }
      } catch (error) {
        // 忽略設定載入錯誤
      }
      
      // 使用环境变量或安全的回退策略
      const envOrigin = process.env.NEXT_PUBLIC_WIDGET_ORIGIN
      if (envOrigin) {
        window.parent.postMessage({ type: 'smartbot-ready' }, envOrigin)
      } else if (process.env.NODE_ENV === 'development') {
        // 开发环境：允许当前 origin
        window.parent.postMessage({ type: 'smartbot-ready' }, window.location.origin)
      } else {
        // 生产环境：如果没有配置，不发送（避免安全漏洞）
        console.warn('postMessage skipped: NEXT_PUBLIC_WIDGET_ORIGIN not set in production')
      }
    }
    
    sendMessage()
  }, [isOpen, apiEndpoint])

  // 加载 FAQ 菜单和 UI 配置
  useEffect(() => {
    if (isOpen) {
      const loadConfigs = async () => {
        try {
          // 加载 FAQ 菜单
          if (!faqMenu) {
            const faqEndpoint = apiEndpoint.replace('/chat', '/faq-menu')
            const faqResponse = await fetch(faqEndpoint)
            if (faqResponse.ok) {
              const faqData = await faqResponse.json()
              setFaqMenu(faqData)
            }
          }
          
          // 加载 UI 配置
          const uiConfigEndpoint = apiEndpoint.replace('/chat', '/ui-config')
          const uiResponse = await fetch(uiConfigEndpoint)
          if (uiResponse.ok) {
            const uiData = await uiResponse.json()
            setUiConfig(uiData.ui || { removeMarkdownBold: true })
          }
        } catch (error) {
          clientLogger.error('Failed to load configs', error)
        }
      }
      loadConfigs()
    }
  }, [isOpen, faqMenu, apiEndpoint])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (window.parent === window) {
      return
    }
    
    // 使用與 ready 訊息相同的安全策略
    const envOrigin = process.env.NEXT_PUBLIC_WIDGET_ORIGIN
    if (envOrigin) {
      window.parent.postMessage({ type: 'smartbot-close' }, envOrigin)
    } else if (process.env.NODE_ENV === 'development') {
      window.parent.postMessage({ type: 'smartbot-close' }, window.location.origin)
    }
  }, [])


  return (
    <>
      {/* 气泡按钮 - 始终显示，点击切换对话框 */}
      {(pageType === 'home' || (pageType === 'embed' && !autoOpen)) && (
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-2xl z-[70] bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-110"
          size="icon"
          aria-label={isOpen ? "关闭聊天" : "打开聊天"}
        >
          <span className="text-3xl">💬</span>
        </Button>
      )}

      <ChatDialog open={isOpen} onOpenChange={setIsOpen} className="overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">
              {companyName ? `${companyName} AI 形象顧問` : 'AI 形象顧問'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5" aria-label="選方案、解釋流程">選方案、解釋流程</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Messages Area - 唯一的滚动容器 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {messages.length === 0 ? (
            <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6">
              <ChatWelcome
                welcomeMessage={
                  companyName
                    ? `嗨，我是${companyName}的 AI 顧問。可以幫你推薦方案、說明流程、解說價格。`
                    : '嗨，我是 AI 顧問。可以幫你推薦方案、說明流程、解說價格。'
                }
                welcomeSubtext="你可以直接跟我說你的狀況，或先用下面的快速選項開始。"
                faqMenu={faqMenu}
                onQuestionClick={handleFAQQuestionClick}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <ChatMessageList 
              messages={displayMessages} 
              isLoading={isLoading}
              onQuestionClick={handleFAQQuestionClick}
              removeMarkdownBold={uiConfig.removeMarkdownBold !== false}
            />
          )}
        </div>

        {/* Input Area - 固定在底部，支持安全区域 */}
        <div className="flex-shrink-0">
          <ChatInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="直接跟我說你的狀況，例如：我是..."
          />
        </div>
      </ChatDialog>
    </>
  )
}

// 添加 default export 以支持动态加载
export default ChatbotWidget