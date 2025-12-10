/**
 * Execution Tracer - 执行追踪器
 * 
 * 记录和可视化工作流执行的详细信息
 * 
 * @version 3.0.0
 */

import { ExecutionContext, ExecutionRecord, ExecutionSummary } from '../ExecutionContext.js';
import { WorkflowDefinition } from '../ExecutionContext.js';

/**
 * 追踪事件类型
 */
export type TraceEventType =
  | 'workflow_start'
  | 'workflow_complete'
  | 'workflow_error'
  | 'node_start'
  | 'node_complete'
  | 'node_error'
  | 'node_skip'
  | 'data_flow'
  | 'state_change';

/**
 * 追踪事件
 */
export interface TraceEvent {
  id: string;
  type: TraceEventType;
  timestamp: string;
  workflowId: string;
  nodeId?: string;
  nodeName?: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
  };
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * 追踪会话
 */
export interface TraceSession {
  sessionId: string;
  workflowId: string;
  workflowName: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  events: TraceEvent[];
  summary?: ExecutionSummary;
}

/**
 * 执行追踪器配置
 */
export interface TracerConfig {
  maxEvents?: number;
  captureData?: boolean;
  captureErrors?: boolean;
  logLevel?: 'verbose' | 'normal' | 'minimal';
}

/**
 * 执行追踪器类
 */
export class ExecutionTracer {
  private sessions: Map<string, TraceSession>;
  private config: Required<TracerConfig>;
  private eventListeners: Map<TraceEventType, Array<(event: TraceEvent) => void>>;

  constructor(config?: TracerConfig) {
    this.sessions = new Map();
    this.config = {
      maxEvents: 1000,
      captureData: true,
      captureErrors: true,
      logLevel: 'normal',
      ...config,
    };
    this.eventListeners = new Map();
  }

  /**
   * 开始追踪会话
   */
  startSession(workflowId: string, workflowName: string): string {
    const sessionId = this.generateSessionId();
    
    const session: TraceSession = {
      sessionId,
      workflowId,
      workflowName,
      startTime: new Date().toISOString(),
      status: 'running',
      events: [],
    };

    this.sessions.set(sessionId, session);

    // 记录工作流开始事件
    this.recordEvent(sessionId, {
      id: this.generateEventId(),
      type: 'workflow_start',
      timestamp: new Date().toISOString(),
      workflowId,
      data: { workflowName },
    });

    return sessionId;
  }

