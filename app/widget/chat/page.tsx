'use client'

import { useEffect, Suspense, useState, ComponentType } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadProjectChatbotComponent } from '@/lib/components/loader'
import { validateChatbotWidgetProps } from '@/lib/utils/widget-error'

interface CompanyConfig {
  name: string
  name_en: string
}

interface ChatbotWidgetProps {
  companyId: string
  apiEndpoint: string
  pageType?: 'home' | 'embed'
  autoOpen?: boolean
  companyName?: string
  companyNameEn?: string
}

function WidgetChatContent() {
  const searchParams = useSearchParams()
  const companyId = searchParams.get('company') || ''
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null)
  const [ChatbotWidget, setChatbotWidget] = useState<ComponentType<ChatbotWidgetProps> | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 动态加载项目特定的 ChatbotWidget
  useEffect(() => {
    if (companyId) {
      loadProjectChatbotComponent<ComponentType<ChatbotWidgetProps>>(
        companyId,
        'ChatbotWidget'
      )
        .then((Component) => {
          if (!Component) {
            throw new Error('Component loaded but is null or undefined')
          }
          if (typeof Component !== 'function') {
            throw new Error(`Component is not a function, got: ${typeof Component}`)
          }
          console.log('Component loaded successfully:', Component)
          setChatbotWidget(() => Component)
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : String(err)
          setError(errorMessage)
          console.error('Failed to load project component:', err)
        })
    }
  }, [companyId])
  
  // 加载公司配置
  useEffect(() => {
    if (companyId) {
      const loadCompanyConfig = async () => {
        try {
          const response = await fetch(`/api/${companyId}/config`)
          if (response.ok) {
            const config = await response.json()
            setCompanyConfig(config)
          }
        } catch (error) {
          console.error('Failed to load company config', error)
        }
      }
      loadCompanyConfig()
    }
  }, [companyId])
  
  useEffect(() => {
    // 通知父窗口 Widget 已加载完成
    if (window.parent !== window) {
      // 从环境变量获取允许的 origin，或使用当前页面的 origin
      const allowedOrigin = process.env.NEXT_PUBLIC_WIDGET_ORIGIN || window.location.origin
      window.parent.postMessage(
        { type: 'smartbot-ready' },
        allowedOrigin
      )
    }
  }, [])
  
  if (!companyId) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">Company ID is required</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-500 font-semibold mb-2">组件加载失败</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <p className="text-xs text-gray-500">
            请确保项目 {companyId} 有对应的组件：
            <br />
            <code className="bg-gray-100 px-2 py-1 rounded">
              projects/{companyId}/components/chatbot/ChatbotWidget.tsx
            </code>
          </p>
        </div>
      </div>
    )
  }
  
  if (!ChatbotWidget) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">加载组件中...</p>
      </div>
    )
  }
  
  // 准备 props 对象
  const widgetProps: ChatbotWidgetProps = {
    companyId,
    apiEndpoint: `/api/${companyId}/chat`,
    pageType: 'embed',
    autoOpen: true,
    companyName: companyConfig?.name,
    companyNameEn: companyConfig?.name_en,
  }

  // 验证 props（使用统一的验证函数）
  const validation = validateChatbotWidgetProps(widgetProps)
  if (!validation.valid) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-500 font-semibold mb-2">参数错误</p>
          <p className="text-gray-600 text-sm">{validation.error}</p>
        </div>
      </div>
    )
  }

  // 确保组件是有效的函数
  if (typeof ChatbotWidget !== 'function') {
    console.error('ChatbotWidget is not a function:', ChatbotWidget)
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-500 font-semibold mb-2">组件类型错误</p>
          <p className="text-gray-600 text-sm">组件不是有效的 React 组件</p>
        </div>
      </div>
    )
  }

  try {
    return (
      <div className="h-screen w-full" style={{ backgroundColor: '#fff' }}>
        <ChatbotWidget {...widgetProps} />
      </div>
    )
  } catch (error) {
    console.error('Error rendering ChatbotWidget:', error)
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-500 font-semibold mb-2">渲染错误</p>
          <p className="text-gray-600 text-sm">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </div>
    )
  }
}

export default function WidgetChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    }>
      <WidgetChatContent />
    </Suspense>
  )
}

