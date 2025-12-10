/**
 * LLM Generation Node - LLM 生成节点
 * 
 * 使用 LLM 生成回复，支持超时控制和错误处理
 * 
 * @version 1.0.0
 * @migrated-from functions/api/nodes/08-llm-generation.ts
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import { getApiErrorTemplate, getTimeoutTemplate } from '../../lib/responseTemplates.js';
import metadata from './metadata.json';

/**
 * LLM Generation Node 类
 */
export class LLMNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        message,
        intent,
        mode = 'auto',
        source,
        conversationContext,
        mergedEntities,
        llmService,
        knowledgeBase,
        contextManager,
        corsHeaders
      } = input;

      // 验证输入
      if (!message || !intent || !conversationContext || !mergedEntities ||
          !knowledgeBase || !contextManager || !corsHeaders) {
        throw new Error('Missing required input');
      }

      // 1. LLM 不可用时的特殊处理
      if (!llmService) {
        this.log('LLM service not available', 'warn');

        // 如果是菜单选择，不应该到达这里
        if (this.config.handleMenuSourceWithoutLLM && source === 'menu') {
          this.log('ERROR: Menu selection reached LLM without FAQ match', 'error');
          
          const reply = '抱歉，系统暂时无法处理这个问题。建议您查看我们的常见问题页面，或直接联系我们的真人伙伴。';

          const response = new Response(
            JSON.stringify({
              reply,
              intent: intent || 'handoff_to_human',
              conversationId: conversationContext.conversationId,
              updatedContext: {
                last_intent: intent || 'handoff_to_human',
                slots: mergedEntities,
              },
            }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
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

        // 非菜单选择，返回 503
        if (this.config.returnServiceUnavailable) {
          const reply = getApiErrorTemplate();
          
          const response = new Response(
            JSON.stringify({
              reply,
              intent: 'handoff_to_human',
              conversationId: conversationContext.conversationId,
              updatedContext: {
                last_intent: 'handoff_to_human',
                slots: mergedEntities,
              },
            }),
            {
              status: 503,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
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

      // 2. 构建 LLM 上下文
      const history = conversationContext.history.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.text,
      }));

      // 3. 使用 Promise.race 实现超时
      const replyPromise = llmService!.generateReply({
        message,
        intent,
        entities: mergedEntities,
        context: {
          last_intent: conversationContext.last_intent,
          slots: mergedEntities,
          history,
        },
        mode,
        knowledgeBase,
      });

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<string>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Timeout')), this.config.timeout);
      });

      let reply: string;

      try {
        reply = await Promise.race([replyPromise, timeoutPromise]) as string;

        // 清理定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        this.log(`LLM reply generated (${reply.length} chars)`);
      } catch (error) {
        // 确保清理定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (error instanceof Error && error.message === 'Timeout') {
          this.log('LLM generation timed out', 'warn');
          reply = getTimeoutTemplate();
        } else {
          // 非超时错误，重新抛出
          throw error;
        }
      }

      // 4. 存储到执行上下文
      context.setData('llmReply', reply);

      this.log('LLM generation completed');

      // 返回成功结果
      return this.createSuccessResult(
        {
          reply,
          intent,
          conversationContext,
          mergedEntities,
          nextState,
        },
        'success',
        Date.now() - startTime
      );
    } catch (error) {
      this.log(`LLM generation error: ${error}`, 'error');
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }
}

export default LLMNode;
