/**
 * Special Intent Handler Node - 特殊意图处理节点
 * 
 * 处理特殊意图（Line 询问、投诉、转真人等）
 * 如果匹配则直接返回响应，否则继续正常流程
 * 
 * @version 1.0.0
 * @migrated-from functions/api/nodes/06-special-intents.ts
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import { buildResponse } from '../../lib/chatHelpers.js';
import {
  getLineInquiryTemplate,
  getComplaintTemplate,
  getHandoffTemplate
} from '../../lib/responseTemplates.js';
import metadata from './metadata.json';

/**
 * Special Intent Handler Node 类
 */
export class SpecialIntentNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        message,
        intent,
        conversationContext,
        mergedEntities,
        contextManager,
        knowledgeBase,
        corsHeaders,
        nextState
      } = input;

      // 验证输入
      if (!message || !intent || !conversationContext || !mergedEntities ||
          !contextManager || !knowledgeBase || !corsHeaders || !nextState) {
        throw new Error('Missing required input');
      }

      // 1. 检查 Line 官方账号询问（关键词检测）
      if (this.config.checkLineInquiry) {
        const hasLineKeyword = message.includes('line') ||
                               message.includes('Line') ||
                               message.includes('LINE');

        if (hasLineKeyword) {
          this.log('Line inquiry detected, building response');
          
          const response = buildResponse(
            getLineInquiryTemplate(),
            intent,
            conversationContext.conversationId,
            mergedEntities,
            contextManager,
            knowledgeBase,
            message,
            corsHeaders,
            nextState
          );

          return {
            success: true,
            output: response,
            outputName: 'response',
            metadata: {
              executionTime: Date.now() - startTime,
              timestamp: new Date().toISOString(),
              nodeId: this.metadata.id,
            },
          };
        }
      }

      // 2. 特殊意图处理器映射表
      const intentHandlers: Record<string, () => string> = {};

      if (this.config.handleComplaint) {
        intentHandlers['complaint'] = getComplaintTemplate;
      }

      if (this.config.handleHandoff) {
        intentHandlers['handoff_to_human'] = getHandoffTemplate;
      }

      // 3. 检查是否是特殊意图
      if (this.config.specialIntents.includes(intent) && intentHandlers[intent]) {
        this.log(`Special intent detected: ${intent}`);

        const response = buildResponse(
          intentHandlers[intent](),
          intent,
          conversationContext.conversationId,
          mergedEntities,
          contextManager,
          knowledgeBase,
          message,
          corsHeaders,
          nextState
        );

        return {
          success: true,
          output: response,
          outputName: 'response',
          metadata: {
            executionTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            nodeId: this.metadata.id,
          },
        };
      }

      // 4. 没有匹配的特殊意图，继续正常流程
      this.log('No special intent matched, continuing normal flow');

      return this.createSuccessResult(
        {
          message,
          intent,
          conversationContext,
          mergedEntities,
          nextState,
          specialIntentHandled: false,
        },
        'continue',
        Date.now() - startTime
      );
    } catch (error) {
      this.log(`Special intent handling error: ${error}`, 'error');
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }
}

export default SpecialIntentNode;
