/**
 * Initialize Services Node - 服务初始化节点
 * 
 * 验证服务已初始化（知识库、LLM、上下文管理器）
 * 在多租户架构中，服务已在 [company]/chat.ts 中初始化
 * 这里只需要验证它们都已正确设置
 * 
 * @version 1.0.0
 * @migrated-from functions/api/nodes/02-initialize-services.ts
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import metadata from './metadata.json';

/**
 * Initialize Services Node 类
 */
export class InitializeNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { knowledgeBase, llmService, contextManager, companyId } = input;

      // 1. 验证知识库
      if (this.config.validateKnowledgeBase) {
        if (!knowledgeBase) {
          throw new Error('Knowledge base not initialized');
        }

        // 验证知识库是否已加载
        if (typeof knowledgeBase.getServices === 'function') {
          const services = knowledgeBase.getServices();
          if (!services || services.length === 0) {
            this.log('Warning: Knowledge base loaded but no services found', 'warn');
          }
        }

        this.log(`Knowledge base validated for company: ${companyId}`);
      }

      // 2. 验证 LLM 服务
      if (this.config.validateLLMService) {
        if (!llmService) {
          throw new Error('LLM service not initialized');
        }

        // 验证 LLM 服务是否有必要的方法
        if (typeof llmService.generateResponse !== 'function') {
          throw new Error('LLM service is missing generateResponse method');
        }

        this.log(`LLM service validated for company: ${companyId}`);
      }

      // 3. 验证上下文管理器
      if (this.config.validateContextManager) {
        if (!contextManager) {
          throw new Error('Context manager not initialized');
        }

        // 验证上下文管理器是否有必要的方法
        if (typeof contextManager.getContext !== 'function' ||
            typeof contextManager.updateContext !== 'function') {
          throw new Error('Context manager is missing required methods');
        }

        this.log(`Context manager validated for company: ${companyId}`);
      }

      // 4. 设置 responseTemplates 的知识库引用（如果需要）
      try {
        // 动态导入 setKnowledgeBase 函数
        const { setKnowledgeBase } = await import('../../lib/responseTemplates.js');
        setKnowledgeBase(knowledgeBase);
        this.log('Knowledge base set for responseTemplates');
      } catch (error) {
        this.log('Warning: Failed to set knowledge base for responseTemplates', 'warn');
        // 不抛出错误，因为这不是致命问题
      }

      // 5. 存储服务引用到上下文（供后续节点使用）
      context.setData('knowledgeBase', knowledgeBase);
      context.setData('llmService', llmService);
      context.setData('contextManager', contextManager);
      context.setData('companyId', companyId);

      this.log(`Services initialized successfully for company: ${companyId}`);

      // 返回成功结果
      return this.createSuccessResult(
        {
          knowledgeBase,
          llmService,
          contextManager,
          companyId,
          initialized: true,
        },
        'success',
        Date.now() - startTime
      );
    } catch (error) {
      this.log(`Service initialization error: ${error}`, 'error');
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }
}

export default InitializeNode;
