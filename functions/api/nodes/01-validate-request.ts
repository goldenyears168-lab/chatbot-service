/**
 * 節點 1: 請求驗證
 * 驗證 CORS、Content-Type、請求體格式、所有參數
 */

import { PipelineContext } from '../lib/pipeline.js';

interface ChatRequestBody {
  message: string;
  source?: 'menu' | 'input';
  mode?: 'auto' | 'decision_recommendation' | 'faq_flow_price';
  pageType?: 'home' | 'qa' | 'demo' | 'embed';
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
 * 使用公司配置的 allowedOrigins
 */
function buildCorsHeaders(request: Request, companyConfig?: any): Record<string, string> {
  const origin = request.headers.get('Origin');
  
  // 如果沒有提供公司配置，使用 fallback
  if (!companyConfig || !companyConfig.allowedOrigins) {
    console.warn('[ValidateNode] No company config provided for CORS, using fallback');
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  // 使用公司配置的 allowedOrigins
  const allowedOrigins = companyConfig.allowedOrigins;
  
  // 檢查 origin 是否在允許列表中
  let allowedOrigin = null;
  if (origin) {
    // 直接匹配
    if (allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    }
    // 支持通配符匹配（例如 *.pages.dev）
    else if (origin.includes('.pages.dev') && 
             (allowedOrigins.includes('*.pages.dev') || 
              allowedOrigins.includes('https://*.pages.dev'))) {
      allowedOrigin = origin;
    }
  }
  
  // 如果 origin 不在白名單，使用第一個允許的 origin 作為 fallback
  if (!allowedOrigin) {
    allowedOrigin = allowedOrigins[0];
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * 請求驗證節點
 */
export async function node_validateRequest(ctx: PipelineContext): Promise<PipelineContext | Response> {
  // 1. 構建 CORS headers（使用公司配置）
  if (!ctx.corsHeaders || Object.keys(ctx.corsHeaders).length === 0) {
    ctx.corsHeaders = buildCorsHeaders(ctx.request, ctx.companyConfig);
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

  // 8. mode / source / pageType 放寬：僅檢查型別，不做白名單
  if (body.mode && typeof body.mode !== 'string') {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        message: 'mode 型別不正確' 
      }),
      { status: 400, headers: { ...ctx.corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (body.source && typeof body.source !== 'string') {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        message: 'source 型別不正確' 
      }),
      { status: 400, headers: { ...ctx.corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (body.pageType && typeof body.pageType !== 'string') {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        message: 'pageType 型別不正確' 
      }),
      { status: 400, headers: { ...ctx.corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 驗證通過，將 body 存入 context（並填入預設值）
  ctx.body = {
    mode: body.mode ?? 'auto',
    source: body.source ?? 'input',
    pageType: body.pageType ?? 'demo',
    ...body,
  };
  return ctx;
}

