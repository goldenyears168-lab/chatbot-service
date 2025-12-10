/**
 * Cloudflare Pages Function: /api/chat
 * 處理 AI 客服聊天請求
 */

import { LLMService } from './lib/llm.js';
import { KnowledgeBase } from './lib/knowledge.js';
import { ContextManager, ConversationContext } from './lib/contextManager.js';
import { 
  getDontUnderstandFirst, 
  getDontUnderstandSecond, 
  getApiErrorTemplate, 
  getTimeoutTemplate,
  getComplaintTemplate,
  getHandoffTemplate,
  getLineInquiryTemplate,
  setKnowledgeBase
} from './lib/responseTemplates.js';

// 初始化服務（單例模式）
let knowledgeBase: KnowledgeBase | null = null;
let llmService: LLMService | null = null;
let contextManager: ContextManager | null = null;
let knowledgeBaseLoading: Promise<KnowledgeBase> | null = null; // 載入中的 Promise

// 載入知識庫（延遲載入）
// ⚠️ 導出供 Pipeline 節點使用
export async function loadKnowledgeBase(request?: Request): Promise<KnowledgeBase> {
  // 如果知識庫已存在且已載入，直接返回
  if (knowledgeBase && knowledgeBase.isLoaded()) {
    return knowledgeBase;
  }
  
  // 如果正在載入中，等待載入完成
  if (knowledgeBaseLoading) {
    console.log('[Chat] Knowledge base is loading, waiting...');
    return await knowledgeBaseLoading;
  }
  
  // 如果知識庫存在但未載入，可能是上次載入失敗，重新創建實例
  if (knowledgeBase && !knowledgeBase.isLoaded()) {
    console.log('[Chat] Knowledge base exists but not loaded, recreating...');
    knowledgeBase = null;
  }
  
  // 創建載入 Promise（防止並發載入）
  knowledgeBaseLoading = (async () => {
    try {
      // 如果知識庫不存在，創建新的實例
      if (!knowledgeBase) {
        knowledgeBase = new KnowledgeBase();
      }
      
      // 從 request URL 構建基礎 URL
      let baseUrl: string | undefined;
      if (request) {
        const url = new URL(request.url);
        baseUrl = `${url.protocol}//${url.host}`;
      }
      
      // 載入知識庫（如果未載入）
      if (!knowledgeBase.isLoaded()) {
        await knowledgeBase.load(baseUrl);
      }
      
      return knowledgeBase;
    } catch (error) {
      // 載入失敗時，清除實例和載入 Promise 以便下次重試
      console.error('[Chat] Knowledge base loading failed, clearing instance:', error);
      knowledgeBase = null;
      knowledgeBaseLoading = null;
      throw error;
    } finally {
      // 載入完成後清除載入 Promise
      knowledgeBaseLoading = null;
    }
  })();
  
  return await knowledgeBaseLoading;
}

// 初始化 LLM 服務
// ⚠️ 導出供 Pipeline 節點使用
export function initLLMService(env: any) {
  if (!llmService) {
    // 在 Cloudflare Pages Functions 中，环境变量通过 env 参数访问
    const apiKey = env?.GEMINI_API_KEY;
    console.log('[Init LLM] Checking API key...');
    console.log('[Init LLM] env object exists:', !!env);
    console.log('[Init LLM] API Key exists:', !!apiKey);
    // 不記錄 API Key 長度，避免泄露信息
    if (apiKey) {
      // 只記錄是否以正確前綴開頭，不記錄任何實際字符
      console.log('[Init LLM] API Key format valid:', apiKey.startsWith('AIza'));
      try {
        llmService = new LLMService(apiKey);
        console.log('[Init LLM] LLM service initialized successfully');
      } catch (error) {
        console.error('[Init LLM] Failed to initialize LLM service:', error);
        throw error;
      }
    } else {
      console.error('[Init LLM] GEMINI_API_KEY not found in env');
      console.log('[Init LLM] Available env keys:', env ? Object.keys(env) : 'env is null/undefined');
    }
  }
  return llmService;
}

// 初始化 Context Manager
// ⚠️ 導出供 Pipeline 節點使用
export function initContextManager() {
  if (!contextManager) {
    contextManager = new ContextManager();
  }
  return contextManager;
}

