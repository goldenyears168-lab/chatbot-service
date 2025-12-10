/**
 * FAQ Check Node - FAQ 检查节点
 * 
 * 检查 FAQ 并匹配答案，支持菜单选择和模糊匹配
 * 
 * @version 1.0.0
 * @migrated-from functions/api/nodes/07-faq-check.ts
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import { buildResponse, handleFAQIfNeeded } from '../../lib/chatHelpers.js';
import metadata from './metadata.json';

/**
 * FAQ Check Node 类
 */
export class FAQNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        message,
        intent,
        source,
        knowledgeBase,
        conversationContext,
        mergedEntities,
        contextManager,
        corsHeaders,
        nextState
      } = input;

      // 验证输入
      if (!message || !intent || !knowledgeBase || !conversationContext ||
          !mergedEntities || !contextManager || !corsHeaders || !nextState) {
        throw new Error('Missing required input');
      }

      // 1. 统一 FAQ 检查处理
      const faqResponse = handleFAQIfNeeded(
        intent,
        message,
        knowledgeBase,
        conversationContext,
        mergedEntities,
        contextManager,
        corsHeaders,
        nextState
      );

      if (faqResponse) {
        this.log('FAQ matched via handleFAQIfNeeded');
        return {
          success: true,
          output: faqResponse,
          outputName: 'response',
          metadata: {
            executionTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            nodeId: this.metadata.id,
          },
        };
      }

      // 2. 处理菜单选择的消息：优先使用 FAQ 匹配
      if (this.config.prioritizeMenuSource && source === 'menu') {
        this.log('Menu source detected, prioritizing FAQ match');
        
        const faqResults = knowledgeBase.searchFAQDetailed(message);

        if (faqResults && faqResults.length > 0) {
          const matchedFAQ = faqResults[0];
          this.log(`FAQ matched: ${matchedFAQ.id}, score: ${matchedFAQ.score || 'N/A'}`);

          const response = buildResponse(
            matchedFAQ.answer,
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

        // 3. 尝试模糊匹配（如果启用）
        if (this.config.enableFuzzyMatch) {
          this.log('Attempting fuzzy FAQ match...');

          const keywords = message.toLowerCase()
            .replace(/我想|我要|我想知道|请问|可以|吗|呢/g, '')
            .trim();

          if (keywords) {
            const fuzzyResults = knowledgeBase.searchFAQDetailed(keywords);
            
            if (fuzzyResults && fuzzyResults.length > 0) {
              const matchedFAQ = fuzzyResults[0];
              this.log(`Fuzzy FAQ matched: ${matchedFAQ.id}`);

              const response = buildResponse(
                matchedFAQ.answer,
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

          // 4. 模糊匹配也失败，返回友好消息
          this.log('No FAQ match found for menu selection', 'warn');
          
          const friendlyMessage = `抱歉，我暂时找不到这个问题的答案。建议您：\n\n1. 查看我们的 [常见问题页面](/guide/faq/)\n2. 直接透过 Email（goldenyears166@gmail.com）或电话联系我们的真人伙伴\n3. 或重新选择其他问题`;

          const response = buildResponse(
            friendlyMessage,
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

      // 5. 没有匹配的 FAQ，继续流程到 LLM
      this.log('No FAQ matched, continuing to LLM');

      return this.createSuccessResult(
        {
          message,
          intent,
          conversationContext,
          mergedEntities,
          nextState,
          faqMatched: false,
        },
        'continue',
        Date.now() - startTime
      );
    } catch (error) {
      this.log(`FAQ check error: ${error}`, 'error');
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }
}

export default FAQNode;
