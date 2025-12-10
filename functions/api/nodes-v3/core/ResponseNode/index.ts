/**
 * Build Response Node - 响应构建节点
 * 
 * 构建最终的 HTTP 响应，包含回复、意图、上下文等
 * 
 * @version 1.0.0
 * @migrated-from functions/api/nodes/09-build-response.ts
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import { buildResponse } from '../../lib/chatHelpers.js';
import metadata from './metadata.json';

/**
 * Build Response Node 类
 */
export class ResponseNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        reply,
        intent,
        message,
        conversationContext,
        mergedEntities,
        contextManager,
        knowledgeBase,
        corsHeaders,
        nextState,
        startTime: requestStartTime
      } = input;

      // 验证输入
      if (!reply || !intent || !message || !conversationContext ||
          !mergedEntities || !contextManager || !knowledgeBase ||
          !corsHeaders || !nextState) {
        throw new Error('Missing required input');
      }

      // 记录响应时间（如果启用）
      if (this.config.logResponseTime && requestStartTime) {
        const responseTime = Date.now() - requestStartTime;
        this.log(`Response time: ${responseTime}ms for intent: ${intent}`);
        context.setData('responseTime', responseTime);
      }

      // 使用统一响应构建函数
      const response = buildResponse(
        reply,
        intent,
        conversationContext.conversationId,
        mergedEntities,
        contextManager,
        knowledgeBase,
        message,
        corsHeaders,
        nextState
      );

      this.log('Response built successfully');

      // 返回成功结果
      return {
        success: true,
        output: response,
        outputName: 'success',
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          nodeId: this.metadata.id,
        },
      };
    } catch (error) {
      this.log(`Response building error: ${error}`, 'error');
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }
}

export default ResponseNode;
