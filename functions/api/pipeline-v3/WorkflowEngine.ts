/**
 * Pipeline v3 - 工作流引擎
 * 
 * 核心引擎，负责加载、验证和执行工作流
 * 
 * @version 3.0.0
 * @author Pipeline Team
 */

import { BaseNode, NodeRegistry, NodeExecutionResult } from './base/Node.js';
import { ExecutionContext, WorkflowDefinition } from './ExecutionContext.js';

/**
 * 节点定义
 */
export interface NodeDefinition {
  /** 节点实例 ID（在工作流中唯一） */
  id: string;
  /** 节点类型（对应 NodeMetadata.id） */
  type: string;
  /** 节点显示名称 */
  name: string;
  /** 节点位置（用于可视化） */
  position?: { x: number; y: number };
  /** 节点配置 */
  config?: Record<string, any>;
}

/**
 * 连接定义
 */
export interface ConnectionDefinition {
  /** 源节点 ID */
  from: string;
  /** 源节点输出名称 */
  fromOutput: string;
  /** 目标节点 ID */
  to: string;
  /** 目标节点输入名称（可选） */
  toInput?: string;
}

/**
 * 工作流设置
 */
export interface WorkflowSettings {
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试策略 */
  retryPolicy?: {
    /** 最大重试次数 */
    maxRetries: number;
    /** 退避策略（exponential/linear） */
    backoff: 'exponential' | 'linear';
    /** 初始延迟（毫秒） */
    initialDelay?: number;
  };
  /** 日志设置 */
  logging?: {
    /** 日志级别 */
    level: 'debug' | 'info' | 'warn' | 'error';
    /** 是否追踪执行 */
    traceExecution: boolean;
  };
  /** 并发设置 */
  concurrency?: {
    /** 最大并发节点数 */
    maxParallel: number;
  };
}

/**
 * 完整工作流定义
 */
export interface CompleteWorkflowDefinition extends WorkflowDefinition {
  nodes: NodeDefinition[];
  connections: ConnectionDefinition[];
  settings: WorkflowSettings;
}

/**
 * 工作流引擎类
 * 
 * 负责执行整个工作流
 * 
 * @example
 * ```typescript
 * // 创建引擎
 * const engine = new WorkflowEngine(workflowDef);
 * 
 * // 执行工作流
 * const result = await engine.execute({ message: "Hello" });
 * 
 * // 获取可视化
 * const diagram = engine.generateVisualization();
 * ```
 */
export class WorkflowEngine {
  /** 工作流定义 */
  private workflow: CompleteWorkflowDefinition;

  /** 节点实例映射 */
  private nodes: Map<string, BaseNode>;

  /** 执行历史 */
  private executionHistory: ExecutionContext[];

  /** 最大历史记录数 */
  private maxHistorySize: number = 100;

  /**
   * 构造函数
   * 
   * @param workflow 工作流定义
   */
  constructor(workflow: CompleteWorkflowDefinition) {
    this.workflow = workflow;
    this.nodes = new Map();
    this.executionHistory = [];
    this.initializeNodes();
    this.validateWorkflow();
  }

