/**
 * Context Management Node - 上下文管理节点
 * 
 * 获取或创建对话上下文，管理对话历史
 * 
 * @version 1.0.0
 * @migrated-from functions/api/nodes/03-context-management.ts
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import metadata from './metadata.json';

/**
 * Context Management Node 类
 */
export class ContextNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { contextManager, conversationId, requestContext } = input;

      // 验证输入
      if (!contextManager) {
        throw new Error('ContextManager not provided');
      }

      // 获取或创建对话上下文
      let conversationContext;

      if (conversationId) {
        // 尝试获取现有上下文
        const existingContext = contextManager.getContext(conversationId);
        
        if (existingContext) {
          conversationContext = existingContext;
          this.log(`Existing context loaded: ${conversationId}`);
        } else if (this.config.autoCreate) {
          // 创建新上下文
          conversationContext = contextManager.createContext(conversationId);
          this.log(`New context created: ${conversationId}`);
        } else {
          throw new Error(`Context not found and autoCreate is disabled: ${conversationId}`);
        }
      } else {
        // 没有 conversationId，创建新上下文
        conversationContext = contextManager.createContext();
        this.log('New context created without conversationId');
      }

      // 合并请求中的上下文数据（如果启用）
      if (this.config.mergeRequestContext && requestContext) {
        if (requestContext.last_intent) {
          conversationContext.last_intent = requestContext.last_intent;
        }
        if (requestContext.slots) {
          conversationContext.slots = {
            ...conversationContext.slots,
            ...requestContext.slots,
          };
        }
        this.log('Request context merged');
      }

      // 存储到执行上下文
      context.setData('conversationContext', conversationContext);
      context.setData('conversationId', conversationContext.id);

      this.log(`Context management completed for: ${conversationContext.id}`);

      // 返回成功结果
      return this.createSuccessResult(
        {
          conversationContext,
          conversationId: conversationContext.id,
        },
        'success',
        Date.now() - startTime
      );
    } catch (error) {
      this.log(`Context management error: ${error}`, 'error');
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }
}

export default ContextNode;
