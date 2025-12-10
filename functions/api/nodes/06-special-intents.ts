/**
 * 節點 6: 特殊意圖處理
 * Line 詢問、投訴、轉真人等特殊意圖的處理
 */

import { PipelineContext } from '../lib/pipeline.js';
import { buildResponse } from '../chat.js';
import { getLineInquiryTemplate, getComplaintTemplate, getHandoffTemplate } from '../lib/responseTemplates.js';

/**
 * 特殊意圖處理節點
 */
export async function node_specialIntents(ctx: PipelineContext): Promise<PipelineContext | Response> {
  if (!ctx.body) {
    throw new Error('Request body not validated');
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

  if (!ctx.nextState) {
    throw new Error('Next state not determined');
  }

  // 檢查 Line 官方帳號詢問
  if (ctx.body.message.includes('line') || 
      ctx.body.message.includes('Line') || 
      ctx.body.message.includes('LINE')) {
    return buildResponse(
      getLineInquiryTemplate(),
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

  // 意圖處理器映射表（投訴、轉真人）
  const intentHandlers: Record<string, () => string> = {
    complaint: getComplaintTemplate,
    handoff_to_human: getHandoffTemplate,
  };

  if (intentHandlers[ctx.intent]) {
    return buildResponse(
      intentHandlers[ctx.intent](),
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

  // 沒有匹配的特殊意圖，繼續流程
  return ctx;
}

