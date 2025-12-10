/**
 * Workflow API - 工作流管理 API
 * 
 * 提供 RESTful API 用于管理工作流
 * 
 * @version 3.0.0
 */

import { WorkflowEngine } from '../WorkflowEngine.js';
import { WorkflowDefinition } from '../ExecutionContext.js';
import { ExecutionTracer } from '../visualization/ExecutionTracer.js';
import { FlowDiagram } from '../visualization/FlowDiagram.js';

/**
 * API 响应接口
 */
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    version: string;
  };
}

/**
 * 工作流列表项
 */
interface WorkflowListItem {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive';
  nodeCount: number;
  connectionCount: number;
  lastModified: string;
  lastExecuted?: string;
}

/**
 * 工作流执行请求
 */
interface ExecutionRequest {
  workflowId: string;
  input: any;
  config?: {
    timeout?: number;
    traceExecution?: boolean;
  };
}

/**
 * Workflow API 类
 */
export class WorkflowAPI {
  private engine: WorkflowEngine;
  private tracer: ExecutionTracer;
  private workflows: Map<string, WorkflowDefinition>;

  constructor() {
    this.engine = new WorkflowEngine();
    this.tracer = new ExecutionTracer({
      captureData: true,
      captureErrors: true,
      logLevel: 'normal',
    });
    this.workflows = new Map();
  }

  /**
   * 获取所有工作流列表
   */
  async listWorkflows(): Promise<APIResponse<WorkflowListItem[]>> {
    try {
      const workflowList: WorkflowListItem[] = Array.from(this.workflows.values()).map(wf => ({
        id: wf.id,
        name: wf.name,
        version: wf.version,
        status: 'active' as const,
        nodeCount: wf.nodes.length,
        connectionCount: wf.connections.length,
        lastModified: wf.metadata?.updated || wf.metadata?.created || new Date().toISOString(),
      }));

      return {
        success: true,
        data: workflowList,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'LIST_WORKFLOWS_ERROR',
        'Failed to list workflows',
        error
      );
    }
  }

  /**
   * 获取工作流详情
   */
  async getWorkflow(workflowId: string): Promise<APIResponse<WorkflowDefinition>> {
    try {
      const workflow = this.workflows.get(workflowId);
      
      if (!workflow) {
        return this.createErrorResponse(
          'WORKFLOW_NOT_FOUND',
          `Workflow not found: ${workflowId}`
        );
      }

      return {
        success: true,
        data: workflow,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'GET_WORKFLOW_ERROR',
        'Failed to get workflow',
        error
      );
    }
  }

