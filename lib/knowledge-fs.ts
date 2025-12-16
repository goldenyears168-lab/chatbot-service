// lib/knowledge-fs.ts
// 文件系统相关代码 - 仅在 Node.js Runtime 中使用
// ⚠️ 此文件不应被 Edge Runtime 路由直接导入
// 只能通过 knowledge.ts 中的动态导入在 Node.js Runtime 中使用

// 标记为 Node.js 专用模块，如果在 Edge Runtime 中被导入会抛出错误
// 这可以防止 Next.js 构建系统在 Edge Runtime 中打包此模块
import 'server-only'
import { logger } from './logger'

export interface KnowledgeBase {
  companyId: string
  services?: unknown
  contactInfo?: unknown
  company_info?: unknown
  aiConfig?: unknown
  ai_config?: unknown
  personas?: unknown
  responseTemplates?: unknown
  response_templates?: unknown
  faq?: unknown
  faq_detailed?: unknown
  [key: string]: unknown
}

/**
 * 从文件系统加载知识库（仅 Node.js 环境）
 */
export async function loadFromFileSystem(companyId: string): Promise<KnowledgeBase> {
  const knowledgeBase: KnowledgeBase = { companyId }
  
  try {
    // 直接使用 Node.js API（此文件已标记为 server-only）
    const { readFile, readdir } = await import('fs/promises')
    const { join } = await import('path')
    
    const cwd = process.cwd()
    const knowledgeDir = join(cwd, 'projects', companyId, 'knowledge')
    const files = await readdir(knowledgeDir)
    
    // 加载所有 JSON 文件
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = join(knowledgeDir, file)
          const content = await readFile(filePath, 'utf-8')
          const key = file.replace('.json', '').replace(/^\d+-/, '') // 移除编号前缀
          const data = JSON.parse(content)
          knowledgeBase[key] = data
          
          // 同时设置带下划线的键名（兼容性）
          if (key.includes('_')) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            knowledgeBase[camelKey] = data
          }
        } catch (error) {
          logger.error(`Failed to load knowledge file ${file} for ${companyId}`, error, { companyId, file })
        }
      }
    }
    
    logger.info(`Loaded knowledge base for ${companyId} from file system`, { companyId })
  } catch (error) {
    logger.error(`Failed to load knowledge base for ${companyId}`, error, { companyId })
  }
  
  return knowledgeBase
}

