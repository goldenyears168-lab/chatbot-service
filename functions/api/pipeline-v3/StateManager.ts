/**
 * Pipeline v3 - 状态管理器
 * 
 * 管理工作流和节点的状态
 * 
 * @version 3.0.0
 * @author Pipeline Team
 */

/**
 * 工作流状态
 */
export enum WorkflowState {
  /** 待执行 */
  PENDING = 'pending',
  /** 运行中 */
  RUNNING = 'running',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 失败 */
  FAILED = 'failed',
  /** 已暂停 */
  PAUSED = 'paused',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

/**
 * 节点状态
 */
export enum NodeState {
  /** 待执行 */
  PENDING = 'pending',
  /** 运行中 */
  RUNNING = 'running',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 失败 */
  FAILED = 'failed',
  /** 已跳过 */
  SKIPPED = 'skipped',
}

/**
 * 状态变更记录
 */
export interface StateChangeRecord {
  /** 目标 ID（工作流或节点） */
  targetId: string;
  /** 目标类型 */
  targetType: 'workflow' | 'node';
  /** 旧状态 */
  oldState: string;
  /** 新状态 */
  newState: string;
  /** 时间戳 */
  timestamp: number;
  /** 原因（可选） */
  reason?: string;
}

/**
 * 工作流状态信息
 */
export interface WorkflowStateInfo {
  /** 工作流 ID */
  workflowId: string;
  /** 当前状态 */
  state: WorkflowState;
  /** 开始时间 */
  startTime?: number;
  /** 结束时间 */
  endTime?: number;
  /** 节点状态映射 */
  nodeStates: Map<string, NodeState>;
  /** 当前执行的节点 */
  currentNode?: string;
}

/**
 * 状态管理器配置
 */
export interface StateManagerConfig {
  /** 是否记录状态变更历史 */
  recordHistory?: boolean;
  /** 最大历史记录数 */
  maxHistorySize?: number;
  /** 是否启用状态持久化 */
  enablePersistence?: boolean;
}

/**
 * 状态管理器类
 * 
 * 管理整个工作流系统的状态
 * 
 * @example
 * ```typescript
 * const manager = new StateManager({
 *   recordHistory: true,
 *   maxHistorySize: 1000
 * });
 * 
 * // 设置工作流状态
 * manager.setWorkflowState('workflow-1', WorkflowState.RUNNING);
 * 
 * // 设置节点状态
 * manager.setNodeState('workflow-1', 'node-1', NodeState.RUNNING);
 * 
 * // 获取状态
 * const state = manager.getWorkflowState('workflow-1');
 * ```
 */
export class StateManager {
  /** 配置 */
  private config: Required<StateManagerConfig>;

  /** 工作流状态映射 */
  private workflowStates: Map<string, WorkflowStateInfo>;

  /** 状态变更历史 */
  private changeHistory: StateChangeRecord[];

  /** 状态监听器 */
  private listeners: Map<
    string,
    Array<(change: StateChangeRecord) => void>
  >;

  /**
   * 构造函数
   * 
   * @param config 配置选项
   */
  constructor(config?: StateManagerConfig) {
    this.config = {
      recordHistory: config?.recordHistory ?? true,
      maxHistorySize: config?.maxHistorySize ?? 1000,
      enablePersistence: config?.enablePersistence ?? false,
    };

    this.workflowStates = new Map();
    this.changeHistory = [];
    this.listeners = new Map();

    console.log('[StateManager] Initialized');
  }

  /**
   * 初始化工作流状态
   * 
   * @param workflowId 工作流 ID
   * @param nodeIds 节点 ID 列表
   */
  initializeWorkflow(workflowId: string, nodeIds: string[]): void {
    const stateInfo: WorkflowStateInfo = {
      workflowId,
      state: WorkflowState.PENDING,
      nodeStates: new Map(),
    };

    // 初始化所有节点为 PENDING
    nodeIds.forEach(nodeId => {
      stateInfo.nodeStates.set(nodeId, NodeState.PENDING);
    });

    this.workflowStates.set(workflowId, stateInfo);

    console.log(`[StateManager] Workflow initialized: ${workflowId}`);
  }

