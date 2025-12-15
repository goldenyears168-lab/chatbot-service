/**
 * 節點 3: 上下文管理
 * 獲取或創建對話上下文
 */

import { PipelineContext } from '../lib/pipeline.js';

/**
 * 上下文管理節點
 */
export async function node_contextManagement(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.contextManager) {
    throw new Error('ContextManager not initialized');
  }

  if (!ctx.body) {
    throw new Error('Request body not validated');
  }

  // 獲取或創建上下文
  let context_obj;
  if (ctx.body.conversationId) {
    const existingContext = ctx.contextManager.getContext(ctx.body.conversationId);
    if (existingContext) {
      context_obj = existingContext;
    } else {
      context_obj = ctx.contextManager.createContext(ctx.body.conversationId);
    }
  } else {
    context_obj = ctx.contextManager.createContext();
  }

  // 存入 context
  ctx.conversationContext = context_obj;

  return ctx;
}

