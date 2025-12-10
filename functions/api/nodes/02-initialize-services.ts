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
import { loadKnowledgeBase, initLLMService, initContextManager } from '../chat.js';

/**
 * 服務初始化節點
 */
export async function node_initializeServices(ctx: PipelineContext): Promise<PipelineContext> {
  // 載入知識庫
  let kb;
  try {
    console.log('[Chat] Loading knowledge base...');
    const url = new URL(ctx.request.url);
    console.log('[Chat] Request host:', url.host);
    
    kb = await loadKnowledgeBase(ctx.request);
    console.log('[Chat] Knowledge base loaded successfully');
  } catch (error) {
    console.error('[Chat] Failed to load knowledge base:', error);
    console.error('[Chat] Error details:', error instanceof Error ? {
      message: error.message,
      stack: error.stack?.substring(0, 500) // 限制 stack 長度
    } : String(error));
    
    // ⚠️ 關鍵修正 4: 知識庫錯誤必須重新拋出，由外層統一處理
    throw error;
  }
  
  // ⚠️ 關鍵修正 1: 必須在知識庫載入後立即調用 setKnowledgeBase
  // 這影響 responseTemplates 模塊
  setKnowledgeBase(kb);
  
  // 初始化服務
  console.log('[Chat] Initializing services...');
  const llm = initLLMService(ctx.env);
  const cm = initContextManager();
  console.log('[Chat] Services initialized. LLM available:', !!llm);
  
  // 將服務存入 context
  ctx.knowledgeBase = kb;
  ctx.llmService = llm;
  ctx.contextManager = cm;
  
  return ctx;
}

