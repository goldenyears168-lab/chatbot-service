/**
 * State Transition Node - 状态转换节点
 * 
 * 决定下一个对话状态（使用配置驱动）
 * 
 * @version 1.0.0
 * @migrated-from functions/api/nodes/05-state-transition.ts
 */

import { BaseNode, NodeExecutionResult, ExecutionContext } from '../../../pipeline-v3/base/Node.js';
import metadata from './metadata.json';

/**
 * State Transition Node 类
 */
export class StateTransitionNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata as any, config);
  }

  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const {
        knowledgeBase,
        contextManager,
        conversationContext,
        intent,
        mergedEntities
      } = input;

      // 验证输入
      if (!knowledgeBase || !contextManager || !conversationContext || !intent || !mergedEntities) {
        throw new Error('Missing required input');
      }

      // 当前状态
      let nextState = conversationContext.state;

      try {
        // 尝试使用配置驱动的状态转换
        if (this.config.useConfigTransitions) {
          const stateTransitionsConfig = knowledgeBase.getStateTransitionsConfig();

          if (stateTransitionsConfig) {
            // 检查是否有必需的 slots
            const requiredSlotsCheck = stateTransitionsConfig.requiredSlotsCheck;
            let hasRequiredSlots = false;

            if (requiredSlotsCheck) {
              if (requiredSlotsCheck.requireAny) {
                // 需要任意一个字段
                hasRequiredSlots = requiredSlotsCheck.fields.some(
                  field => mergedEntities[field]
                );
              } else {
                // 需要所有字段
                hasRequiredSlots = requiredSlotsCheck.fields.every(
                  field => mergedEntities[field]
                );
              }
            } else {
              // 默认逻辑：至少需要 service_type 或 use_case
              hasRequiredSlots = !!(mergedEntities.service_type || mergedEntities.use_case);
            }

            // 使用 contextManager 的状态转换逻辑
            nextState = contextManager.determineNextState(
              conversationContext.state,
              intent,
              hasRequiredSlots,
              {
                transitions: stateTransitionsConfig.transitions,
                requiredSlotsCheck: stateTransitionsConfig.requiredSlotsCheck,
              }
            );

            this.log(`State transition: ${conversationContext.state} → ${nextState}`);
          }
        }

        // 如果配置不存在，使用 fallback 逻辑
        if (!nextState || nextState === conversationContext.state) {
          if (this.config.fallbackToCurrent) {
            const hasRequiredSlots = !!(mergedEntities.service_type || mergedEntities.use_case);
            nextState = contextManager.determineNextState(
              conversationContext.state,
              intent,
              hasRequiredSlots
            );
            this.log(`Using fallback state transition: ${nextState}`);
          }
        }
      } catch (error) {
        this.log(`State transition error, using current state: ${error}`, 'warn');
        
        if (this.config.fallbackToCurrent) {
          nextState = conversationContext.state;
        } else {
          throw error;
        }
      }

      // 存储到执行上下文
      context.setData('nextState', nextState);

      this.log(`Next state determined: ${nextState}`);

      // 返回成功结果
      return this.createSuccessResult(
        {
          nextState,
          currentState: conversationContext.state,
          intent,
          hasRequiredSlots: !!(mergedEntities.service_type || mergedEntities.use_case),
        },
        'success',
        Date.now() - startTime
      );
    } catch (error) {
      this.log(`State transition error: ${error}`, 'error');
      return this.createErrorResult(error, Date.now() - startTime);
    }
  }
}

export default StateTransitionNode;