  /**
   * 创建工作流
   */
  async createWorkflow(workflow: WorkflowDefinition): Promise<APIResponse<WorkflowDefinition>> {
    try {
      // 验证工作流
      if (!workflow.id || !workflow.name) {
        return this.createErrorResponse(
          'INVALID_WORKFLOW',
          'Workflow must have id and name'
        );
      }

      // 检查是否已存在
      if (this.workflows.has(workflow.id)) {
        return this.createErrorResponse(
          'WORKFLOW_EXISTS',
          `Workflow already exists: ${workflow.id}`
        );
      }

      // 添加元数据
      workflow.metadata = {
        ...workflow.metadata,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      // 保存工作流
      this.workflows.set(workflow.id, workflow);

      return {
        success: true,
        data: workflow,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'CREATE_WORKFLOW_ERROR',
        'Failed to create workflow',
        error
      );
    }
  }

  /**
   * 更新工作流
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<WorkflowDefinition>
  ): Promise<APIResponse<WorkflowDefinition>> {
    try {
      const workflow = this.workflows.get(workflowId);
      
      if (!workflow) {
        return this.createErrorResponse(
          'WORKFLOW_NOT_FOUND',
          `Workflow not found: ${workflowId}`
        );
      }

      // 更新工作流
      const updatedWorkflow = {
        ...workflow,
        ...updates,
        id: workflow.id, // 保持 ID 不变
        metadata: {
          ...workflow.metadata,
          ...updates.metadata,
          updated: new Date().toISOString(),
        },
      };

      this.workflows.set(workflowId, updatedWorkflow);

      return {
        success: true,
        data: updatedWorkflow,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'UPDATE_WORKFLOW_ERROR',
        'Failed to update workflow',
        error
      );
    }
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(workflowId: string): Promise<APIResponse<void>> {
    try {
      if (!this.workflows.has(workflowId)) {
        return this.createErrorResponse(
          'WORKFLOW_NOT_FOUND',
          `Workflow not found: ${workflowId}`
        );
      }

      this.workflows.delete(workflowId);

      return {
        success: true,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'DELETE_WORKFLOW_ERROR',
        'Failed to delete workflow',
        error
      );
    }
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(request: ExecutionRequest): Promise<APIResponse<any>> {
    try {
      const workflow = this.workflows.get(request.workflowId);
      
      if (!workflow) {
        return this.createErrorResponse(
          'WORKFLOW_NOT_FOUND',
          `Workflow not found: ${request.workflowId}`
        );
      }

      // 加载工作流
      this.engine.loadWorkflow(workflow);

      // 开始追踪（如果启用）
      let sessionId: string | undefined;
      if (request.config?.traceExecution) {
        sessionId = this.tracer.startSession(workflow.id, workflow.name);
      }

      // 执行工作流
      const result = await this.engine.execute(request.input);

      // 结束追踪
      if (sessionId) {
        const summary = this.engine.getExecutionSummary();
        this.tracer.endSession(sessionId, summary);
      }

      return {
        success: true,
        data: {
          result,
          summary: this.engine.getExecutionSummary(),
          sessionId,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'EXECUTE_WORKFLOW_ERROR',
        'Failed to execute workflow',
        error
      );
    }
  }

  /**
   * 获取工作流可视化（Mermaid）
   */
  async getWorkflowVisualization(workflowId: string): Promise<APIResponse<string>> {
    try {
      const workflow = this.workflows.get(workflowId);
      
      if (!workflow) {
        return this.createErrorResponse(
          'WORKFLOW_NOT_FOUND',
          `Workflow not found: ${workflowId}`
        );
      }

      const diagram = new FlowDiagram({
        direction: 'TD',
        theme: 'default',
        showMetadata: false,
      });

      const mermaidCode = diagram.generateMermaid(workflow);

      return {
        success: true,
        data: mermaidCode,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'GENERATE_VISUALIZATION_ERROR',
        'Failed to generate visualization',
        error
      );
    }
  }

  /**
   * 获取执行历史
   */
  async getExecutionHistory(limit: number = 50): Promise<APIResponse<any[]>> {
    try {
      const sessions = this.tracer.getAllSessions()
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, limit);

      return {
        success: true,
        data: sessions,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'GET_EXECUTION_HISTORY_ERROR',
        'Failed to get execution history',
        error
      );
    }
  }

  /**
   * 获取执行详情
   */
  async getExecution(sessionId: string): Promise<APIResponse<any>> {
    try {
      const session = this.tracer.getSession(sessionId);
      
      if (!session) {
        return this.createErrorResponse(
          'SESSION_NOT_FOUND',
          `Session not found: ${sessionId}`
        );
      }

      return {
        success: true,
        data: session,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'GET_EXECUTION_ERROR',
        'Failed to get execution details',
        error
      );
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<APIResponse<any>> {
    try {
      const sessions = this.tracer.getAllSessions();
      
      const stats = {
        totalWorkflows: this.workflows.size,
        totalExecutions: sessions.length,
        successfulExecutions: sessions.filter(s => s.status === 'completed').length,
        failedExecutions: sessions.filter(s => s.status === 'failed').length,
        successRate: sessions.length > 0
          ? (sessions.filter(s => s.status === 'completed').length / sessions.length * 100).toFixed(2)
          : 0,
      };

      return {
        success: true,
        data: stats,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        'GET_STATS_ERROR',
        'Failed to get statistics',
        error
      );
    }
  }

  /**
   * 创建错误响应
   */
  private createErrorResponse(
    code: string,
    message: string,
    error?: any
  ): APIResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details: error instanceof Error ? error.message : error,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
      },
    };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<APIResponse<{ status: string }>> {
    return {
      success: true,
      data: {
        status: 'healthy',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
      },
    };
  }
}

export default WorkflowAPI;
