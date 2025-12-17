import { ComponentType, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const companyId = searchParams.get('company') || ''
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null)
  const [ChatbotWidget, setChatbotWidget] = useState<ComponentType<ChatbotWidgetProps> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) return

    loadProjectChatbotComponent<ComponentType<ChatbotWidgetProps>>(companyId, 'ChatbotWidget')
      .then((Component) => {
        if (!Component) throw new Error('Component loaded but is null or undefined')
        if (typeof Component !== 'function') throw new Error(`Component is not a function, got: ${typeof Component}`)
        setChatbotWidget(() => Component)
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
      })
  }, [companyId])

  useEffect(() => {
    if (!companyId) return

    const loadCompanyConfig = async () => {
      try {
        const response = await fetch(`/api/${companyId}/config`)
        if (response.ok) {
          const config = (await response.json()) as CompanyConfig
          setCompanyConfig(config)
        }
      } catch {
        // ignore
      }
    }

    loadCompanyConfig()
  }, [companyId])

  useEffect(() => {
    if (window.parent === window) return
    const allowedOrigin = import.meta.env.VITE_WIDGET_ORIGIN || window.location.origin
    window.parent.postMessage({ type: 'smartbot-ready' }, allowedOrigin)
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

  const widgetProps: ChatbotWidgetProps = {
    companyId,
    apiEndpoint: `/api/${companyId}/chat`,
    pageType: 'embed',
    autoOpen: true,
    companyName: companyConfig?.name,
    companyNameEn: companyConfig?.name_en,
  }

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

  if (typeof ChatbotWidget !== 'function') {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-500 font-semibold mb-2">组件类型错误</p>
          <p className="text-gray-600 text-sm">组件不是有效的 React 组件</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full" style={{ backgroundColor: '#fff' }}>
      <ChatbotWidget {...widgetProps} />
    </div>
  )
}

export default function WidgetChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      }
    >
      <WidgetChatContent />
    </Suspense>
  )
}


