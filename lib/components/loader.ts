// lib/components/loader.ts
// 动态加载项目特定组件的工具函数

import { ComponentType } from 'react'

/**
 * 加载项目特定的组件
 * @param companyId 项目ID
 * @param componentPath 组件路径，例如 'chatbot/ChatbotWidget' 或 'ui/button'
 * @returns 组件
 * @throws 如果组件不存在，抛出错误
 */
export async function loadProjectComponent<T = ComponentType<any>>(
  companyId: string,
  componentPath: string
): Promise<T> {
  try {
    // 支持两种路径格式：
    // 1. 'ChatbotWidget' -> '@/projects/{companyId}/components/chatbot/ChatbotWidget'
    // 2. 'chatbot/ChatbotWidget' -> '@/projects/{companyId}/components/chatbot/ChatbotWidget'
    // 3. 'ui/button' -> '@/projects/{companyId}/components/ui/button'
    
    const normalizedPath = componentPath.includes('/') 
      ? componentPath 
      : `chatbot/${componentPath}`
    
    const projectComponent = await import(
      `@/projects/${companyId}/components/${normalizedPath}`
    )
    
    // 尝试多种导出方式
    // 1. 优先使用 default export
    // 2. 尝试命名导出（组件名称，如 ChatbotWidget）
    // 3. 尝试从路径提取的组件名
    const componentName = componentPath.split('/').pop()!
    let Component = projectComponent.default
    
    // 如果没有 default export，尝试命名导出
    if (!Component) {
      Component = projectComponent[componentName]
    }
    
    // 如果还是没有，尝试直接使用模块（如果它是函数）
    if (!Component && typeof projectComponent === 'function') {
      Component = projectComponent
    }
    
    // 最后尝试查找任何导出的函数
    if (!Component) {
      const exportedKeys = Object.keys(projectComponent)
      const functionExports = exportedKeys.filter(key => 
        typeof projectComponent[key] === 'function' && 
        key[0] && key[0] === key[0].toUpperCase() // React 组件通常首字母大写
      )
      if (functionExports.length > 0) {
        const firstExport = functionExports[0]
        if (firstExport) {
          Component = projectComponent[firstExport]
        }
      }
    }
    
    if (!Component || typeof Component !== 'function') {
      const availableExports = Object.keys(projectComponent).join(', ')
      throw new Error(
        `Component ${componentPath} not found in project ${companyId}. ` +
        `Looking for: ${componentName}, Available exports: ${availableExports || 'none'}`
      )
    }
    
    return Component as T
  } catch (error) {
    // 提供详细的错误信息
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to load component ${componentPath} from project ${companyId}. ` +
      `Please ensure the file exists at: ` +
      `projects/${companyId}/components/${componentPath.includes('/') ? componentPath : `chatbot/${componentPath}`}.tsx\n` +
      `Original error: ${errorMessage}`
    )
  }
}

/**
 * 加载项目特定的 UI 组件
 * @param companyId 项目ID
 * @param componentName UI组件名称，例如 'button', 'dialog'
 * @returns UI 组件
 */
export async function loadProjectUIComponent<T = ComponentType<any>>(
  companyId: string,
  componentName: string
): Promise<T> {
  return loadProjectComponent<T>(companyId, `ui/${componentName}`)
}

/**
 * 加载项目特定的 Chatbot 组件
 * @param companyId 项目ID
 * @param componentName Chatbot组件名称，例如 'ChatbotWidget', 'ChatWelcome'
 * @returns Chatbot 组件
 */
export async function loadProjectChatbotComponent<T = ComponentType<any>>(
  companyId: string,
  componentName: string
): Promise<T> {
  return loadProjectComponent<T>(companyId, `chatbot/${componentName}`)
}

