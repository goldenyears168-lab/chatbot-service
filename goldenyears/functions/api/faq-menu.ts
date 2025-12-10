/**
 * Cloudflare Pages Function: /api/faq-menu
 * 返回 FAQ 菜单结构供前端使用
 */

import { KnowledgeBase } from './lib/knowledge.js';

// 初始化知識庫（單例模式）
let knowledgeBase: KnowledgeBase | null = null;
let knowledgeBaseLoading: Promise<KnowledgeBase> | null = null; // 載入中的 Promise

// 載入知識庫（延遲載入）
async function loadKnowledgeBase(request?: Request): Promise<KnowledgeBase> {
  // 如果知識庫已存在且已載入，直接返回
  if (knowledgeBase && knowledgeBase.isLoaded()) {
    return knowledgeBase;
  }
  
  // 如果正在載入中，等待載入完成
  if (knowledgeBaseLoading) {
    console.log('[FAQ Menu] Knowledge base is loading, waiting...');
    return await knowledgeBaseLoading;
  }
  
  // 如果知識庫存在但未載入，可能是上次載入失敗，重新創建實例
  if (knowledgeBase && !knowledgeBase.isLoaded()) {
    console.log('[FAQ Menu] Knowledge base exists but not loaded, recreating...');
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
      console.error('[FAQ Menu] Knowledge base loading failed, clearing instance:', error);
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

/**
 * Cloudflare Pages Function Handler
 */
/**
 * 構建 CORS headers（支援環境變數配置）
 */
function buildCorsHeaders(request: Request, env?: any): Record<string, string> {
  // 從環境變數讀取允許的域名（用逗號分隔）
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
    .map(d => d.trim())
    .filter(Boolean);
  
  const allowedOrigins = [...defaults, ...configured];
  
  const origin = request.headers.get('Origin');
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0]; // 使用第一個預設值作為 fallback
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
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
  const corsHeaders = buildCorsHeaders(request, env);
  
  return new Response(null, { 
    status: 204, 
    headers: corsHeaders 
  });
}

export async function onRequestGet(context: {
  request: Request;
  env: any;
}): Promise<Response> {
  const { request, env } = context;

  // 構建 CORS headers
  const corsHeaders = buildCorsHeaders(request, env);

  try {
    // 載入知識庫
    console.log('[FAQ Menu] Loading knowledge base...');
    const kb = await loadKnowledgeBase(request);
    console.log('[FAQ Menu] Knowledge base loaded successfully');

    // 取得 FAQ 詳細資料
    const faqDetailed = kb.getFAQDetailed();
    if (!faqDetailed) {
      return new Response(
        JSON.stringify({ error: 'FAQ data not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 構建菜單結構
    const categories = Object.entries(faqDetailed.categories)
      .map(([categoryId, category]) => {
        if (!category || !category.questions) {
          return null;
        }

        // 每個分類最多返回 8 個常見問題
        const questions = category.questions
          .slice(0, 8)
          .map(q => ({
            id: q.id,
            question: q.question,
          }));

        return {
          id: categoryId,
          title: category.title,
          questions: questions,
        };
      })
      .filter(cat => cat !== null); // 過濾掉 null 值

    const response = {
      categories: categories,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FAQ Menu Error]', error);
    console.error('[FAQ Menu Error] Error details:', error instanceof Error ? {
      message: error.message,
      stack: error.stack?.substring(0, 500)
    } : String(error));
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to load FAQ menu',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

