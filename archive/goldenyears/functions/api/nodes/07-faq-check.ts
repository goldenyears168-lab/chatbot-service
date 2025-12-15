/**
 * 節點 7: FAQ 檢查
 * 統一 FAQ 檢查處理和菜單選擇的 FAQ 匹配
 */

import { PipelineContext } from '../lib/pipeline.js';
import { buildResponse, handleFAQIfNeeded } from '../chat.js';

/**
 * FAQ 檢查節點
 */
export async function node_faqCheck(ctx: PipelineContext): Promise<PipelineContext | Response> {
  if (!ctx.intent) {
    throw new Error('Intent not extracted');
  }

  if (!ctx.body) {
    throw new Error('Request body not validated');
  }

  if (!ctx.knowledgeBase) {
    throw new Error('KnowledgeBase not initialized');
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

  if (!ctx.nextState) {
    throw new Error('Next state not determined');
  }

  // 統一 FAQ 檢查處理（減少重複代碼）
  // 注意：對於「如何預約」這類問題，不直接使用 FAQ，而是讓 LLM 處理以確保提供預約連結
  // 對於「價格詢問」，只有明確問政策時才用 FAQ，一般「多少錢」直接回答價格
  const faqResponse = handleFAQIfNeeded(
    ctx.intent,
    ctx.body.message,
    ctx.knowledgeBase,
    ctx.conversationContext,
    ctx.mergedEntities,
    ctx.contextManager,
    ctx.corsHeaders,
    ctx.nextState
  );
  
  if (faqResponse) {
    return faqResponse;
  }

  // 處理菜單選擇的消息：優先使用 FAQ 匹配
  // 當 source === 'menu' 時，優先使用 FAQ 匹配，匹配成功直接返回，不調用 LLM
  if (ctx.body.source === 'menu') {
    console.log('[Chat] Menu source detected, prioritizing FAQ match');
    const faqResults = ctx.knowledgeBase.searchFAQDetailed(ctx.body.message);
    
    if (faqResults && faqResults.length > 0) {
      // 找到匹配的 FAQ，使用統一響應構建函數
      const matchedFAQ = faqResults[0]; // 取分數最高的
      console.log('[Chat] FAQ matched:', matchedFAQ.id, 'score:', matchedFAQ.score || 'N/A');
      
      // ⚠️ 重要：菜單選擇匹配到 FAQ 時，直接返回，不調用 LLM
      return buildResponse(
        matchedFAQ.answer,
        ctx.intent,
        ctx.conversationContext.conversationId,
        ctx.mergedEntities,
        ctx.contextManager,
        ctx.knowledgeBase,
        ctx.body.message,
        ctx.corsHeaders,
        ctx.nextState
      );
    } else {
      // ⚠️ 關鍵修正：菜單選擇的 FAQ 匹配失敗時，不應該 fallback 到 LLM
      // 因為菜單中的問題應該都有對應的 FAQ 答案
      // 如果沒有匹配到，可能是問題表述不完全一致，嘗試更寬鬆的匹配
      console.log('[Chat] FAQ match failed for menu selection, message:', ctx.body.message);
      console.log('[Chat] Attempting fuzzy match...');
      
      // 嘗試更寬鬆的匹配：提取關鍵字
      const keywords = ctx.body.message.toLowerCase()
        .replace(/我想|我要|我想知道|請問|可以|嗎|呢/g, '')
        .trim();
      
      if (keywords) {
        const fuzzyResults = ctx.knowledgeBase.searchFAQDetailed(keywords);
        if (fuzzyResults && fuzzyResults.length > 0) {
          const matchedFAQ = fuzzyResults[0];
          console.log('[Chat] Fuzzy FAQ matched:', matchedFAQ.id);
          return buildResponse(
            matchedFAQ.answer,
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
      }
      
      // 如果還是沒有匹配到，返回友好的錯誤消息，而不是 fallback 到 LLM
      console.warn('[Chat] No FAQ match found for menu selection, returning friendly message');
      const friendlyMessage = `抱歉，我暫時找不到這個問題的答案。建議您：\n\n1. 查看我們的 [常見問題頁面](/guide/faq/)\n2. 直接透過 Email（goldenyears166@gmail.com）或電話聯絡我們的真人夥伴\n3. 或重新選擇其他問題`;
      
      return buildResponse(
        friendlyMessage,
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
  }

  // 沒有匹配的 FAQ，繼續流程
  return ctx;
}

