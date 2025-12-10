/**
 * 健康检查端点
 * 用于验证 Functions 是否正常工作
 */

export async function onRequestGet(): Promise<Response> {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Functions are working!',
      timestamp: new Date().toISOString(),
      service: 'chatbot-service',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
