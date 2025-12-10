/**
 * 節點 2: 服務初始化
 * 載入知識庫、初始化 LLM 服務、初始化 Context Manager
 * 
 * ⚠️ 關鍵修正點：
 * 1. 知識庫載入後必須立即調用 setKnowledgeBase(kb)
 * 2. 知識庫錯誤必須重新拋出
 */

import { PipelineContext } from '../lib/pipeline.js';
import { setKnowledgeBase } from '../lib/responseTemplates.js';

/**
 * 服務初始化節點
 * 在多租户架构中，服务已在 [company]/chat.ts 中初始化
 * 这里只需要设置 responseTemplates 的知识库引用
 */
export async function node_initializeServices(ctx: PipelineContext): Promise<PipelineContext> {
  // 服务已在 [company]/chat.ts 中初始化，这里只需要验证
  if (!ctx.knowledgeBase) {
    throw new Error('Knowledge base not initialized');
  }
  if (!ctx.llmService) {
    throw new Error('LLM service not initialized');
  }
  if (!ctx.contextManager) {
    throw new Error('Context manager not initialized');
  }
  
  console.log(`[Node02-${ctx.companyId}] Services initialized successfully`);
  
  // 设置 responseTemplates 的知识库引用
  let kb;
  try {
    kb = ctx.knowledgeBase;
    console.log(`[Node02-${ctx.companyId}] Setting knowledge base for responseTemplates`);
    setKnowledgeBase(kb);
  } catch (error) {
    console.error(`[Node02-${ctx.companyId}] Failed to set knowledge base:`, error);
    console.error(`[Node02-${ctx.companyId}] Error details:`, error instanceof Error ? {
      message: error.message,
      stack: error.stack?.substring(0, 500) // 限制 stack 長度
    } : String(error));
    
    // ⚠️ 關鍵修正 4: 知識庫錯誤必須重新拋出，由外層統一處理
    throw error;
  }
  
  return ctx;
}

