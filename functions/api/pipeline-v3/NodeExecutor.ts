/**
 * Pipeline v3 - 节点执行器
 * 
 * 负责执行单个节点，包括超时控制、重试、错误处理等
 * 
 * @version 3.0.0
 * @author Pipeline Team
 */

import { BaseNode, NodeExecutionResult } from './base/Node.js';
import { ExecutionContext } from './ExecutionContext.js';

/**
 * 执行选项
 */
export interface ExecutionOptions {
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxRetries: number;
    /** 退避策略 */
    backoff: 'linear' | 'exponential';
    /** 初始延迟（毫秒） */
    initialDelay?: number;
  };
  /** 是否捕获错误（如果为 true，错误不会向上抛出） */
  catchErrors?: boolean;
  /** 执行前钩子 */
  beforeExecute?: (node: BaseNode, input: any) => void | Promise<void>;
  /** 执行后钩子 */
  afterExecute?: (node: BaseNode, result: NodeExecutionResult) => void | Promise<void>;
}

/**
 * 执行结果（扩展）
 */
export interface ExtendedExecutionResult extends NodeExecutionResult {
  /** 重试次数 */
  retries: number;
  /** 是否超时 */
  timedOut: boolean;
  /** 实际执行时间（包括重试） */
  totalExecutionTime: number;
}

/**
 * 节点执行器类
 * 
 * 提供节点执行的高级功能
 * 
 * @example
 * ```typescript
 * const executor = new NodeExecutor();
 * 
 * const result = await executor.execute(
 *   node,
 *   input,
 *   context,
 *   {
 *     timeout: 5000,
 *     retry: {
 *       maxRetries: 3,
 *       backoff: 'exponential'
 *     }
 *   }
 * );
 * ```
 */
export class NodeExecutor {
  /**
   * 执行节点
   * 
   * @param node 节点实例
   * @param input 输入数据
   * @param context 执行上下文
   * @param options 执行选项
   * @returns 执行结果
   */
  async execute(
    node: BaseNode,
    input: any,
    context: ExecutionContext,
    options?: ExecutionOptions
  ): Promise<ExtendedExecutionResult> {
    const startTime = Date.now();
    let retries = 0;

    // 默认选项
    const opts: Required<ExecutionOptions> = {
      timeout: options?.timeout ?? 30000,
      retry: options?.retry ?? { maxRetries: 0, backoff: 'exponential', initialDelay: 1000 },
      catchErrors: options?.catchErrors ?? false,
      beforeExecute: options?.beforeExecute ?? (() => {}),
      afterExecute: options?.afterExecute ?? (() => {}),
    };

    // 执行前钩子
    try {
      await opts.beforeExecute(node, input);
    } catch (error) {
      console.error('[NodeExecutor] beforeExecute hook error:', error);
    }

    // 执行循环（包括重试）
    while (retries <= opts.retry.maxRetries) {
      try {
        // 执行节点（带超时）
        const result = await this.executeWithTimeout(
          node,
          input,
          context,
          opts.timeout
        );

        // 执行后钩子
        try {
          await opts.afterExecute(node, result);
        } catch (error) {
          console.error('[NodeExecutor] afterExecute hook error:', error);
        }

        // 返回成功结果
        return {
          ...result,
          retries,
          timedOut: false,
          totalExecutionTime: Date.now() - startTime,
        };
      } catch (error) {
        console.error(
          `[NodeExecutor] Node execution failed (attempt ${retries + 1}/${opts.retry.maxRetries + 1}):`,
          error
        );

        // 如果还有重试机会
        if (retries < opts.retry.maxRetries) {
          retries++;
          
          // 计算延迟
          const delay = this.calculateDelay(
            retries,
            opts.retry.backoff,
            opts.retry.initialDelay || 1000
          );

          console.log(`[NodeExecutor] Retrying in ${delay}ms...`);
          await this.sleep(delay);
          
          continue;
        }

        // 没有重试机会了，处理错误
        if (opts.catchErrors) {
          // 捕获错误，返回错误结果
          return {
            success: false,
            output: null,
            outputName: 'error',
            metadata: {
              executionTime: Date.now() - startTime,
              timestamp: new Date().toISOString(),
              nodeId: node.getId(),
            },
            error: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
            retries,
            timedOut: error instanceof TimeoutError,
            totalExecutionTime: Date.now() - startTime,
          };
        } else {
          // 向上抛出错误
          throw error;
        }
      }
    }

    // 不应该到这里
    throw new Error('Unexpected execution flow');
  }

