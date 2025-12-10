/**
 * Pipeline v3 - 执行上下文
 * 
 * 管理工作流执行过程中的状态、数据和追踪信息
 * 
 * @version 3.0.0
 * @author Pipeline Team
 */

import { NodeExecutionResult } from './base/Node.js';

/**
 * 工作流定义接口
 */
export interface WorkflowDefinition {
  /** 工作流 ID */
  id: string;
  /** 工作流名称 */
  name: string;
  /** 版本 */
  version: string;
  /** 描述 */
  description: string;
  /** 节点定义 */
  nodes: any[];
  /** 连接定义 */
  connections: any[];
  /** 设置 */
  settings?: any;
}

/**
 * 执行记录
 */
export interface ExecutionRecord {
  /** 节点 ID */
  nodeId: string;
  /** 状态 */
  status: 'started' | 'completed' | 'error' | 'skipped';
  /** 时间戳 */
  timestamp: number;
  /** 执行结果（可选） */
  result?: NodeExecutionResult;
  /** 错误（可选） */
  error?: any;
  /** 输入数据（可选） */
  input?: any;
}

/**
 * 执行摘要
 */
export interface ExecutionSummary {
  /** 执行 ID */
  executionId: string;
  /** 工作流 ID */
  workflowId: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 持续时间（毫秒） */
  duration: number;
  /** 执行的节点数 */
  nodesExecuted: number;
  /** 成功的节点数 */
  nodesSucceeded: number;
  /** 失败的节点数 */
  nodesFailed: number;
  /** 跳过的节点数 */
  nodesSkipped: number;
  /** 执行追踪 */
  trace: ExecutionRecord[];
  /** 最终状态 */
  status: 'success' | 'error' | 'partial';
}

/**
 * 执行上下文类
 * 
 * 管理单次工作流执行的所有状态和数据
 * 
 * @example
 * ```typescript
 * const context = new ExecutionContext('exec-123', workflow);
 * 
 * // 设置数据
 * context.setData('userId', '123');
 * 
 * // 获取数据
 * const userId = context.getData('userId');
 * 
 * // 记录节点执行
 * context.recordNodeStart('node-1');
 * context.recordNodeComplete('node-1', result);
 * 
 * // 获取摘要
 * const summary = context.getSummary();
 * ```
 */
export class ExecutionContext {
  /** 执行 ID */
  public executionId: string;

  /** 工作流定义 */
  public workflow: WorkflowDefinition;

  /** 开始时间 */
  public startTime: number;

  /** 共享数据存储 */
  public data: Map<string, any>;

  /** 执行追踪记录 */
  public executionTrace: ExecutionRecord[];

  /** 是否启用详细追踪 */
  private verbose: boolean;

  /** 最大数据大小（字节，默认 10MB） */
  private maxDataSize: number = 10 * 1024 * 1024;

  /**
   * 构造函数
   * 
   * @param executionId 执行 ID
   * @param workflow 工作流定义
   * @param options 选项
   */
  constructor(
    executionId: string,
    workflow: WorkflowDefinition,
    options?: {
      verbose?: boolean;
      maxDataSize?: number;
    }
  ) {
    this.executionId = executionId;
    this.workflow = workflow;
    this.startTime = Date.now();
    this.data = new Map();
    this.executionTrace = [];
    this.verbose = options?.verbose || false;
    if (options?.maxDataSize) {
      this.maxDataSize = options.maxDataSize;
    }

    this.log(`Execution context created for workflow: ${workflow.id}`);
  }

  /**
   * 设置共享数据
   * 
   * @param key 数据键
   * @param value 数据值
   * @throws Error 如果数据过大
   */
  setData(key: string, value: any): void {
    // 检查数据大小（简单估算）
    const dataSize = JSON.stringify(value).length;
    const currentSize = this.getDataSize();

    if (currentSize + dataSize > this.maxDataSize) {
      throw new Error(
        `Data size limit exceeded: ${currentSize + dataSize} > ${this.maxDataSize}`
      );
    }

    this.data.set(key, value);
    this.log(`Data set: ${key} (${dataSize} bytes)`);
  }