// 介面定義
interface ChatRequestBody {
  message: string;
  source?: 'menu' | 'input';  // 新增字段：消息来源（菜单选择或手动输入）
  mode?: 'auto' | 'decision_recommendation' | 'faq_flow_price';
  pageType?: 'home' | 'qa';
  conversationId?: string;
  context?: {
    last_intent?: string;
    slots?: {
      service_type?: string;
      use_case?: string;
      persona?: string;
    };
  };
}

interface ChatResponse {
  reply: string;
  intent: string;
  conversationId?: string;
  updatedContext?: {
    last_intent?: string;
    slots?: {
      service_type?: string;
      use_case?: string;
      persona?: string;
      price_range?: string;
      branch?: string;
      booking_action?: string;
    };
  };
  suggestedQuickReplies?: string[];
}

/**
 * 統一響應構建函數
 * 減少重複的響應構建代碼（減少 ~35 個條件判斷）
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
 * FAQ 處理規則配置
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
 * 統一 FAQ 檢查處理函數
 * 減少重複的 FAQ 檢查邏輯（減少 ~12 個條件判斷）
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
    return null; // 不需要檢查 FAQ
  }
  
  const faqResults = kb.searchFAQ(message);
  let criticalFAQ: any;
  
  if (rule.faqFilter) {
    // 如果有自定義過濾器，傳入 message 參數（如果過濾器需要）
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

  return null; // FAQ 未匹配，繼續 LLM 處理
}

/**
 * 意圖分類（配置驅動版本）
 * 使用 intent_config.json 配置文件，減少硬編碼（減少 ~12 個條件判斷）
 */
export function classifyIntent(
  message: string,
  context?: { last_intent?: string; slots?: Record<string, any> },
  knowledgeBase?: KnowledgeBase
): string {
  const lowerMessage = message.toLowerCase();

  // 嘗試從知識庫獲取配置
  let intentConfig = null;
  if (knowledgeBase) {
    try {
      intentConfig = knowledgeBase.getIntentConfig();
    } catch (error) {
      console.warn('[Chat] Failed to get intent config from knowledge base:', error);
    }
  }

  // 如果沒有配置，使用 fallback 邏輯
  if (!intentConfig || !intentConfig.intents) {
    // Fallback: 使用上次的意圖（如果上下文存在且訊息很短）
    if (context?.last_intent && lowerMessage.length < 10) {
      return context.last_intent;
    }
    return 'service_inquiry'; // 預設意圖
  }

  // 按優先級排序意圖配置
  const sortedIntents = [...intentConfig.intents].sort((a, b) => a.priority - b.priority);

  // 遍歷配置，找到匹配的意圖
  for (const intent of sortedIntents) {
    // 檢查關鍵字匹配
    const hasKeyword = intent.keywords.some(keyword => lowerMessage.includes(keyword));

    // 檢查上下文關鍵字匹配
    const hasContextKeyword = intent.contextKeywords.length > 0 && 
      intent.contextKeywords.some(ctx => lowerMessage.includes(ctx));
    
    // 檢查排除關鍵字
    const hasExcludeKeyword = intent.excludeKeywords.length > 0 &&
      intent.excludeKeywords.some(exclude => lowerMessage.includes(exclude));

    // 特殊條件檢查（例如：短訊息）
    let matchesSpecialCondition = false;
    if (intent.specialConditions) {
      if (intent.specialConditions.shortMessage && 
          lowerMessage.length < (intent.specialConditions.shortMessageThreshold || 5)) {
        matchesSpecialCondition = true;
      }
    }

    // 如果匹配關鍵字或上下文關鍵字，且沒有排除關鍵字，則返回該意圖
    if ((hasKeyword || hasContextKeyword || matchesSpecialCondition) && !hasExcludeKeyword) {
      return intent.id;
    }
  }

  // 如果沒有匹配，使用 fallback 邏輯
  if (intentConfig.fallback.useContextIntent && 
      context?.last_intent && 
      lowerMessage.length < intentConfig.fallback.contextIntentThreshold) {
    return context.last_intent;
  }

  return intentConfig.fallback.defaultIntent;
}

/**
 * 統一實體提取函數（配置驅動版本）
 * 使用 entity_patterns.json 配置文件，減少硬編碼（減少 ~15 個條件判斷）
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
 * 實體提取（配置驅動版本）
 */
