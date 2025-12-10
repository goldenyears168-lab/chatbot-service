/**
 * Cloudflare Cron Trigger Handler
 * 
 * 处理定时任务触发
 * 
 * @version 1.0.0
 */

import { scheduler } from './api/scheduler/TaskScheduler.js';

/**
 * Scheduled event handler
 * 
 * 由 Cloudflare Workers 的 Cron Triggers 调用
 */
export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;

  try {
    console.log('[Scheduled] Cron trigger fired');

    // 获取 cron 表达式（从 URL 参数或请求头）
    const url = new URL(request.url);
    const cronExpression = url.searchParams.get('cron') || request.headers.get('CF-Cron');

    if (cronExpression) {
      // 处理特定的 cron 事件
      await scheduler.handleScheduledEvent(
        { cron: cronExpression },
        env
      );
    } else {
      // 执行所有任务（用于手动触发）
      await scheduler.executeAllTasks(env);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled tasks completed',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[Scheduled] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