  /**
   * 结束追踪会话
   */
  endSession(sessionId: string, summary: ExecutionSummary): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[ExecutionTracer] Session not found: ${sessionId}`);
      return;
    }

    session.endTime = new Date().toISOString();
    session.status = summary.status === 'completed' ? 'completed' : 'failed';
    session.summary = summary;

    // 记录工作流完成事件
    this.recordEvent(sessionId, {
      id: this.generateEventId(),
      type: summary.status === 'completed' ? 'workflow_complete' : 'workflow_error',
      timestamp: new Date().toISOString(),
      workflowId: session.workflowId,
      data: summary,
      duration: summary.totalExecutionTime,
    });
  }

  /**
   * 记录节点开始
   */
  recordNodeStart(sessionId: string, nodeId: string, nodeName: string, input: any): void {
    const event: TraceEvent = {
      id: this.generateEventId(),
      type: 'node_start',
      timestamp: new Date().toISOString(),
      workflowId: this.getWorkflowId(sessionId),
      nodeId,
      nodeName,
      data: this.config.captureData ? { input } : undefined,
    };

    this.recordEvent(sessionId, event);
  }

  /**
   * 记录节点完成
   */
  recordNodeComplete(
    sessionId: string,
    nodeId: string,
    nodeName: string,
    output: any,
    duration: number
  ): void {
    const event: TraceEvent = {
      id: this.generateEventId(),
      type: 'node_complete',
      timestamp: new Date().toISOString(),
      workflowId: this.getWorkflowId(sessionId),
      nodeId,
      nodeName,
      data: this.config.captureData ? { output } : undefined,
      duration,
    };

    this.recordEvent(sessionId, event);
  }

  /**
   * 记录节点错误
   */
  recordNodeError(
    sessionId: string,
    nodeId: string,
    nodeName: string,
    error: Error,
    duration: number
  ): void {
    const event: TraceEvent = {
      id: this.generateEventId(),
      type: 'node_error',
      timestamp: new Date().toISOString(),
      workflowId: this.getWorkflowId(sessionId),
      nodeId,
      nodeName,
      error: this.config.captureErrors
        ? {
            message: error.message,
            stack: error.stack,
          }
        : { message: error.message },
      duration,
    };

    this.recordEvent(sessionId, event);
  }

  /**
   * 记录数据流
   */
  recordDataFlow(
    sessionId: string,
    fromNode: string,
    toNode: string,
    data: any
  ): void {
    const event: TraceEvent = {
      id: this.generateEventId(),
      type: 'data_flow',
      timestamp: new Date().toISOString(),
      workflowId: this.getWorkflowId(sessionId),
      data: this.config.captureData
        ? { from: fromNode, to: toNode, data }
        : { from: fromNode, to: toNode },
    };

    this.recordEvent(sessionId, event);
  }

  /**
   * 记录状态变化
   */
  recordStateChange(
    sessionId: string,
    nodeId: string,
    fromState: string,
    toState: string
  ): void {
    const event: TraceEvent = {
      id: this.generateEventId(),
      type: 'state_change',
      timestamp: new Date().toISOString(),
      workflowId: this.getWorkflowId(sessionId),
      nodeId,
      data: { fromState, toState },
    };

    this.recordEvent(sessionId, event);
  }

  /**
   * 记录事件
   */
  private recordEvent(sessionId: string, event: TraceEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[ExecutionTracer] Session not found: ${sessionId}`);
      return;
    }

    // 添加事件到会话
    session.events.push(event);

    // 限制事件数量
    if (session.events.length > this.config.maxEvents) {
      session.events.shift();
    }

    // 触发事件监听器
    this.emitEvent(event);

    // 日志输出
    if (this.config.logLevel === 'verbose') {
      console.log(`[ExecutionTracer] ${event.type}:`, event);
    } else if (this.config.logLevel === 'normal') {
      const logMap: Record<TraceEventType, boolean> = {
        workflow_start: true,
        workflow_complete: true,
        workflow_error: true,
        node_start: false,
        node_complete: true,
        node_error: true,
        node_skip: true,
        data_flow: false,
        state_change: false,
      };
      if (logMap[event.type]) {
        console.log(`[ExecutionTracer] ${event.type}:`, event.nodeId || event.workflowId);
      }
    }
  }

  /**
   * 获取会话
   */
  getSession(sessionId: string): TraceSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): TraceSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 清除会话
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * 清除所有会话
   */
  clearAllSessions(): void {
    this.sessions.clear();
  }

  /**
   * 添加事件监听器
   */
  on(eventType: TraceEventType, listener: (event: TraceEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  off(eventType: TraceEventType, listener: (event: TraceEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: TraceEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error('[ExecutionTracer] Event listener error:', error);
        }
      }
    }
  }

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成事件 ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取工作流 ID
   */
  private getWorkflowId(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    return session?.workflowId || 'unknown';
  }

  /**
   * 生成执行时间线
   */
  generateTimeline(sessionId: string): Array<{
    timestamp: string;
    type: string;
    label: string;
    duration?: number;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.events.map(event => ({
      timestamp: event.timestamp,
      type: event.type,
      label: event.nodeName || event.workflowId,
      duration: event.duration,
    }));
  }

  /**
   * 生成执行统计
   */
  generateStats(sessionId: string): {
    totalEvents: number;
    nodeExecutions: number;
    nodeErrors: number;
    totalDuration: number;
    avgNodeDuration: number;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        totalEvents: 0,
        nodeExecutions: 0,
        nodeErrors: 0,
        totalDuration: 0,
        avgNodeDuration: 0,
      };
    }

    const nodeCompleteEvents = session.events.filter(e => e.type === 'node_complete');
    const nodeErrorEvents = session.events.filter(e => e.type === 'node_error');
    
    const totalDuration = nodeCompleteEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
    const avgNodeDuration = nodeCompleteEvents.length > 0
      ? totalDuration / nodeCompleteEvents.length
      : 0;

    return {
      totalEvents: session.events.length,
      nodeExecutions: nodeCompleteEvents.length,
      nodeErrors: nodeErrorEvents.length,
      totalDuration,
      avgNodeDuration,
    };
  }

  /**
   * 导出会话为 JSON
   */
  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '{}';
    
    return JSON.stringify(session, null, 2);
  }

  /**
   * 生成 HTML 报告
   */
  generateHTMLReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '<p>Session not found</p>';

    const stats = this.generateStats(sessionId);
    const timeline = this.generateTimeline(sessionId);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>执行追踪报告 - ${session.workflowName}</title>
  <style>
    body { font-family: sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
    h1 { color: #333; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 14px; color: #666; margin-top: 8px; }
    .timeline { margin: 30px 0; }
    .event { padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; background: #f9f9f9; border-radius: 4px; }
    .event-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 8px; }
    .event-time { color: #666; font-size: 12px; }
    .event.error { border-left-color: #f44336; background: #ffebee; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>执行追踪报告</h1>
  <p><strong>工作流:</strong> ${session.workflowName}</p>
  <p><strong>会话 ID:</strong> ${session.sessionId}</p>
  <p><strong>状态:</strong> ${session.status}</p>
  <p><strong>开始时间:</strong> ${session.startTime}</p>
  ${session.endTime ? `<p><strong>结束时间:</strong> ${session.endTime}</p>` : ''}
  
  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${stats.totalEvents}</div>
      <div class="stat-label">总事件数</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.nodeExecutions}</div>
      <div class="stat-label">节点执行数</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.nodeErrors}</div>
      <div class="stat-label">错误数</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalDuration.toFixed(0)}ms</div>
      <div class="stat-label">总执行时间</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.avgNodeDuration.toFixed(0)}ms</div>
      <div class="stat-label">平均节点时间</div>
    </div>
  </div>

  <h2>执行时间线</h2>
  <div class="timeline">
    ${session.events.map(event => `
      <div class="event ${event.type.includes('error') ? 'error' : ''}">
        <div class="event-header">
          <span>${event.type} - ${event.nodeName || event.workflowId}</span>
          <span class="event-time">${event.timestamp} ${event.duration ? `(${event.duration}ms)` : ''}</span>
        </div>
        ${event.error ? `<pre>${event.error.message}</pre>` : ''}
      </div>
    `).join('')}
  </div>

  ${session.summary ? `
    <h2>执行摘要</h2>
    <pre>${JSON.stringify(session.summary, null, 2)}</pre>
  ` : ''}
</body>
</html>`;
  }
}

export default ExecutionTracer;
