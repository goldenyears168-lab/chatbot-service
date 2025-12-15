/**
 * 節點 8: LLM 生成
 * 使用 LLM 生成回覆
 * 
 * ⚠️ 關鍵修正點：
 * 2. LLM 不可用時返回 503 特殊格式（無 suggestedQuickReplies）
 * 3. 超時處理必須清理 timeoutId（防止內存泄漏）
 */

import { PipelineContext } from '../lib/pipeline.js';
import { getApiErrorTemplate, getTimeoutTemplate } from '../lib/responseTemplates.js';

const TIMEOUT_MS = 10000; // 10 秒超時

/**
 * LLM 生成節點
 */
export async function node_llmGeneration(ctx: PipelineContext): Promise<PipelineContext | Response> {
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

  // ⚠️ 關鍵修正 2: LLM 不可用時的特殊處理
  // ⚠️ 重要：如果是菜單選擇，不應該到達這裡（應該在 FAQ 檢查節點就返回了）
  if (!ctx.llmService) {
    // 檢查是否是菜單選擇（不應該到達這裡）
    if (ctx.body?.source === 'menu') {
      console.error('[Chat] ERROR: Menu selection reached LLM node without FAQ match!');
      // 對於菜單選擇，返回友好的錯誤消息而不是 503
      const reply = '抱歉，系統暫時無法處理這個問題。建議您查看我們的常見問題頁面，或直接聯絡我們的真人夥伴。';
      return new Response(
        JSON.stringify({
          reply,
          intent: ctx.intent || 'handoff_to_human',
          conversationId: ctx.conversationContext.conversationId,
          updatedContext: {
            last_intent: ctx.intent || 'handoff_to_human',
            slots: ctx.mergedEntities,
          },
        }),
        { 
          status: 200, // 返回 200 而不是 503，因為這是菜單選擇
          headers: { 
            ...ctx.corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // 非菜單選擇的 LLM 不可用處理（503 狀態碼，無 suggestedQuickReplies）
    const reply = getApiErrorTemplate();
    return new Response(
      JSON.stringify({
        reply,
        intent: 'handoff_to_human',
        conversationId: ctx.conversationContext.conversationId,
        updatedContext: {
          last_intent: 'handoff_to_human',
          slots: ctx.mergedEntities,
        },
        // ⚠️ 注意：無 suggestedQuickReplies 欄位
      }),
      { 
        status: 503, 
        headers: { 
          ...ctx.corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // 構建 LLM 上下文
  const history = ctx.conversationContext.history.slice(-5).map(msg => ({
    role: msg.role,
    content: msg.text,
  }));

  const mode = ctx.body.mode || 'auto';

  // 使用 Promise.race 實現超時（修復內存泄漏）
  const replyPromise = ctx.llmService.generateReply({
    message: ctx.body.message,
    intent: ctx.intent,
    entities: ctx.mergedEntities,
    context: {
      last_intent: ctx.conversationContext.last_intent,
      slots: ctx.mergedEntities,
      history,
    },
    mode,
    knowledgeBase: ctx.knowledgeBase, // 傳入知識庫實例，用於獲取價格資訊
  });

  // ⚠️ 關鍵修正 3: 超時處理必須清理 timeoutId（防止內存泄漏）
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<string>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS);
  });

  let reply: string;
  
  try {
    reply = await Promise.race([replyPromise, timeoutPromise]) as string;
    
    // 清理定時器（如果還在運行）
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  } catch (error) {
    // 確保清理定時器
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    if (error instanceof Error && error.message === 'Timeout') {
      reply = getTimeoutTemplate();
    } else {
      // ⚠️ 關鍵修正 4: 非超時錯誤必須重新拋出
      throw error;
    }
  }

  // 存入 context
  ctx.reply = reply;

  return ctx;
}

