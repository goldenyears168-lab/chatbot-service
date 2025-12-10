/**
 * 多租户 FAQ Menu API
 * 路径: /api/{company}/faq-menu
 * 
 * 返回公司特定的 FAQ 菜单
 */

import { KnowledgeBase } from '../lib/knowledge.js';
import { getCompanyConfig, isValidCompanyId, getAllowedOrigin } from '../lib/companyConfig.js';

/**
 * GET /api/{company}/faq-menu
 */
export async function onRequestGet(context: {
  request: Request;
  env: any;
  params: { company: string };
}): Promise<Response> {
  const { request, params } = context;
  const companyId = params.company;
  const startTime = Date.now();

  try {
    console.log(`[FAQ-${companyId}] Received FAQ menu request`);

    // 1. 验证公司 ID 格式
    if (!isValidCompanyId(companyId)) {
      console.error(`[FAQ-${companyId}] Invalid company ID format`);
      return new Response(
        JSON.stringify({ error: 'Invalid company ID' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. 加载公司配置
    const companyConfig = await getCompanyConfig(companyId, request);
    if (!companyConfig) {
      console.error(`[FAQ-${companyId}] Company not found`);
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. 验证 CORS（使用支持通配符的验证函数）
    const origin = request.headers.get('Origin');
    const { isOriginAllowed } = await import('../lib/companyConfig.js');
    
    if (origin && !isOriginAllowed(companyConfig, origin)) {
      console.warn(`[FAQ-${companyId}] Origin not allowed: ${origin}`);
      return new Response(
        JSON.stringify({ error: 'CORS not allowed' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 4. 加载知识库
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const knowledgeBase = new KnowledgeBase(companyId);
    await knowledgeBase.load(baseUrl, context.env.ASSETS);

    console.log(`[FAQ-${companyId}] Knowledge base loaded`);

    // 5. 获取 FAQ 菜单
    const faqMenu = knowledgeBase.getFAQMenu();

    // 6. 返回响应（带 CORS）
    const allowedOrigin = getAllowedOrigin(companyConfig, origin);
    
    const responseTime = Date.now() - startTime;
    console.log(`[FAQ-${companyId}] Request completed in ${responseTime}ms`);

    return new Response(JSON.stringify(faqMenu), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[FAQ-${companyId}] Error after ${responseTime}ms:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * OPTIONS /api/{company}/faq-menu (CORS 预检)
 */
export async function onRequestOptions(context: {
  request: Request;
  env: any;
  params: { company: string };
}): Promise<Response> {
  const { request, params } = context;
  const companyId = params.company;

  try {
    // 验证公司 ID
    if (!isValidCompanyId(companyId)) {
      return new Response(null, { status: 400 });
    }

    // 加载公司配置
    const companyConfig = await getCompanyConfig(companyId, request);
    if (!companyConfig) {
      return new Response(null, { status: 404 });
    }

    // 获取允许的 Origin
    const origin = request.headers.get('Origin');
    const allowedOrigin = getAllowedOrigin(companyConfig, origin);

    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  } catch (error) {
    console.error(`[FAQ-${companyId}] OPTIONS error:`, error);
    return new Response(null, { status: 500 });
  }
}
