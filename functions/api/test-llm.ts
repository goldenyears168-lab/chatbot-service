/**
 * 测试 LLM 服务的简化端点
 * 用于诊断 Gemini API 问题
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function onRequestGet(context: { env: any }): Promise<Response> {
  const tests: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    gemini: {},
  };

  try {
    // 测试 1: 环境变量
    tests.environment.hasApiKey = !!context.env.GEMINI_API_KEY;
    tests.environment.apiKeyLength = context.env.GEMINI_API_KEY?.length || 0;
    tests.environment.apiKeyPreview = context.env.GEMINI_API_KEY 
      ? `${context.env.GEMINI_API_KEY.substring(0, 10)}...${context.env.GEMINI_API_KEY.substring(context.env.GEMINI_API_KEY.length - 4)}`
      : 'NOT_SET';

    // 测试 2: Gemini API 初始化
    if (context.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(context.env.GEMINI_API_KEY);
        tests.gemini.initialized = true;

        // 测试 3: 模型获取
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          tests.gemini.modelLoaded = true;

          // 测试 4: 简单的 API 调用
          try {
            const result = await model.generateContent({
              contents: [{
                role: 'user',
                parts: [{ text: '你好' }],
              }],
            });
            const response = result.response;
            tests.gemini.apiCallSuccess = true;
            tests.gemini.responsePreview = response.text().substring(0, 50);
          } catch (apiError: any) {
            tests.gemini.apiCallSuccess = false;
            tests.gemini.apiError = apiError.message || String(apiError);
            tests.gemini.apiErrorDetails = apiError.toString();
          }
        } catch (modelError: any) {
          tests.gemini.modelLoaded = false;
          tests.gemini.modelError = modelError.message || String(modelError);
        }
      } catch (initError: any) {
        tests.gemini.initialized = false;
        tests.gemini.initError = initError.message || String(initError);
      }
    } else {
      tests.gemini.skipped = 'API_KEY_NOT_SET';
    }

    // 返回测试结果
    return new Response(JSON.stringify(tests, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Test failed',
      message: error.message || String(error),
      stack: error.stack,
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

