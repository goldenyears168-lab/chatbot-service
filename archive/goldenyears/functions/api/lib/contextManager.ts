/**
 * 對話上下文管理器（Cloudflare Pages Functions 版本）
 * 使用內存存儲（後續可升級為 KV）
 */

export interface ConversationContext {
  conversationId: string;
  last_intent?: string;
  slots: {
    service_type?: string;
    use_case?: string;
    persona?: string;
    price_range?: string;
    branch?: string;
    booking_action?: string;
  };
  history: Array<{
    role: 'user' | 'assistant';
    text: string;
    timestamp: number;
  }>;
  state: 'INIT' | 'COLLECTING_INFO' | 'RECOMMENDING' | 'FOLLOW_UP' | 'COMPLETE';
  createdAt: number;
  lastActivityAt: number;
  userMessage?: string;
  assistantMessage?: string;
}

// 全局上下文存儲（在 Cloudflare Workers 中，每個請求是獨立的，但可以通過全局變量共享）
// 注意：這在 Cloudflare Pages Functions 中可能不會持久化，建議後續使用 KV
const contexts: Map<string, ConversationContext> = new Map();
const CONTEXT_TTL = 30 * 60 * 1000; // 30 分鐘
const MAX_CONTEXTS = 1000; // 最大上下文數量，防止內存耗盡
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 每 5 分鐘清理一次

// 定期清理過期上下文（防止內存泄漏）
let lastCleanup = Date.now();
function autoCleanup() {
  const now = Date.now();
  // 每 5 分鐘清理一次
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    const manager = new ContextManager();
    manager.cleanupExpiredContexts();
    
    // 如果上下文數量超過限制，清理最舊的
    if (contexts.size > MAX_CONTEXTS) {
      const sorted = Array.from(contexts.entries())
        .sort((a, b) => a[1].lastActivityAt - b[1].lastActivityAt);
      const toDelete = sorted.slice(0, contexts.size - MAX_CONTEXTS);
      toDelete.forEach(([id]) => contexts.delete(id));
      console.log(`[ContextManager] Cleaned up ${toDelete.length} old contexts`);
    }
  }
}

export class ContextManager {
  /**
   * 取得上下文
   */
  getContext(conversationId: string): ConversationContext | null {
    // 自動清理過期上下文
    autoCleanup();
    
    const context = contexts.get(conversationId);
    if (!context) {
      return null;
    }

    // 檢查是否過期
    if (Date.now() - context.lastActivityAt > CONTEXT_TTL) {
      contexts.delete(conversationId);
      return null;
    }

    return context;
  }

  /**
   * 建立新上下文
   */
  createContext(conversationId?: string): ConversationContext {
    // 自動清理過期上下文
    autoCleanup();
    
    // 如果達到最大數量，清理最舊的
    if (contexts.size >= MAX_CONTEXTS) {
      const sorted = Array.from(contexts.entries())
        .sort((a, b) => a[1].lastActivityAt - b[1].lastActivityAt);
      const toDelete = sorted.slice(0, Math.floor(MAX_CONTEXTS * 0.1)); // 清理 10%
      toDelete.forEach(([id]) => contexts.delete(id));
      console.log(`[ContextManager] Cleaned up ${toDelete.length} contexts to make room`);
    }
    
    const id = conversationId || this.generateConversationId();
    const now = Date.now();

    const context: ConversationContext = {
      conversationId: id,
      slots: {},
      history: [],
      state: 'INIT',
      createdAt: now,
      lastActivityAt: now,
    };

    contexts.set(id, context);
    return context;
  }

  /**
   * 更新上下文
   */
  updateContext(
    conversationId: string,
    updates: {
      last_intent?: string;
      slots?: Record<string, any>;
      userMessage?: string;
      assistantMessage?: string;
      state?: ConversationContext['state'];
    }
  ): void {
    const context = contexts.get(conversationId);
    if (!context) {
      return;
    }

    // 更新欄位
    if (updates.last_intent !== undefined) {
      context.last_intent = updates.last_intent;
    }

    if (updates.slots) {
      context.slots = { ...context.slots, ...updates.slots };
    }

    if (updates.state) {
      context.state = updates.state;
    }

    // 更新歷史記錄
    if (updates.userMessage) {
      context.history.push({
        role: 'user',
        text: updates.userMessage,
        timestamp: Date.now(),
      });
    }

    if (updates.assistantMessage) {
      context.history.push({
        role: 'assistant',
        text: updates.assistantMessage,
        timestamp: Date.now(),
      });
    }

    // 限制歷史記錄長度（保留最近 20 條）
    if (context.history.length > 20) {
      context.history = context.history.slice(-20);
    }

    context.lastActivityAt = Date.now();
    contexts.set(conversationId, context);
  }

