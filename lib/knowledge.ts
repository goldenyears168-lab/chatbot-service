// lib/knowledge.ts
// 知识库管理

import { logger } from './logger'
import { getCachedKnowledgeBase, setCachedKnowledgeBase } from './knowledge-cache'

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
 * 检查是否在 Edge Runtime 中
 * 注意：不能使用任何 Node.js API（如 process.cwd()），因为它们在 Edge Runtime 中不可用
 */
function isEdgeRuntime(): boolean {
  // 只检查环境变量，不使用任何 Node.js API
  return typeof process !== 'undefined' && process.env?.NEXT_RUNTIME === 'edge'
}

// 注意：loadFromFileSystem 函数已完全移除
// 在 Edge Runtime 中，我们只使用 HTTP 加载
// 在 Node.js Runtime 中，如果需要文件系统加载，请使用 knowledge-node.ts

/**
 * 从 HTTP 加载知识库（Edge Runtime 环境）
 */
async function loadFromHTTP(companyId: string, baseUrl?: string): Promise<KnowledgeBase> {
  const knowledgeBase: KnowledgeBase = { companyId }
  
  if (!baseUrl) {
    logger.warn(`No baseUrl provided for ${companyId}, returning empty knowledge base`, { companyId })
    return knowledgeBase
  }
  
  try {
    // 尝试从 public 目录加载
    const knowledgePath = `${baseUrl}/projects/${companyId}/knowledge`
    const files = [
      '1-services.json',
      '2-company_info.json',
      '3-ai_config.json',
      '3-personas.json',
      '3-knowledge_base.json',
      '4-response_templates.json',
      '5-faq_detailed.json',
    ]
    
    let loadedCount = 0
    for (const file of files) {
      try {
        const url = `${knowledgePath}/${file}`
        const response = await fetch(url, { cache: 'no-store' })
        
        if (response.ok) {
          const data = await response.json()
          const key = file.replace('.json', '').replace(/^\d+-/, '')
          knowledgeBase[key] = data
          loadedCount++
          
          // 对于 3-knowledge_base.json，同时设置多个键名以便访问
          if (file === '3-knowledge_base.json') {
            knowledgeBase['knowledge_base'] = data
            knowledgeBase['3-knowledge_base'] = data
          }
          
          // 同时设置带下划线的键名（兼容性）
          if (key.includes('_')) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            knowledgeBase[camelKey] = data
          }
          
          logger.debug(`Loaded ${file} for ${companyId}`, { companyId, file })
        } else {
          logger.warn(`Failed to load ${file}`, { companyId, file, status: response.status, statusText: response.statusText })
        }
      } catch (error) {
        // 忽略单个文件加载失败
        logger.warn(`Failed to load ${file}`, { 
          companyId, 
          file, 
          error: error instanceof Error ? error.message : String(error) 
        })
      }
    }
    
    logger.info(`Loaded ${loadedCount}/${files.length} files for ${companyId} from HTTP`, { companyId, loadedCount, total: files.length })
  } catch (error) {
    logger.error(`Failed to load knowledge base for ${companyId} from HTTP`, error, { companyId })
  }
  
  return knowledgeBase
}

/**
 * 获取完整的知识库（带缓存）
 */
export async function getKnowledgeBase(companyId: string, baseUrl?: string): Promise<KnowledgeBase> {
  // 尝试从缓存获取
  const cached = getCachedKnowledgeBase(companyId)
  if (cached) {
    return cached
  }

  // 如果在 Edge Runtime 中，直接使用 HTTP 加载，完全跳过文件系统
  if (isEdgeRuntime()) {
    const httpBaseUrl = baseUrl || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined)
    if (httpBaseUrl) {
      const knowledgeBase = await loadFromHTTP(companyId, httpBaseUrl)
      // 缓存结果
      setCachedKnowledgeBase(companyId, knowledgeBase)
      return knowledgeBase
    }
    logger.warn(`Edge Runtime detected but no baseUrl provided for ${companyId}`, { companyId })
    return { companyId }
  }
  
  // 在 Node.js 环境中，也使用 HTTP 加载（统一策略）
  // 这样可以避免在 Edge Runtime 构建时检测到文件系统相关的代码
  // 如果需要文件系统加载，请使用 knowledge-node.ts
  
  // 如果文件系统不可用或失败，使用 HTTP 加载
  const httpBaseUrl = baseUrl || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined)
  if (httpBaseUrl) {
    const knowledgeBase = await loadFromHTTP(companyId, httpBaseUrl)
    // 缓存结果
    setCachedKnowledgeBase(companyId, knowledgeBase)
    return knowledgeBase
  }
  
  logger.warn(`No baseUrl provided and file system unavailable for ${companyId}`, { companyId })
  return { companyId }
}

/**
 * 获取 FAQ 菜单
 */
export async function getFAQMenu(companyId: string): Promise<any> {
  const knowledgeBase = await getKnowledgeBase(companyId)
  return knowledgeBase.faq || null
}