  /**
   * 获取共享数据
   * 
   * @param key 数据键
   * @param defaultValue 默认值
   * @returns 数据值
   */
  getData<T = any>(key: string, defaultValue?: T): T {
    const value = this.data.get(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * 检查数据是否存在
   * 
   * @param key 数据键
   * @returns 是否存在
   */
  hasData(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * 删除数据
   * 
   * @param key 数据键
   * @returns 是否删除成功
   */
  deleteData(key: string): boolean {
    const deleted = this.data.delete(key);
    if (deleted) {
      this.log(`Data deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * 清空所有数据
   */
  clearData(): void {
    this.data.clear();
    this.log('All data cleared');
  }

  /**
   * 获取当前数据大小（估算）
   * 
   * @returns 数据大小（字节）
   */
  getDataSize(): number {
    try {
      return JSON.stringify(Array.from(this.data.entries())).length;
    } catch (error) {
      console.error('[ExecutionContext] Failed to calculate data size:', error);
      return 0;
    }
  }

  /**
   * 记录节点开始执行
   * 
   * @param nodeId 节点 ID
   * @param input 输入数据（可选）
   */
  recordNodeStart(nodeId: string, input?: any): void {
    const record: ExecutionRecord = {
      nodeId,
      status: 'started',
      timestamp: Date.now(),
      input: this.verbose ? input : undefined,
    };

    this.executionTrace.push(record);
    this.log(`Node started: ${nodeId}`);
  }

  /**
   * 记录节点完成
   * 
   * @param nodeId 节点 ID
   * @param result 执行结果
   */
  recordNodeComplete(nodeId: string, result: NodeExecutionResult): void {
    const record: ExecutionRecord = {
      nodeId,
      status: 'completed',
      timestamp: Date.now(),
      result,
    };

    this.executionTrace.push(record);
    this.log(
      `Node completed: ${nodeId} (${result.metadata.executionTime}ms, output: ${result.outputName})`
    );
  }

  /**
   * 记录节点错误
   * 
   * @param nodeId 节点 ID
   * @param error 错误信息
   */
  recordNodeError(nodeId: string, error: any): void {
    const record: ExecutionRecord = {
      nodeId,
      status: 'error',
      timestamp: Date.now(),
      error,
    };

    this.executionTrace.push(record);
    this.log(`Node error: ${nodeId} - ${error.message || error}`, 'error');
  }

  /**
   * 记录节点跳过
   * 
   * @param nodeId 节点 ID
   * @param reason 跳过原因
   */
  recordNodeSkipped(nodeId: string, reason?: string): void {
    const record: ExecutionRecord = {
      nodeId,
      status: 'skipped',
      timestamp: Date.now(),
      error: reason,
    };

    this.executionTrace.push(record);
    this.log(`Node skipped: ${nodeId}${reason ? ` - ${reason}` : ''}`);
  }

  /**
   * 获取节点的执行记录
   * 
   * @param nodeId 节点 ID
   * @returns 执行记录列表
   */
  getNodeRecords(nodeId: string): ExecutionRecord[] {
    return this.executionTrace.filter(record => record.nodeId === nodeId);
  }

  /**
   * 获取节点的最后一次执行记录
   * 
   * @param nodeId 节点 ID
   * @returns 执行记录
   */
  getLastNodeRecord(nodeId: string): ExecutionRecord | undefined {
    const records = this.getNodeRecords(nodeId);
    return records[records.length - 1];
  }

  /**
   * 获取执行摘要
   * 
   * @returns 执行摘要
   */
  getSummary(): ExecutionSummary {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // 统计节点状态
    const statusCounts = {
      completed: 0,
      error: 0,
      skipped: 0,
    };

    // 只统计每个节点的最后一次状态
    const nodeStatuses = new Map<string, string>();
    for (const record of this.executionTrace) {
      if (record.status !== 'started') {
        nodeStatuses.set(record.nodeId, record.status);
      }
    }

    for (const status of nodeStatuses.values()) {
      if (status === 'completed') statusCounts.completed++;
      else if (status === 'error') statusCounts.error++;
      else if (status === 'skipped') statusCounts.skipped++;
    }

    const nodesExecuted = nodeStatuses.size;

    // 确定最终状态
    let finalStatus: 'success' | 'error' | 'partial';
    if (statusCounts.error > 0) {
      finalStatus = statusCounts.completed > 0 ? 'partial' : 'error';
    } else {
      finalStatus = 'success';
    }

    return {
      executionId: this.executionId,
      workflowId: this.workflow.id,
      startTime: this.startTime,
      endTime,
      duration,
      nodesExecuted,
      nodesSucceeded: statusCounts.completed,
      nodesFailed: statusCounts.error,
      nodesSkipped: statusCounts.skipped,
      trace: this.executionTrace,
      status: finalStatus,
    };
  }

  /**
   * 获取执行持续时间
   * 
   * @returns 持续时间（毫秒）
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * 检查执行是否超时
   * 
   * @param timeoutMs 超时时间（毫秒）
   * @returns 是否超时
   */
  isTimedOut(timeoutMs: number): boolean {
    return this.getDuration() > timeoutMs;
  }

  /**
   * 导出执行上下文（用于序列化）
   * 
   * @returns 可序列化的对象
   */
  toJSON(): any {
    return {
      executionId: this.executionId,
      workflowId: this.workflow.id,
      startTime: this.startTime,
      duration: this.getDuration(),
      data: Array.from(this.data.entries()),
      trace: this.executionTrace,
      summary: this.getSummary(),
    };
  }

  /**
   * 日志输出
   * 
   * @param message 日志消息
   * @param level 日志级别
   */
  private log(
    message: string,
    level: 'info' | 'warn' | 'error' = 'info'
  ): void {
    if (!this.verbose && level === 'info') {
      return;
    }

    const prefix = `[ExecutionContext:${this.executionId}]`;
    const timestamp = new Date().toISOString();

    switch (level) {
      case 'error':
        console.error(`${timestamp} ${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${timestamp} ${prefix} ${message}`);
        break;
      default:
        console.log(`${timestamp} ${prefix} ${message}`);
    }
  }
}