  /**
   * 生成對話 ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 清理過期上下文（可選，在 Cloudflare 中可能不需要）
   */
  cleanupExpiredContexts(): void {
    const now = Date.now();
    for (const [id, context] of contexts.entries()) {
      if (now - context.lastActivityAt > CONTEXT_TTL) {
        contexts.delete(id);
      }
    }
  }

  /**
   * 檢查是否有足夠的資訊進行推薦
   */
  hasRequiredSlotsForRecommendation(context: ConversationContext): boolean {
    // 至少需要 service_type 或 use_case
    return !!(context.slots.service_type || context.slots.use_case);
  }

  /**
   * 根據意圖和當前狀態決定下一個狀態（配置驅動版本）
   * @param currentState 當前狀態
   * @param intent 意圖
   * @param hasRequiredSlots 是否有必需的 slots
   * @param stateTransitionsConfig 可選的狀態轉換配置（如果提供則使用配置，否則使用 fallback）
   */
  determineNextState(
    currentState: ConversationContext['state'],
    intent: string,
    hasRequiredSlots: boolean,
    stateTransitionsConfig?: {
      transitions: Record<string, Record<string, string>>;
      requiredSlotsCheck?: {
        fields: string[];
        requireAny: boolean;
      };
    }
  ): ConversationContext['state'] {
    // 如果沒有配置，使用 fallback 邏輯
    if (!stateTransitionsConfig || !stateTransitionsConfig.transitions) {
      return this.determineNextStateFallback(currentState, intent, hasRequiredSlots);
    }

    const transitions = stateTransitionsConfig.transitions[currentState];
    if (!transitions) {
      // 如果當前狀態沒有配置，保持當前狀態
      return currentState;
    }

    // 優先檢查特殊條件（hasRequiredSlots）
    if (transitions.hasRequiredSlots && hasRequiredSlots) {
      return transitions.hasRequiredSlots as ConversationContext['state'];
    }

    // 檢查精確匹配
    if (transitions[intent]) {
      return transitions[intent] as ConversationContext['state'];
    }

    // 檢查模式匹配（支持 | 分隔的多個意圖）
    for (const [pattern, nextState] of Object.entries(transitions)) {
      if (pattern === 'default' || pattern === 'hasRequiredSlots') continue;
      if (pattern.includes('|')) {
        const intentList = pattern.split('|');
        if (intentList.includes(intent)) {
          return nextState as ConversationContext['state'];
        }
      }
    }

    // 使用默認轉換
    return (transitions.default || currentState) as ConversationContext['state'];
  }

  /**
   * Fallback 狀態轉換邏輯（原始硬編碼版本，用於配置缺失時）
   */
  private determineNextStateFallback(
    currentState: ConversationContext['state'],
    intent: string,
    hasRequiredSlots: boolean
  ): ConversationContext['state'] {
    // 狀態轉換邏輯（fallback）
    if (currentState === 'INIT') {
      if (intent === 'greeting') {
        return 'INIT';
      } else if (intent === 'service_inquiry' || intent === 'price_inquiry') {
        return 'COLLECTING_INFO';
      } else if (intent === 'handoff_to_human' || intent === 'complaint') {
        return 'COMPLETE';
      }
    } else if (currentState === 'COLLECTING_INFO') {
      if (hasRequiredSlots) {
        return 'RECOMMENDING';
      } else if (intent === 'handoff_to_human' || intent === 'complaint') {
        return 'COMPLETE';
      }
    } else if (currentState === 'RECOMMENDING') {
      if (intent === 'goodbye' || intent === 'handoff_to_human') {
        return 'COMPLETE';
      } else if (intent === 'service_inquiry' || intent === 'comparison') {
        return 'FOLLOW_UP';
      }
    } else if (currentState === 'FOLLOW_UP') {
      if (intent === 'goodbye' || intent === 'handoff_to_human') {
        return 'COMPLETE';
      }
    }

    // 預設保持當前狀態
    return currentState;
  }
}

