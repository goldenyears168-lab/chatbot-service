// lib/utils/widget-error.tsx
// 统一的 Widget 错误处理组件

export interface WidgetErrorProps {
  title: string
  message: string
  details?: string
  className?: string
}

/**
 * 统一的错误显示组件
 */
export function WidgetError({ title, message, details, className = '' }: WidgetErrorProps) {
  return (
    <div className={`h-screen w-full flex items-center justify-center ${className}`}>
      <div className="text-center p-6 max-w-md">
        <p className="text-red-500 font-semibold mb-2">{title}</p>
        <p className="text-gray-600 text-sm mb-4">{message}</p>
        {details && (
          <p className="text-xs text-gray-500 mt-2">{details}</p>
        )}
      </div>
    </div>
  )
}

/**
 * 验证 ChatbotWidget props
 */
export function validateChatbotWidgetProps(props: any): { valid: boolean; error?: string } {
  if (!props) {
    return { valid: false, error: '组件未接收到有效的参数' }
  }
  
  if (!props.companyId) {
    return { valid: false, error: '缺少必需的参数: companyId' }
  }
  
  if (!props.apiEndpoint) {
    return { valid: false, error: '缺少必需的参数: apiEndpoint' }
  }
  
  return { valid: true }
}