  /**
   * 带超时的执行
   * 
   * @param node 节点实例
   * @param input 输入数据
   * @param context 执行上下文
   * @param timeout 超时时间（毫秒）
   * @returns 执行结果
   * @throws TimeoutError 如果超时
   */
  private async executeWithTimeout(
    node: BaseNode,
    input: any,
    context: ExecutionContext,
    timeout: number
  ): Promise<NodeExecutionResult> {
    return Promise.race([
      node.execute(input, context),
      this.createTimeoutPromise(timeout, node.getName()),
    ]);
  }

  /**
   * 创建超时 Promise
   * 
   * @param timeout 超时时间（毫秒）
   * @param nodeName 节点名称
   * @returns Promise
   */
  private createTimeoutPromise(
    timeout: number,
    nodeName: string
  ): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new TimeoutError(
            `Node execution timed out after ${timeout}ms: ${nodeName}`
          )
        );
      }, timeout);
    });
  }

  /**
   * 计算重试延迟
   * 
   * @param attempt 重试次数（从 1 开始）
   * @param backoff 退避策略
   * @param initialDelay 初始延迟
   * @returns 延迟时间（毫秒）
   */
  private calculateDelay(
    attempt: number,
    backoff: 'linear' | 'exponential',
    initialDelay: number
  ): number {
    if (backoff === 'exponential') {
      // 指数退避：initialDelay * 2^(attempt-1)
      return initialDelay * Math.pow(2, attempt - 1);
    } else {
      // 线性退避：initialDelay * attempt
      return initialDelay * attempt;
    }
  }

  /**
   * 睡眠函数
   * 
   * @param ms 毫秒数
   * @returns Promise
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 批量执行节点（并行）
   * 
   * @param executions 执行配置列表
   * @param maxParallel 最大并行数（默认无限制）
   * @returns 执行结果列表
   */
  async executeBatch(
    executions: Array<{
      node: BaseNode;
      input: any;
      context: ExecutionContext;
      options?: ExecutionOptions;
    }>,
    maxParallel?: number
  ): Promise<ExtendedExecutionResult[]> {
    if (!maxParallel || maxParallel >= executions.length) {
      // 无限制或限制大于任务数，直接全部并行
      return Promise.all(
        executions.map(exec =>
          this.execute(exec.node, exec.input, exec.context, exec.options)
        )
      );
    }

    // 限制并行数
    const results: ExtendedExecutionResult[] = [];
    const queue = [...executions];

    while (queue.length > 0) {
      // 取出一批任务
      const batch = queue.splice(0, maxParallel);

      // 并行执行这一批
      const batchResults = await Promise.all(
        batch.map(exec =>
          this.execute(exec.node, exec.input, exec.context, exec.options)
        )
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 执行节点链（顺序执行）
   * 
   * 自动将前一个节点的输出作为下一个节点的输入
   * 
   * @param nodes 节点列表
   * @param initialInput 初始输入
   * @param context 执行上下文
   * @param options 执行选项
   * @returns 最后一个节点的执行结果
   */
  async executeChain(
    nodes: BaseNode[],
    initialInput: any,
    context: ExecutionContext,
    options?: ExecutionOptions
  ): Promise<ExtendedExecutionResult> {
    let currentInput = initialInput;
    let lastResult: ExtendedExecutionResult | null = null;

    for (const node of nodes) {
      lastResult = await this.execute(node, currentInput, context, options);

      // 如果失败，停止执行链
      if (!lastResult.success) {
        break;
      }

      // 使用当前节点的输出作为下一个节点的输入
      currentInput = lastResult.output;
    }

    if (!lastResult) {
      throw new Error('No nodes to execute');
    }

    return lastResult;
  }
}

/**
 * 超时错误类
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