export function extractEntities(
  message: string,
  knowledgeBase?: KnowledgeBase
): Record<string, any> {
  const lowerMessage = message.toLowerCase();
  const entities: Record<string, any> = {};

  // 嘗試從知識庫獲取配置
  let entityPatterns = null;
  if (knowledgeBase) {
    try {
      entityPatterns = knowledgeBase.getEntityPatterns();
    } catch (error) {
      console.warn('[Chat] Failed to get entity patterns from knowledge base:', error);
    }
  }

  // 如果沒有配置，使用 fallback 邏輯（簡單匹配）
  if (!entityPatterns || !entityPatterns.patterns) {
    // Fallback: 基本的實體提取邏輯
    if (lowerMessage.includes('預約') || lowerMessage.includes('book')) {
      entities.booking_action = 'book';
    }
    return entities;
    }

  const patterns = entityPatterns.patterns;

  // 提取 service_type（使用統一函數）
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

  // 提取 branch（特殊處理：對象結構）
  if (patterns.branch) {
    for (const [branchId, branchConfig] of Object.entries(patterns.branch)) {
      if (branchConfig.keywords.some(keyword => lowerMessage.includes(keyword))) {
        entities.branch = branchId;
      break;
    }
  }
  }

  // 提取 booking_action（特殊處理：對象結構）
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
 * 取得建議的快速回覆（優化版）
 * 優先使用知識庫，簡化 fallback 邏輯（減少 ~6 個條件判斷）
 */
function getSuggestedQuickReplies(
  intent: string,
  entities: Record<string, any>,
  state?: string,
  knowledgeBase?: any
): string[] {
  // 優先級 1: intent_nba_mapping
  if (knowledgeBase) {
    try {
      const nbaActions = knowledgeBase.getNextBestActions(intent);
      if (nbaActions && nbaActions.length > 0) {
        return nbaActions;
      }
    } catch (error) {
      console.error('[Chat] Failed to get next best actions from knowledge base:', error);
    }

    // 優先級 2: response_template
    try {
      const responseTemplate = knowledgeBase.getResponseTemplate(intent);
      if (responseTemplate?.next_best_actions?.length > 0) {
        return responseTemplate.next_best_actions;
      }
    } catch (error) {
      console.error('[Chat] Failed to get response template from knowledge base:', error);
    }
  }

  // 統一的 fallback（簡化邏輯）
  return ['我想了解更多', '如何預約', '聯絡真人'];
}

/**
 * Cloudflare Pages Function Handler - POST
 * 
 * ⚠️ 注意：此函數已重構為使用 Pipeline 模式
 * 使用動態導入以避免循環依賴
 */
export async function onRequestPost(context: {
  request: Request;
  env: any;
  waitUntil: (promise: Promise<any>) => void;
}): Promise<Response> {
  // 使用 Pipeline 版本（動態導入避免循環依賴）
  const { onRequestPostPipeline } = await import('./chat-pipeline.js');
  return onRequestPostPipeline(context);
}

/**
 * Cloudflare Pages Function Handler - OPTIONS
 * 處理 CORS 預檢請求
 */
export async function onRequestOptions(context: {
  request: Request;
  env: any;
}): Promise<Response> {
  const { request, env } = context;
  
  // 從環境變數讀取允許的域名
  const allowedDomains = env?.CHATBOT_ALLOWED_ORIGINS || '';
  
  const defaults = [
    'https://www.goldenyearsphoto.com',
    'https://goldenyearsphoto.com',
    'https://goldenyearsphoto.pages.dev',
    // 開發環境
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
  ];
  
  // 合併預設和配置的域名
  const configured = allowedDomains
    .split(',')
    .map((d: string) => d.trim())
    .filter(Boolean);
  
  const allowedOrigins = [...defaults, ...configured];
  
  const origin = request.headers.get('Origin');
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0];
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
  
  return new Response(null, { 
    status: 204, 
    headers: corsHeaders 
  });
}

/**
 * 舊版本的 onRequestPost（作為備份）
 * 保留用於對比測試和回滾
 */
