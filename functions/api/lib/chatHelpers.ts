/**
 * 聊天辅助函数
 * 提取自 chat.ts，供多租户架构使用
 */

import { KnowledgeBase } from './knowledge.js';
import { ContextManager, ConversationContext } from './contextManager.js';

/**
 * 聊天响应接口
 */
export interface ChatResponse {
  reply: string;
  intent: string;
  conversationId?: string;
  updatedContext?: {
    last_intent?: string;
    slots?: Record<string, any>;
  };
  suggestedQuickReplies?: string[];
}

/**
 * 构建响应
 */
export function buildResponse(
  reply: string,
  intent: string,
  conversationId: string,
  mergedEntities: Record<string, any>,
  cm: ContextManager,
  kb: KnowledgeBase,
  userMessage: string,
  corsHeaders: Record<string, string>,
  nextState?: ConversationContext['state']
): Response {
  cm.updateContext(conversationId, {
    last_intent: intent,
    slots: mergedEntities,
    userMessage,
    assistantMessage: reply,
    state: nextState,
  });

  const response: ChatResponse = {
    reply,
    intent,
    conversationId,
    updatedContext: {
      last_intent: intent,
      slots: mergedEntities,
    },
    suggestedQuickReplies: getSuggestedQuickReplies(intent, mergedEntities, nextState, kb),
  };

  return new Response(
    JSON.stringify(response),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * 意图分类（配置驱动版本）
 */
export function classifyIntent(
  message: string,
  context?: { last_intent?: string; slots?: Record<string, any> },
  knowledgeBase?: KnowledgeBase
): string {
  const lowerMessage = message.toLowerCase();

  // 尝试从知识库获取配置
  let intentConfig = null;
  if (knowledgeBase) {
    try {
      intentConfig = knowledgeBase.getIntentConfig();
    } catch (error) {
      console.warn('[ChatHelpers] Failed to get intent config from knowledge base:', error);
    }
  }

  // 如果没有配置，使用 fallback 逻辑
  if (!intentConfig || !intentConfig.intents) {
    // Fallback: 使用上次的意图（如果上下文存在且消息很短）
    if (context?.last_intent && lowerMessage.length < 10) {
      return context.last_intent;
    }
    return 'service_inquiry'; // 预设意图
  }

  // 按优先级排序意图配置
  const sortedIntents = [...intentConfig.intents].sort((a, b) => a.priority - b.priority);

  // 遍历配置，找到匹配的意图
  for (const intent of sortedIntents) {
    // 检查关键字匹配
    const hasKeyword = intent.keywords.some(keyword => lowerMessage.includes(keyword));

    // 检查上下文关键字匹配
    const hasContextKeyword = intent.contextKeywords.length > 0 && 
      intent.contextKeywords.some(ctx => lowerMessage.includes(ctx));
    
    // 检查排除关键字
    const hasExcludeKeyword = intent.excludeKeywords.length > 0 &&
      intent.excludeKeywords.some(exclude => lowerMessage.includes(exclude));

    // 特殊条件检查（例如：短消息）
    let matchesSpecialCondition = false;
    if (intent.specialConditions) {
      if (intent.specialConditions.shortMessage && 
          lowerMessage.length < (intent.specialConditions.shortMessageThreshold || 5)) {
        matchesSpecialCondition = true;
      }
    }

    // 如果匹配关键字或上下文关键字，且没有排除关键字，则返回该意图
    if ((hasKeyword || hasContextKeyword || matchesSpecialCondition) && !hasExcludeKeyword) {
      return intent.id;
    }
  }

  // 如果没有匹配，使用 fallback 逻辑
  if (intentConfig.fallback.useContextIntent && 
      context?.last_intent && 
      lowerMessage.length < intentConfig.fallback.contextIntentThreshold) {
    return context.last_intent;
  }

  return intentConfig.fallback.defaultIntent;
}

/**
 * 统一实体提取函数（配置驱动版本）
 */
function extractEntityByPatterns(
  message: string,
  patterns: Array<{ keywords: string[]; id: string }>
): string | undefined {
  const lowerMessage = message.toLowerCase();
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return pattern.id;
    }
  }
  return undefined;
}

/**
 * 实体提取（配置驱动版本）
 */