  /**
   * 初始化所有节点
   * 
   * 根据工作流定义创建节点实例
   * 
   * @throws Error 如果节点类型未注册
   */
  private initializeNodes(): void {
    console.log(`[WorkflowEngine] Initializing ${this.workflow.nodes.length} nodes...`);

    for (const nodeDef of this.workflow.nodes) {
      const NodeClass = NodeRegistry.get(nodeDef.type);

      if (!NodeClass) {
        throw new Error(
          `Node type not registered: ${nodeDef.type} (required by ${nodeDef.id})`
        );
      }

      try {
        const node = new (NodeClass as any)(nodeDef.config);
        this.nodes.set(nodeDef.id, node);
        console.log(`[WorkflowEngine] Node initialized: ${nodeDef.id} (${nodeDef.type})`);
      } catch (error) {
        throw new Error(
          `Failed to initialize node ${nodeDef.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    console.log(`[WorkflowEngine] All nodes initialized successfully`);
  }

  /**
   * 验证工作流定义
   * 
   * 检查工作流是否有效（节点、连接、循环等）
   * 
   * @throws Error 如果工作流无效
   */
  private validateWorkflow(): void {
    console.log('[WorkflowEngine] Validating workflow...');

    // 检查是否有节点
    if (this.workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    // 检查所有连接的节点是否存在
    for (const conn of this.workflow.connections) {
      if (!this.nodes.has(conn.from)) {
        throw new Error(`Connection references non-existent node: ${conn.from}`);
      }
      if (!this.nodes.has(conn.to)) {
        throw new Error(`Connection references non-existent node: ${conn.to}`);
      }
    }

    // 检查循环（简单的 DFS 检测）
    this.detectCycles();

    // 检查是否有入口节点
    const entryNode = this.findEntryNode();
    if (!entryNode) {
      console.warn('[WorkflowEngine] Warning: No clear entry node found');
    }

    console.log('[WorkflowEngine] Workflow validation passed');
  }

  /**
   * 检测循环
   * 
   * 使用 DFS 检测工作流中的循环依赖
   * 
   * @throws Error 如果发现循环
   */
  private detectCycles(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      // 获取所有后续节点
      const nextNodes = this.workflow.connections
        .filter(c => c.from === nodeId)
        .map(c => c.to);

      for (const nextNode of nextNodes) {
        if (!visited.has(nextNode)) {
          if (dfs(nextNode)) {
            return true; // 发现循环
          }
        } else if (recursionStack.has(nextNode)) {
          throw new Error(`Cycle detected in workflow: ${nodeId} -> ${nextNode}`);
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // 从每个未访问的节点开始 DFS
    for (const nodeDef of this.workflow.nodes) {
      if (!visited.has(nodeDef.id)) {
        dfs(nodeDef.id);
      }
    }
  }

  /**
   * 执行工作流
   * 
   * @param initialInput 初始输入数据
   * @param options 执行选项
   * @returns 执行结果
   */
  async execute(
    initialInput: any,
    options?: {
      executionId?: string;
      verbose?: boolean;
    }
  ): Promise<any> {
    const executionId = options?.executionId || this.generateExecutionId();
    const context = new ExecutionContext(executionId, this.workflow, {
      verbose: options?.verbose || this.workflow.settings.logging?.traceExecution,
    });

    console.log(`[WorkflowEngine] Starting execution: ${executionId}`);

    try {
      // 找到入口节点
      const entryNode = this.findEntryNode();
      if (!entryNode) {
        throw new Error('No entry node found in workflow');
      }

      // 从入口节点开始执行
      const result = await this.executeNode(entryNode, initialInput, context);

      // 保存到历史
      this.addToHistory(context);

      console.log(
        `[WorkflowEngine] Execution completed: ${executionId} (${context.getDuration()}ms)`
      );

      return result;
    } catch (error) {
      console.error(`[WorkflowEngine] Execution failed: ${executionId}`, error);
      
      // 仍然保存到历史（用于调试）
      this.addToHistory(context);

      throw error;
    }
  }

  /**
   * 执行单个节点
   * 
   * @param nodeId 节点 ID
   * @param input 输入数据
   * @param context 执行上下文
   * @returns 节点输出
   */
  private async executeNode(
    nodeId: string,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    const nodeName = node.getName();

    // 检查超时
    const timeout = this.workflow.settings.timeout;
    if (timeout && context.isTimedOut(timeout)) {
      throw new Error(
        `Workflow execution timed out (${timeout}ms) at node: ${nodeName}`
      );
    }

    // 记录开始
    context.recordNodeStart(nodeId, input);

    try {
      // 执行节点
      console.log(`[WorkflowEngine] Executing node: ${nodeName}`);
      const result = await node.execute(input, context);

      // 记录完成
      context.recordNodeComplete(nodeId, result);

      // 如果失败，检查是否有错误处理节点
      if (!result.success) {
        const errorHandler = this.findErrorHandler(nodeId);
        if (errorHandler) {
          console.log(`[WorkflowEngine] Routing to error handler: ${errorHandler}`);
          return await this.executeNode(errorHandler, result.output, context);
        } else {
          throw new Error(
            `Node execution failed: ${nodeName} - ${result.error?.message || 'Unknown error'}`
          );
        }
      }

      // 找到下一个节点
      const nextNode = this.findNextNode(nodeId, result.outputName);

      if (nextNode) {
        // 继续执行下一个节点
        return await this.executeNode(nextNode, result.output, context);
      } else {
        // 没有下一个节点，返回最终结果
        console.log(`[WorkflowEngine] Workflow completed at node: ${nodeName}`);
        return result.output;
      }
    } catch (error) {
      // 记录错误
      context.recordNodeError(nodeId, error);

      // 尝试错误处理节点
      const errorHandler = this.findErrorHandler(nodeId);
      if (errorHandler) {
        console.log(`[WorkflowEngine] Routing to error handler: ${errorHandler}`);
        return await this.executeNode(
          errorHandler,
          { error, nodeId, nodeName },
          context
        );
      }

      throw error;
    }
  }

  /**
   * 找到入口节点
   * 
   * 入口节点是没有输入连接的节点
   * 
   * @returns 节点 ID
   */
  private findEntryNode(): string | null {
    const nodesWithInput = new Set(this.workflow.connections.map(c => c.to));

    const entryNodes = this.workflow.nodes.filter(
      node => !nodesWithInput.has(node.id)
    );

    if (entryNodes.length === 0) {
      return null;
    }

    if (entryNodes.length > 1) {
      console.warn(
        `[WorkflowEngine] Multiple entry nodes found, using first: ${entryNodes[0].id}`
      );
    }

    return entryNodes[0].id;
  }

  /**
   * 找到下一个节点
   * 
   * 根据当前节点和输出名称找到下一个节点
   * 
   * @param nodeId 当前节点 ID
   * @param outputName 输出名称
   * @returns 下一个节点 ID
   */
  private findNextNode(nodeId: string, outputName: string): string | null {
    const connection = this.workflow.connections.find(
      c => c.from === nodeId && c.fromOutput === outputName
    );

    return connection ? connection.to : null;
  }

  /**
   * 找到错误处理节点
   * 
   * 查找指定节点的错误处理节点（输出为 'error' 的连接）
   * 
   * @param nodeId 节点 ID
   * @returns 错误处理节点 ID
   */
  private findErrorHandler(nodeId: string): string | null {
    const errorConnection = this.workflow.connections.find(
      c => c.from === nodeId && c.fromOutput === 'error'
    );

    return errorConnection ? errorConnection.to : null;
  }

  /**
   * 生成执行 ID
   * 
   * @returns 执行 ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加到历史记录
   * 
   * @param context 执行上下文
   */
  private addToHistory(context: ExecutionContext): void {
    this.executionHistory.push(context);

    // 限制历史大小
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * 获取执行历史
   * 
   * @param limit 返回数量限制
   * @returns 执行上下文列表
   */
  getExecutionHistory(limit?: number): ExecutionContext[] {
    if (limit) {
      return this.executionHistory.slice(-limit);
    }
    return [...this.executionHistory];
  }

  /**
   * 获取特定执行的上下文
   * 
   * @param executionId 执行 ID
   * @returns 执行上下文
   */
  getExecution(executionId: string): ExecutionContext | undefined {
    return this.executionHistory.find(ctx => ctx.executionId === executionId);
  }

  /**
   * 生成可视化（Mermaid 格式）
   * 
   * @returns Mermaid 流程图代码
   */
  generateVisualization(): string {
    let diagram = 'graph TD\n';

    // 添加节点
    for (const nodeDef of this.workflow.nodes) {
      const node = this.nodes.get(nodeDef.id);
      const metadata = node?.getMetadata();
      const icon = metadata?.icon || '';
      const name = nodeDef.name || metadata?.name || nodeDef.id;

      diagram += `  ${nodeDef.id}["${icon} ${name}"]\n`;
    }

    // 添加连接
    for (const conn of this.workflow.connections) {
      const label = conn.fromOutput !== 'success' ? `|${conn.fromOutput}|` : '';
      diagram += `  ${conn.from} ${label}-->${conn.to}\n`;
    }

    return diagram;
  }

  /**
   * 获取工作流定义
   * 
   * @returns 工作流定义
   */
  getWorkflowDefinition(): CompleteWorkflowDefinition {
    return this.workflow;
  }

  /**
   * 获取节点列表
   * 
   * @returns 节点 ID 列表
   */
  getNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * 获取节点实例
   * 
   * @param nodeId 节点 ID
   * @returns 节点实例
   */
  getNode(nodeId: string): BaseNode | undefined {
    return this.nodes.get(nodeId);
  }
}