async function onRequestPost_legacy(context: {
  request: Request;
  env: any;
  waitUntil: (promise: Promise<any>) => void;
}): Promise<Response> {
  const { request, env } = context;
  const startTime = Date.now();
  const TIMEOUT_MS = 10000; // 10 秒超時

  // CORS headers - 限制允許的來源
  const allowedOrigins = [
    'https://goldenyearsphoto.pages.dev',
    'https://www.goldenyearsphoto.com',
    'https://goldenyearsphoto.com',
    // 開發環境
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ];
  
  const origin = request.headers.get('Origin');
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // 處理 OPTIONS 請求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 驗證 Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Content-Type', message: '請求必須使用 application/json' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 解析請求體（添加錯誤處理）
    let body: ChatRequestBody;
    try {
      body = await request.json();
    } catch (error) {
      console.error('[Chat] Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON', message: '請求體必須是有效的 JSON 格式' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 驗證必要欄位
    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', message: 'message 欄位為必填且不能為空' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 驗證 message 長度
    if (body.message.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', message: 'message 長度不能超過 1000 字元' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 驗證 conversationId 格式（如果提供）
    if (body.conversationId) {
      if (typeof body.conversationId !== 'string' || 
          body.conversationId.length > 100 ||
          !/^conv_[a-zA-Z0-9_]+$/.test(body.conversationId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request', message: 'conversationId 格式不正確' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 驗證 mode 值
    if (body.mode && !['auto', 'decision_recommendation', 'faq_flow_price'].includes(body.mode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', message: 'mode 值不正確' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 驗證 source 值
    if (body.source && !['menu', 'input'].includes(body.source)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', message: 'source 值不正確' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 驗證 pageType 值
    if (body.pageType && !['home', 'qa'].includes(body.pageType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', message: 'pageType 值不正確' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 載入知識庫
    console.log('[Chat] Loading knowledge base...');
    // 不記錄完整 URL，避免泄露敏感信息
    const url = new URL(request.url);
    console.log('[Chat] Request host:', url.host);
    let kb;
    try {
      kb = await loadKnowledgeBase(request);
      console.log('[Chat] Knowledge base loaded successfully');
    } catch (error) {
      console.error('[Chat] Failed to load knowledge base:', error);
      console.error('[Chat] Error details:', error instanceof Error ? {
        message: error.message,
        stack: error.stack?.substring(0, 500) // 限制 stack 長度
      } : String(error));
      // 重新拋出錯誤，讓上層 catch 處理
      throw error;
    }
    
    // 設置 responseTemplates 的 knowledgeBase 實例
    setKnowledgeBase(kb);

    // 初始化服務
    console.log('[Chat] Initializing services...');
    const llm = initLLMService(env);
    const cm = initContextManager();
    console.log('[Chat] Services initialized. LLM available:', !!llm);

    const mode = body.mode || 'auto';

    // 取得或建立上下文
    let context_obj: ConversationContext;
    if (body.conversationId) {
      const existingContext = cm.getContext(body.conversationId);
      if (existingContext) {
        context_obj = existingContext;
      } else {
        context_obj = cm.createContext(body.conversationId);
      }
    } else {
      context_obj = cm.createContext();
    }

    // 意圖分類（使用配置驅動）
    const intent = classifyIntent(body.message, {
      last_intent: context_obj.last_intent,
      slots: context_obj.slots,
    }, kb);

    // 實體提取（使用配置驅動）
    const entities = extractEntities(body.message, kb);

    // 合併上下文中的實體
    const mergedEntities = {
      ...context_obj.slots,
      ...entities,
    };

    // 決定下一個狀態（使用配置驅動）
    let nextState: ConversationContext['state'] = context_obj.state;
    try {
      const stateTransitionsConfig = kb.getStateTransitionsConfig();
      if (stateTransitionsConfig) {
        // 檢查是否有必需的 slots（使用配置中的規則）
        const requiredSlotsCheck = stateTransitionsConfig.requiredSlotsCheck;
        let hasRequiredSlots = false;
        if (requiredSlotsCheck) {
          if (requiredSlotsCheck.requireAny) {
            // 需要任意一個字段
            hasRequiredSlots = requiredSlotsCheck.fields.some(field => mergedEntities[field]);
          } else {
            // 需要所有字段
            hasRequiredSlots = requiredSlotsCheck.fields.every(field => mergedEntities[field]);
          }
        } else {
          // 默認邏輯：至少需要 service_type 或 use_case
          hasRequiredSlots = !!(mergedEntities.service_type || mergedEntities.use_case);
        }

        nextState = cm.determineNextState(
          context_obj.state,
        intent,
          hasRequiredSlots,
          {
            transitions: stateTransitionsConfig.transitions,
            requiredSlotsCheck: stateTransitionsConfig.requiredSlotsCheck,
          }
        );
      } else {
        // 如果沒有配置，使用 fallback 邏輯
        const hasRequiredSlots = !!(mergedEntities.service_type || mergedEntities.use_case);
        nextState = cm.determineNextState(context_obj.state, intent, hasRequiredSlots);
    }
    } catch (error) {
      console.warn('[Chat] Failed to determine next state, using current state:', error);
      // 使用當前狀態作為 fallback
    }

    // 檢查 Line 官方帳號詢問（使用統一響應構建函數）
    if (body.message.includes('line') || body.message.includes('Line') || body.message.includes('LINE')) {
      return buildResponse(
        getLineInquiryTemplate(),
        intent,
        context_obj.conversationId,
        mergedEntities,
        cm,
        kb,
        body.message,
        corsHeaders,
        nextState
      );
    }

    // 意圖處理器映射表（使用統一響應構建函數）
    const intentHandlers: Record<string, () => string> = {
      complaint: getComplaintTemplate,
      handoff_to_human: getHandoffTemplate,
    };

    if (intentHandlers[intent]) {
      return buildResponse(
        intentHandlers[intent](),
        intent,
        context_obj.conversationId,
        mergedEntities,
        cm,
        kb,
        body.message,
        corsHeaders,
        nextState
      );
    }

    // 統一 FAQ 檢查處理（減少重複代碼）
    // 注意：對於「如何預約」這類問題，不直接使用 FAQ，而是讓 LLM 處理以確保提供預約連結
    // 對於「價格詢問」，只有明確問政策時才用 FAQ，一般「多少錢」直接回答價格
    const faqResponse = handleFAQIfNeeded(
          intent,
      body.message,
      kb,
      context_obj,
      mergedEntities,
      cm,
      corsHeaders,
      nextState
    );
    if (faqResponse) {
      return faqResponse;
    }

    // 處理菜單選擇的消息：優先使用 FAQ 匹配
    // 當 source === 'menu' 時，優先使用 FAQ 匹配，匹配成功直接返回，不調用 LLM
    if (body.source === 'menu') {
      console.log('[Chat] Menu source detected, prioritizing FAQ match');
      const faqResults = kb.searchFAQDetailed(body.message);
      
      if (faqResults && faqResults.length > 0) {
        // 找到匹配的 FAQ，使用統一響應構建函數
        const matchedFAQ = faqResults[0]; // 取分數最高的
        console.log('[Chat] FAQ matched:', matchedFAQ.id);
        
        return buildResponse(
          matchedFAQ.answer,
          intent,
          context_obj.conversationId,
          mergedEntities,
          cm,
          kb,
          body.message,
          corsHeaders,
          nextState
        );
      } else {
        // FAQ 匹配失敗，繼續使用 LLM 處理（作為 fallback）
        console.log('[Chat] FAQ match failed, falling back to LLM');
      }
    }

    // 使用 LLM 生成回覆
    if (!llm) {
      // LLM 服務不可用時的特殊處理（503 狀態碼，無 suggestedQuickReplies）
      const reply = getApiErrorTemplate();
      return new Response(
        JSON.stringify({
        reply,
        intent: 'handoff_to_human',
        conversationId: context_obj.conversationId,
        updatedContext: {
          last_intent: 'handoff_to_human',
          slots: mergedEntities,
        },
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 構建 LLM 上下文
    const history = context_obj.history.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.text,
    }));

    // 使用 Promise.race 實現超時（修復內存泄漏）
    const replyPromise = llm.generateReply({
      message: body.message,
      intent,
      entities: mergedEntities,
      context: {
        last_intent: context_obj.last_intent,
        slots: mergedEntities,
        history,
      },
      mode,
      knowledgeBase: kb, // 傳入知識庫實例，用於獲取價格資訊
    });

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
        throw error;
      }
    }

    // 使用統一響應構建函數處理 LLM 生成的回覆
    const responseTime = Date.now() - startTime;
    console.log(`[Chat] ${intent} - ${responseTime}ms`);

    return buildResponse(
      reply,
      intent,
      context_obj.conversationId,
      mergedEntities,
      cm,
      kb,
      body.message,
      corsHeaders,
      nextState
    );

  } catch (error) {
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
    
    const response: ChatResponse = {
      reply: getApiErrorTemplate(),
      intent: 'handoff_to_human',
      updatedContext: {
        last_intent: 'handoff_to_human',
        slots: {},
      },
    };

    return new Response(
      JSON.stringify(response),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

