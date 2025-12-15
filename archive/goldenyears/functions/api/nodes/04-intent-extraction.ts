/**
 * 節點 4: 意圖提取
 * 意圖分類、實體提取、實體合併
 */

import { PipelineContext } from '../lib/pipeline.js';
import { classifyIntent, extractEntities } from '../chat.js';

/**
 * 意圖提取節點
 */
export async function node_intentExtraction(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.knowledgeBase) {
    throw new Error('KnowledgeBase not initialized');
  }

  if (!ctx.body) {
    throw new Error('Request body not validated');
  }

  if (!ctx.conversationContext) {
    throw new Error('ConversationContext not initialized');
  }

  // 意圖分類（使用配置驅動）
  const intent = classifyIntent(ctx.body.message, {
    last_intent: ctx.conversationContext.last_intent,
    slots: ctx.conversationContext.slots,
  }, ctx.knowledgeBase);

  // 實體提取（使用配置驅動）
  const entities = extractEntities(ctx.body.message, ctx.knowledgeBase);

  // 合併上下文中的實體
  const mergedEntities = {
    ...ctx.conversationContext.slots,
    ...entities,
  };

  // 存入 context
  ctx.intent = intent;
  ctx.entities = entities;
  ctx.mergedEntities = mergedEntities;

  return ctx;
}

