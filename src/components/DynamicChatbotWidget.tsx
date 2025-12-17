'use client'

import { useEffect, useState, ComponentType } from 'react'
import { loadProjectChatbotComponent } from '@/lib/components/loader'

interface ChatbotWidgetProps {
  companyId: string
  apiEndpoint: string
  pageType?: 'home' | 'embed'
  autoOpen?: boolean
  companyName?: string
  companyNameEn?: string
}

export function DynamicChatbotWidget(props: ChatbotWidgetProps) {
  const [ChatbotWidget, setChatbotWidget] = useState<ComponentType<ChatbotWidgetProps> | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!props?.companyId) {
      setError('Company ID is required')
      return
    }
    
    // 组件加载只依赖于 companyId，因为不同项目的组件是不同的
    // 其他 props（如 apiEndpoint, pageType）的变化不需要重新加载组件
    
    loadProjectChatbotComponent<ComponentType<ChatbotWidgetProps>>(
      props.companyId,
      'ChatbotWidget'
    )
      .then((Component) => {
        if (!Component) {
          throw new Error('Component loaded but is null or undefined')
        }
        console.log('Component loaded successfully:', Component)
        setChatbotWidget(() => Component)
        setError(null) // 清除之前的错误
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        console.error('Failed to load project component:', err)
      })
  }, [props.companyId]) // 只依赖 companyId，因为这是决定加载哪个组件的唯一因素
  
  if (error) {
    return (
      <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <p className="text-red-500 font-semibold mb-2 text-sm">组件加载失败</p>
        <p className="text-gray-600 text-xs">{error}</p>
      </div>
    )
  }
  
  if (!ChatbotWidget) {
    return (
      <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <p className="text-gray-600 text-sm">加载组件中...</p>
      </div>
    )
  }
  
  // 确保 props 不为 null/undefined
  if (!props || !props.companyId) {
    console.error('DynamicChatbotWidget: Invalid props', props)
    return (
      <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <p className="text-red-500 font-semibold mb-2 text-sm">组件参数错误</p>
        <p className="text-gray-600 text-xs">缺少必要的参数</p>
      </div>
    )
  }
  
  // 确保组件是有效的函数
  if (typeof ChatbotWidget !== 'function') {
    console.error('DynamicChatbotWidget: Component is not a function', ChatbotWidget)
    return (
      <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <p className="text-red-500 font-semibold mb-2 text-sm">组件类型错误</p>
        <p className="text-gray-600 text-xs">组件不是有效的 React 组件</p>
      </div>
    )
  }
  
  try {
    return <ChatbotWidget {...props} />
  } catch (error) {
    console.error('Error rendering ChatbotWidget:', error)
    return (
      <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <p className="text-red-500 font-semibold mb-2 text-sm">渲染错误</p>
        <p className="text-gray-600 text-xs">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    )
  }
}

