/**
 * Validate Request Node - 请求验证节点
 * 
 * 验证 CORS、Content-Type、请求体格式和所有参数
 * 
 * @version 1.0.0
 * @migrated-from functions/api/nodes/01-validate-request.ts
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import { getAllowedOrigin } from '../../lib/companyConfig.js';
import metadata from './metadata.json';

/**
 * 聊天请求体接口
 */
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
 * Validate Request Node 类
 */
export class ValidateNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { request, companyId, companyConfig } = input;

      // 验证输入
      if (!request || !companyId || !companyConfig) {
        throw new Error('Missing required input: request, companyId, or companyConfig');
      }

      // 1. 构建 CORS headers
      const corsHeaders = this.buildCorsHeaders(request, companyConfig);
      context.setData('corsHeaders', corsHeaders);

      // 2. 处理 OPTIONS 请求
      if (request.method === 'OPTIONS') {
        return {
          success: false,
          output: new Response(null, { 
            status: 204, 
            headers: corsHeaders 
          }),
          outputName: 'error', // 使用 error 输出返回响应
          metadata: {
            executionTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            nodeId: this.metadata.id,
          },
        };
      }

      // 3. 验证 Content-Type
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return this.createErrorResponse(
          'Invalid Content-Type',
          '请求必须使用 application/json',
          400,
          corsHeaders,
          startTime
        );
      }

      // 4. 解析请求体
      let body: ChatRequestBody;
      try {
        body = await request.json();
      } catch (error) {
        this.log('Failed to parse request body', 'error');
        return this.createErrorResponse(
          'Invalid JSON',
          '请求体必须是有效的 JSON 格式',
          400,
          corsHeaders,
          startTime
        );
      }

      // 5. 验证必要字段 - message
      if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
        return this.createErrorResponse(
          'Invalid request',
          'message 字段为必填且不能为空',
          400,
          corsHeaders,
          startTime
        );
      }

      // 6. 验证 message 长度
      if (body.message.length > this.config.maxMessageLength) {
        return this.createErrorResponse(
          'Invalid request',
          `message 长度不能超过 ${this.config.maxMessageLength} 字符`,
          400,
          corsHeaders,
          startTime
        );
      }

      // 7. 验证 conversationId 格式（如果提供）
      if (body.conversationId) {
        if (
          typeof body.conversationId !== 'string' ||
          body.conversationId.length > 100 ||
          !/^conv_[a-zA-Z0-9_]+$/.test(body.conversationId)
        ) {
          return this.createErrorResponse(
            'Invalid request',
            'conversationId 格式不正确',
            400,
            corsHeaders,
            startTime
          );
        }
      }

      // 8. 验证 mode 值
      if (body.mode && !this.config.allowedModes.includes(body.mode)) {
        return this.createErrorResponse(
          'Invalid request',
          `mode 值不正确，允许的值: ${this.config.allowedModes.join(', ')}`,
          400,
          corsHeaders,
          startTime
        );
      }

      // 9. 验证 source 值
      if (body.source && !this.config.allowedSources.includes(body.source)) {
        return this.createErrorResponse(
          'Invalid request',
          `source 值不正确，允许的值: ${this.config.allowedSources.join(', ')}`,
          400,
          corsHeaders,
          startTime
        );
      }

      // 10. 验证 pageType 值
      if (body.pageType && !this.config.allowedPageTypes.includes(body.pageType)) {
        return this.createErrorResponse(
          'Invalid request',
          `pageType 值不正确，允许的值: ${this.config.allowedPageTypes.join(', ')}`,
          400,
          corsHeaders,
          startTime
        );
      }

      this.log(`Request validated successfully for company: ${companyId}`);

      // 验证通过，返回解析后的数据
      return this.createSuccessResult(
        {
          body,
          corsHeaders,
          companyId,
          companyConfig,
        },
        'success',
        Date.now() - startTime
      );
    } catch (error) {
      this.log(`Validation error: ${error}`, 'error');
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }

  /**
   * 构建 CORS headers
   */
  private buildCorsHeaders(request: Request, companyConfig: any): Record<string, string> {
    const origin = request.headers.get('Origin');
    const allowedOrigin = getAllowedOrigin(companyConfig, origin);

    return {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(
    error: string,
    message: string,
    status: number,
    corsHeaders: Record<string, string>,
    startTime: number
  ): NodeExecutionResult {
    const response = new Response(
      JSON.stringify({ error, message }),
      {
        status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: false,
      output: response,
      outputName: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        nodeId: this.metadata.id,
      },
      error: {
        message: `${error}: ${message}`,
      },
    };
  }
}

export default ValidateNode;
