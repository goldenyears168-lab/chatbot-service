/**
 * 節點 1: 請求驗證
 * 驗證 CORS、Content-Type、請求體格式、所有參數
 */

import { PipelineContext } from '../lib/pipeline.js';

interface ChatRequestBody {
  message: string;
  source?: 'menu' | 'input';
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

/**
 * 構建 CORS headers
 * 支援從環境變數動態讀取允許的來源域名
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
    : null; // 如果不在白名單，返回 null（可選擇拒絕或使用預設值）
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || allowedOrigins[0], // 使用第一個預設值作為 fallback
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * 請求驗證節點
 */
export async function node_validateRequest(ctx: PipelineContext): Promise<PipelineContext | Response> {
  // 1. 構建 CORS headers（必須在處理 OPTIONS 之前）
  if (!ctx.corsHeaders || Object.keys(ctx.corsHeaders).length === 0) {
    ctx.corsHeaders = buildCorsHeaders(ctx.request, ctx.env);
  }

  // 2. 處理 OPTIONS 請求
  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: ctx.corsHeaders 
    });
  }

  // 3. 驗證 Content-Type
  const contentType = ctx.request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid Content-Type', 
        message: '請求必須使用 application/json' 
      }),
      { 
        status: 400, 
        headers: { 
          ...ctx.corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // 4. 解析請求體（添加錯誤處理）
  let body: ChatRequestBody;
  try {
    body = await ctx.request.json();
  } catch (error) {
    console.error('[Chat] Failed to parse request body:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid JSON', 
        message: '請求體必須是有效的 JSON 格式' 
      }),
      { 
        status: 400, 
        headers: { 
          ...ctx.corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // 5. 驗證必要欄位
  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        message: 'message 欄位為必填且不能為空' 
      }),
      { 
        status: 400, 
        headers: { 
          ...ctx.corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // 6. 驗證 message 長度
  if (body.message.length > 1000) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        message: 'message 長度不能超過 1000 字元' 
      }),
      { 
        status: 400, 
        headers: { 
          ...ctx.corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // 7. 驗證 conversationId 格式（如果提供）
  if (body.conversationId) {
    if (typeof body.conversationId !== 'string' || 
        body.conversationId.length > 100 ||
        !/^conv_[a-zA-Z0-9_]+$/.test(body.conversationId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request', 
          message: 'conversationId 格式不正確' 
        }),
        { 
          status: 400, 
          headers: { 
            ...ctx.corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  }

  // 8. 驗證 mode 值
  if (body.mode && !['auto', 'decision_recommendation', 'faq_flow_price'].includes(body.mode)) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        message: 'mode 值不正確' 
      }),
      { 
        status: 400, 
        headers: { 
          ...ctx.corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // 9. 驗證 source 值
  if (body.source && !['menu', 'input'].includes(body.source)) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        message: 'source 值不正確' 
      }),
      { 
        status: 400, 
        headers: { 
          ...ctx.corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // 10. 驗證 pageType 值
  if (body.pageType && !['home', 'qa'].includes(body.pageType)) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        message: 'pageType 值不正確' 
      }),
      { 
        status: 400, 
        headers: { 
          ...ctx.corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }

  // 驗證通過，將 body 存入 context
  ctx.body = body;
  return ctx;
}

