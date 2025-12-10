/**
 * 節點 5: 狀態轉換
 * 決定下一個對話狀態（使用配置驅動）
 */

import { PipelineContext } from '../lib/pipeline.js';

/**
 * 狀態轉換節點
 */
export async function node_stateTransition(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.knowledgeBase) {
    throw new Error('KnowledgeBase not initialized');
  }

  if (!ctx.contextManager) {
    throw new Error('ContextManager not initialized');
  }

  if (!ctx.conversationContext) {
    throw new Error('ConversationContext not initialized');
  }

  if (!ctx.intent) {
    throw new Error('Intent not extracted');
  }

  if (!ctx.mergedEntities) {
    throw new Error('Merged entities not calculated');
  }

  // 決定下一個狀態（使用配置驅動）
  let nextState = ctx.conversationContext.state;
  
  try {
    const stateTransitionsConfig = ctx.knowledgeBase.getStateTransitionsConfig();
    
    if (stateTransitionsConfig) {
      // 檢查是否有必需的 slots（使用配置中的規則）
      const requiredSlotsCheck = stateTransitionsConfig.requiredSlotsCheck;
      let hasRequiredSlots = false;
      
      if (requiredSlotsCheck) {
        if (requiredSlotsCheck.requireAny) {
          // 需要任意一個字段
          hasRequiredSlots = requiredSlotsCheck.fields.some(field => ctx.mergedEntities![field]);
        } else {
          // 需要所有字段
          hasRequiredSlots = requiredSlotsCheck.fields.every(field => ctx.mergedEntities![field]);
        }
      } else {
        // 默認邏輯：至少需要 service_type 或 use_case
        hasRequiredSlots = !!(ctx.mergedEntities!.service_type || ctx.mergedEntities!.use_case);
      }

      nextState = ctx.contextManager.determineNextState(
        ctx.conversationContext.state,
        ctx.intent,
        hasRequiredSlots,
        {
          transitions: stateTransitionsConfig.transitions,
          requiredSlotsCheck: stateTransitionsConfig.requiredSlotsCheck,
        }
      );
    } else {
      // 如果沒有配置，使用 fallback 邏輯
      const hasRequiredSlots = !!(ctx.mergedEntities!.service_type || ctx.mergedEntities!.use_case);
      nextState = ctx.contextManager.determineNextState(
        ctx.conversationContext.state,
        ctx.intent,
        hasRequiredSlots
      );
    }
  } catch (error) {
    console.warn('[Chat] Failed to determine next state, using current state:', error);
    // 使用當前狀態作為 fallback
    nextState = ctx.conversationContext.state;
  }

  // 存入 context
  ctx.nextState = nextState;

  return ctx;
}

