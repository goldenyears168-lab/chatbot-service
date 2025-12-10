/**
 * 節點 9: 響應構建
 * 構建最終響應
 * 
 * ⚠️ 關鍵修正點：
 * 6. 響應時間日誌記錄
 */

import { PipelineContext } from '../lib/pipeline.js';
import { buildResponse } from '../chat.js';

/**
 * 響應構建節點
 */
export async function node_buildResponse(ctx: PipelineContext): Promise<Response> {
  if (!ctx.reply) {
    throw new Error('Reply not generated');
  }

  if (!ctx.intent) {
    throw new Error('Intent not extracted');
  }

  if (!ctx.conversationContext) {
    throw new Error('ConversationContext not initialized');
  }

  if (!ctx.mergedEntities) {
    throw new Error('Merged entities not calculated');
  }

  if (!ctx.contextManager) {
    throw new Error('ContextManager not initialized');
  }

  if (!ctx.knowledgeBase) {
    throw new Error('KnowledgeBase not initialized');
  }

  if (!ctx.body) {
    throw new Error('Request body not validated');
  }

  if (!ctx.nextState) {
    throw new Error('Next state not determined');
  }

  // ⚠️ 關鍵修正 6: 響應時間日誌記錄
  const responseTime = Date.now() - ctx.startTime;
  console.log(`[Chat] ${ctx.intent} - ${responseTime}ms`);

  // 使用統一響應構建函數處理 LLM 生成的回覆
  return buildResponse(
    ctx.reply,
    ctx.intent,
    ctx.conversationContext.conversationId,
    ctx.mergedEntities,
    ctx.contextManager,
    ctx.knowledgeBase,
    ctx.body.message,
    ctx.corsHeaders,
    ctx.nextState
  );
}