export function extractEntities(
  message: string,
  knowledgeBase?: KnowledgeBase
): Record<string, any> {
  const lowerMessage = message.toLowerCase();
  const entities: Record<string, any> = {};

  // 尝试从知识库获取配置
  let entityPatterns = null;
  if (knowledgeBase) {
    try {
      entityPatterns = knowledgeBase.getEntityPatterns();
    } catch (error) {
      console.warn('[ChatHelpers] Failed to get entity patterns from knowledge base:', error);
    }
  }

  // 如果没有配置，使用 fallback 逻辑（简单匹配）
  if (!entityPatterns || !entityPatterns.patterns) {
    // Fallback: 基本的实体提取逻辑
    if (lowerMessage.includes('预约') || lowerMessage.includes('book')) {
      entities.booking_action = 'book';
    }
    return entities;
  }

  const patterns = entityPatterns.patterns;

  // 提取 service_type（使用统一函数）
  if (patterns.service_type) {
    entities.service_type = extractEntityByPatterns(message, patterns.service_type);
  }

  // 提取 use_case
  if (patterns.use_case) {
    entities.use_case = extractEntityByPatterns(message, patterns.use_case);
  }

  // 提取 persona
  if (patterns.persona) {
    entities.persona = extractEntityByPatterns(message, patterns.persona);
  }

  // 提取 branch（特殊处理：对象结构）
  if (patterns.branch) {
    for (const [branchId, branchConfig] of Object.entries(patterns.branch)) {
      if (branchConfig.keywords.some(keyword => lowerMessage.includes(keyword))) {
        entities.branch = branchId;
        break;
      }
    }
  }

  // 提取 booking_action（特殊处理：对象结构）
  if (patterns.booking_action) {
    for (const [actionId, actionConfig] of Object.entries(patterns.booking_action)) {
      if (actionConfig.keywords.some(keyword => lowerMessage.includes(keyword))) {
        entities.booking_action = actionId;
        break;
      }
    }
  }

  return entities;
}

/**
 * FAQ 处理规则配置
 */
interface FAQRule {
  shouldCheckFAQ: (message: string) => boolean;
  faqFilter?: (faq: any, message?: string) => boolean;
}

const faqHandlingRules: Record<string, FAQRule> = {
  location_inquiry: {
    shouldCheckFAQ: () => true,
  },
  price_inquiry: {
    shouldCheckFAQ: (msg) => {
      const lower = msg.toLowerCase();
      return ['可以跟我說到', '說到多細', '哪些一定要', '再問真人', '報價範圍']
        .some(k => lower.includes(k));
    },
    faqFilter: (faq) => faq.critical && faq.id === 'policy_price_scope',
  },
  booking_inquiry: {
    shouldCheckFAQ: (msg) => {
      const lower = msg.toLowerCase();
      return ['改期', '取消', 'reschedule', 'cancel'].some(k => lower.includes(k));
    },
    faqFilter: (faq, message) => {
      if (!faq.critical) return false;
      if (faq.id === 'policy_reschedule_cancel') return true;
      if (message && faq.keywords && faq.keywords.some((k: string) => 
        message.toLowerCase().includes(k.toLowerCase())
      )) return true;
      return false;
    },
  },
};

/**
 * 统一 FAQ 检查处理函数
 */
export function handleFAQIfNeeded(
  intent: string,
  message: string,
  kb: KnowledgeBase,
  context_obj: ConversationContext,
  mergedEntities: Record<string, any>,
  cm: ContextManager,
  corsHeaders: Record<string, string>,
  nextState?: ConversationContext['state']
): Response | null {
  const rule = faqHandlingRules[intent];
  if (!rule || !rule.shouldCheckFAQ(message)) {
    return null; // 不需要检查 FAQ
  }
  
  const faqResults = kb.searchFAQ(message);
  let criticalFAQ: any;
  
  if (rule.faqFilter) {
    criticalFAQ = faqResults.find((faq: any) => rule.faqFilter!(faq, message));
  } else {
    criticalFAQ = faqResults.find((faq: any) => faq.critical);
  }
  
  if (criticalFAQ) {
    return buildResponse(
      criticalFAQ.answer,
      intent,
      context_obj.conversationId,
      mergedEntities,
      cm,
      kb,
      message,
      corsHeaders,
      nextState
    );
  }

  return null; // FAQ 未匹配，继续 LLM 处理
}

/**
 * 获取建议的快速回复（优化版）
 */
export function getSuggestedQuickReplies(
  intent: string,
  entities: Record<string, any>,
  state?: string,
  knowledgeBase?: KnowledgeBase
): string[] {
  // 优先级 1: intent_nba_mapping
  if (knowledgeBase) {
    try {
      const nbaActions = knowledgeBase.getNextBestActions(intent);
      if (nbaActions && nbaActions.length > 0) {
        return nbaActions;
      }
    } catch (error) {
      console.error('[ChatHelpers] Failed to get next best actions from knowledge base:', error);
    }

    // 优先级 2: response_template
    try {
      const responseTemplate = knowledgeBase.getResponseTemplate(intent);
      if (responseTemplate?.next_best_actions?.length > 0) {
        return responseTemplate.next_best_actions;
      }
    } catch (error) {
      console.error('[ChatHelpers] Failed to get response template from knowledge base:', error);
    }
  }

  // 统一的 fallback（简化逻辑）
  return ['我想了解更多', '如何预约', '联络真人'];
}
