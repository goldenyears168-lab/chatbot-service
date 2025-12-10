/**
 * 多租户 Chat API
 * 路径: /api/{company}/chat
 * 
 * 使用 Cloudflare Pages Functions 动态路由
 * 从 URL 参数获取公司 ID，加载对应的知识库和配置
 */

import { Pipeline, PipelineContext } from '../lib/pipeline.js';
import { KnowledgeBase } from '../lib/knowledge.js';
import { LLMService } from '../lib/llm.js';
import { ContextManager } from '../lib/contextManager.js';
import {
  node_validateRequest,
  node_initializeServices,
  node_contextManagement,
  node_intentExtraction,
  node_stateTransition,
  node_specialIntents,
  node_faqCheck,
  node_llmGeneration,
  node_buildResponse,
  handlePipelineError,
} from '../nodes/index.js';
import { getCompanyConfig, isValidCompanyId, getAllowedOrigin } from '../lib/companyConfig.js';

/**
 * POST /api/{company}/chat
 */
export async function onRequestPost(context: {
  request: Request;
  env: any;
  params: { company: string };
}): Promise<Response> {
  const { request, env, params } = context;
  const companyId = params.company;
  const startTime = Date.now();

  try {
    console.log(`[Chat-${companyId}] Received chat request`);

    // 1. 验证公司 ID 格式
    if (!isValidCompanyId(companyId)) {
      console.error(`[Chat-${companyId}] Invalid company ID format`);
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
      console.error(`[Chat-${companyId}] Company not found`);
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
      console.warn(`[Chat-${companyId}] Origin not allowed: ${origin}`);
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
    await knowledgeBase.load(baseUrl, env.ASSETS);

    console.log(`[Chat-${companyId}] Knowledge base loaded`);

    // 5. 初始化 LLM 服务
    const apiKeyEnv = companyConfig.apiConfig.apiKeyEnv || 'GEMINI_API_KEY';
    const apiKey = env[apiKeyEnv];
    
    if (!apiKey) {
      console.error(`[Chat-${companyId}] API key not found: ${apiKeyEnv}`);
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const llmService = new LLMService(apiKey);
    console.log(`[Chat-${companyId}] LLM service initialized`);

    // 6. 初始化 Context Manager（每个公司独立）
    const contextManager = new ContextManager();

    // 7. 创建 Pipeline Context
    const pipelineContext: PipelineContext = {
      request,
      env,
      companyId,
      knowledgeBase,
      llmService,
      contextManager,
      body: null,
      intent: '',
      entities: {},
      conversationContext: null,
      nextState: '',
      reply: '',
      suggestedQuickReplies: [],
      conversationId: '',
      updatedContext: {},
      startTime,
      logs: [],
    };

    // 8. 执行 Pipeline
    console.log(`[Chat-${companyId}] Starting pipeline execution`);
    const pipeline = new Pipeline();
    pipeline.addNode('validateRequest', node_validateRequest);
    pipeline.addNode('initializeServices', node_initializeServices);
    pipeline.addNode('contextManagement', node_contextManagement);
    pipeline.addNode('intentExtraction', node_intentExtraction);
    pipeline.addNode('stateTransition', node_stateTransition);
    pipeline.addNode('specialIntents', node_specialIntents);
    pipeline.addNode('faqCheck', node_faqCheck);
    pipeline.addNode('llmGeneration', node_llmGeneration);
    pipeline.addNode('buildResponse', node_buildResponse);

    const response = await pipeline.execute(pipelineContext);

    // 9. 添加 CORS 头
    const allowedOrigin = getAllowedOrigin(companyConfig, origin);
    const responseWithCors = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

    const responseTime = Date.now() - startTime;
    console.log(`[Chat-${companyId}] Request completed in ${responseTime}ms`);

    return responseWithCors;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[Chat-${companyId}] Error after ${responseTime}ms:`, error);
    
    return handlePipelineError(error, { 
      companyId,
      responseTime 
    });
  }
}

/**
 * OPTIONS /api/{company}/chat (CORS 预检)
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  } catch (error) {
    console.error(`[Chat-${companyId}] OPTIONS error:`, error);
    return new Response(null, { status: 500 });
  }
}
