/**
 * 節點 99: 錯誤處理
 * 完全復現現有的外層錯誤處理邏輯
 * 
 * ⚠️ 關鍵修正點 5: 必須完全復現現有的錯誤日誌和特殊處理
 */

import { PipelineContext } from '../lib/pipeline.js';
import { getApiErrorTemplate } from '../lib/responseTemplates.js';

/**
 * 錯誤處理節點（用於外層 catch）
 */
export function handlePipelineError(error: unknown, ctx: PipelineContext): Response {
  // ⚠️ 關鍵修正 5: 完全復現現有的錯誤處理邏輯（對應 chat.ts 行 794-832）
  
  // 詳細的錯誤日誌
  console.error('[Chat Error] ========== ERROR START ==========');
  console.error('[Chat Error] Error type:', error instanceof Error ? error.constructor.name : typeof error);
  console.error('[Chat Error] Error message:', error instanceof Error ? error.message : String(error));
  
  // 不記錄完整堆棧，避免泄露內部實現細節
  if (error instanceof Error && error.stack) {
    // 只記錄堆棧的前 200 個字符
    const stackPreview = error.stack.substring(0, 200);
    console.error('[Chat Error] Error stack preview:', stackPreview);
  }
  
  // 檢查是否是知識庫載入錯誤
  if (error instanceof Error && error.message.includes('Failed to load knowledge base')) {
    console.error('[Chat Error] Knowledge base loading failed - this is likely the root cause');
    console.error('[Chat Error] Please check:');
    console.error('[Chat Error] 1. Knowledge files exist in _site/knowledge/ after build');
    console.error('[Chat Error] 2. Knowledge files are accessible via HTTP');
    console.error('[Chat Error] 3. Base URL is correctly constructed');
  }
  
  // 檢查是否是 LLM 初始化錯誤
  if (error instanceof Error && (error.message.includes('GEMINI_API_KEY') || error.message.includes('LLM'))) {
    console.error('[Chat Error] LLM service initialization failed');
    console.error('[Chat Error] Please check GEMINI_API_KEY environment variable in Cloudflare Pages');
  }
  
  console.error('[Chat Error] ========== ERROR END ==========');
  
  // 錯誤響應（格式必須完全一致）
  return new Response(
    JSON.stringify({
      reply: getApiErrorTemplate(),
      intent: 'handoff_to_human',
      updatedContext: {
        last_intent: 'handoff_to_human',
        slots: {},
      },
    }),
    { 
      status: 500, 
      headers: { 
        ...ctx.corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
}