  /**
   * 设置工作流状态
   * 
   * @param workflowId 工作流 ID
   * @param newState 新状态
   * @param reason 原因（可选）
   */
  setWorkflowState(
    workflowId: string,
    newState: WorkflowState,
    reason?: string
  ): void {
    const stateInfo = this.workflowStates.get(workflowId);

    if (!stateInfo) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const oldState = stateInfo.state;

    // 如果状态没有变化，直接返回
    if (oldState === newState) {
      return;
    }

    // 更新状态
    stateInfo.state = newState;

    // 更新时间戳
    if (newState === WorkflowState.RUNNING && !stateInfo.startTime) {
      stateInfo.startTime = Date.now();
    }

    if (
      [WorkflowState.COMPLETED, WorkflowState.FAILED, WorkflowState.CANCELLED].includes(newState) &&
      !stateInfo.endTime
    ) {
      stateInfo.endTime = Date.now();
    }

    // 记录变更
    if (this.config.recordHistory) {
      this.recordStateChange({
        targetId: workflowId,
        targetType: 'workflow',
        oldState,
        newState,
        timestamp: Date.now(),
        reason,
      });
    }

    // 通知监听器
    this.notifyListeners(workflowId, {
      targetId: workflowId,
      targetType: 'workflow',
      oldState,
      newState,
      timestamp: Date.now(),
      reason,
    });

    console.log(
      `[StateManager] Workflow state changed: ${workflowId} (${oldState} -> ${newState})`
    );
  }

  /**
   * 设置节点状态
   * 
   * @param workflowId 工作流 ID
   * @param nodeId 节点 ID
   * @param newState 新状态
   * @param reason 原因（可选）
   */
  setNodeState(
    workflowId: string,
    nodeId: string,
    newState: NodeState,
    reason?: string
  ): void {
    const stateInfo = this.workflowStates.get(workflowId);

    if (!stateInfo) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const oldState = stateInfo.nodeStates.get(nodeId);

    if (!oldState) {
      throw new Error(`Node not found: ${nodeId} in workflow ${workflowId}`);
    }

    // 如果状态没有变化，直接返回
    if (oldState === newState) {
      return;
    }

    // 更新状态
    stateInfo.nodeStates.set(nodeId, newState);

    // 更新当前执行节点
    if (newState === NodeState.RUNNING) {
      stateInfo.currentNode = nodeId;
    } else if (stateInfo.currentNode === nodeId) {
      stateInfo.currentNode = undefined;
    }

    // 记录变更
    if (this.config.recordHistory) {
      this.recordStateChange({
        targetId: nodeId,
        targetType: 'node',
        oldState,
        newState,
        timestamp: Date.now(),
        reason,
      });
    }

    // 通知监听器
    this.notifyListeners(`${workflowId}:${nodeId}`, {
      targetId: nodeId,
      targetType: 'node',
      oldState,
      newState,
      timestamp: Date.now(),
      reason,
    });

    console.log(
      `[StateManager] Node state changed: ${workflowId}/${nodeId} (${oldState} -> ${newState})`
    );
  }

  /**
   * 获取工作流状态
   * 
   * @param workflowId 工作流 ID
   * @returns 工作流状态
   */
  getWorkflowState(workflowId: string): WorkflowState | undefined {
    return this.workflowStates.get(workflowId)?.state;
  }

  /**
   * 获取节点状态
   * 
   * @param workflowId 工作流 ID
   * @param nodeId 节点 ID
   * @returns 节点状态
   */
  getNodeState(workflowId: string, nodeId: string): NodeState | undefined {
    return this.workflowStates.get(workflowId)?.nodeStates.get(nodeId);
  }

  /**
   * 获取工作流状态信息
   * 
   * @param workflowId 工作流 ID
   * @returns 工作流状态信息
   */
  getWorkflowStateInfo(workflowId: string): WorkflowStateInfo | undefined {
    return this.workflowStates.get(workflowId);
  }

  /**
   * 检查工作流是否正在运行
   * 
   * @param workflowId 工作流 ID
   * @returns 是否正在运行
   */
  isWorkflowRunning(workflowId: string): boolean {
    return this.getWorkflowState(workflowId) === WorkflowState.RUNNING;
  }

  /**
   * 检查节点是否正在运行
   * 
   * @param workflowId 工作流 ID
   * @param nodeId 节点 ID
   * @returns 是否正在运行
   */
  isNodeRunning(workflowId: string, nodeId: string): boolean {
    return this.getNodeState(workflowId, nodeId) === NodeState.RUNNING;
  }

