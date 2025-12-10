/**
 * Intent Extraction Node - 意图提取节点
 * 
 * 提取用户意图和实体，支持多轮对话上下文
 * 
 * @version 1.0.0
 * @migrated-from functions/api/nodes/04-intent-extraction.ts
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import { classifyIntent, extractEntities } from '../../lib/chatHelpers.js';
import metadata from './metadata.json';

/**
 * Intent Extraction Node 类
 */
export class IntentNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { message, knowledgeBase, conversationContext } = input;

      // 验证输入
      if (!message || !knowledgeBase || !conversationContext) {
        throw new Error('Missing required input: message, knowledgeBase, or conversationContext');
      }

      // 1. 意图分类（使用配置驱动）
      const contextData = this.config.useContextIntent ? {
        last_intent: conversationContext.last_intent,
        slots: conversationContext.slots,
      } : {};

      const intent = classifyIntent(message, contextData, knowledgeBase);
      this.log(`Intent classified: ${intent}`);

      // 2. 实体提取（使用配置驱动）
      const entities = extractEntities(message, knowledgeBase);
      this.log(`Entities extracted: ${JSON.stringify(entities)}`);

      // 3. 合并上下文中的实体（如果启用）
      let mergedEntities = entities;
      if (this.config.mergeEntities && conversationContext.slots) {
        mergedEntities = {
          ...conversationContext.slots,
          ...entities,
        };
        this.log(`Entities merged with context slots`);
      }

      // 4. 存储到执行上下文
      context.setData('intent', intent);
      context.setData('entities', entities);
      context.setData('mergedEntities', mergedEntities);

      this.log(`Intent extraction completed: ${intent}`);

      // 返回成功结果
      return this.createSuccessResult(
        {
          intent,
          entities,
          mergedEntities,
          message,
        },
        'success',
        Date.now() - startTime
      );
    } catch (error) {
      this.log(`Intent extraction error: ${error}`, 'error');
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }
}

export default IntentNode;