  /**
   * 获取所有正在运行的工作流
   * 
   * @returns 工作流 ID 列表
   */
  getRunningWorkflows(): string[] {
    const running: string[] = [];

    this.workflowStates.forEach((stateInfo, workflowId) => {
      if (stateInfo.state === WorkflowState.RUNNING) {
        running.push(workflowId);
      }
    });

    return running;
  }

  /**
   * 记录状态变更
   * 
   * @param record 状态变更记录
   */
  private recordStateChange(record: StateChangeRecord): void {
    this.changeHistory.push(record);

    // 限制历史记录数量
    if (this.changeHistory.length > this.config.maxHistorySize) {
      this.changeHistory.shift();
    }
  }

  /**
   * 获取状态变更历史
   * 
   * @param targetId 目标 ID（可选）
   * @param targetType 目标类型（可选）
   * @returns 状态变更记录列表
   */
  getStateHistory(
    targetId?: string,
    targetType?: 'workflow' | 'node'
  ): StateChangeRecord[] {
    let history = this.changeHistory;

    if (targetId) {
      history = history.filter(r => r.targetId === targetId);
    }

    if (targetType) {
      history = history.filter(r => r.targetType === targetType);
    }

    return history;
  }

  /**
   * 添加状态监听器
   * 
   * @param targetId 目标 ID
   * @param callback 回调函数
   */
  addListener(
    targetId: string,
    callback: (change: StateChangeRecord) => void
  ): void {
    if (!this.listeners.has(targetId)) {
      this.listeners.set(targetId, []);
    }

    this.listeners.get(targetId)!.push(callback);
  }

  /**
   * 移除状态监听器
   * 
   * @param targetId 目标 ID
   * @param callback 回调函数
   */
  removeListener(
    targetId: string,
    callback: (change: StateChangeRecord) => void
  ): void {
    const listeners = this.listeners.get(targetId);

    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 通知监听器
   * 
   * @param targetId 目标 ID
   * @param change 状态变更记录
   */
  private notifyListeners(targetId: string, change: StateChangeRecord): void {
    const listeners = this.listeners.get(targetId);

    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(change);
        } catch (error) {
          console.error('[StateManager] Listener error:', error);
        }
      });
    }
  }

  /**
   * 获取工作流统计
   * 
   * @param workflowId 工作流 ID
   * @returns 统计信息
   */
  getWorkflowStatistics(workflowId: string): {
    totalNodes: number;
    pendingNodes: number;
    runningNodes: number;
    completedNodes: number;
    failedNodes: number;
    skippedNodes: number;
    progress: number;
  } | undefined {
    const stateInfo = this.workflowStates.get(workflowId);

    if (!stateInfo) {
      return undefined;
    }

    const stats = {
      totalNodes: stateInfo.nodeStates.size,
      pendingNodes: 0,
      runningNodes: 0,
      completedNodes: 0,
      failedNodes: 0,
      skippedNodes: 0,
      progress: 0,
    };

    stateInfo.nodeStates.forEach(state => {
      switch (state) {
        case NodeState.PENDING:
          stats.pendingNodes++;
          break;
        case NodeState.RUNNING:
          stats.runningNodes++;
          break;
        case NodeState.COMPLETED:
          stats.completedNodes++;
          break;
        case NodeState.FAILED:
          stats.failedNodes++;
          break;
        case NodeState.SKIPPED:
          stats.skippedNodes++;
          break;
      }
    });

    // 计算进度（已完成 + 已跳过）/ 总数
    const finished = stats.completedNodes + stats.skippedNodes;
    stats.progress = stats.totalNodes > 0
      ? Math.round((finished / stats.totalNodes) * 100)
      : 0;

    return stats;
  }

  /**
   * 清理工作流状态
   * 
   * @param workflowId 工作流 ID
   */
  cleanupWorkflow(workflowId: string): void {
    this.workflowStates.delete(workflowId);
    this.listeners.delete(workflowId);
    console.log(`[StateManager] Workflow cleaned up: ${workflowId}`);
  }

  /**
   * 重置管理器
   */
  reset(): void {
    this.workflowStates.clear();
    this.changeHistory = [];
    this.listeners.clear();
    console.log('[StateManager] Reset complete');
  }
}
