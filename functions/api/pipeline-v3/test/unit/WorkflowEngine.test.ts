/**
 * WorkflowEngine - 单元测试
 * 
 * 测试工作流引擎的核心功能
 * 
 * @version 3.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WorkflowEngine } from '../../WorkflowEngine.js';
import { WorkflowDefinition } from '../../ExecutionContext.js';
import { NodeRegistry } from '../../base/Node.js';
import { ExampleNode } from '../../../nodes-v3/core/ExampleNode/index.js';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
    NodeRegistry.register(ExampleNode);
  });

  afterEach(() => {
    NodeRegistry.clear();
  });

  describe('loadWorkflow', () => {
    it('should load a valid workflow', () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
        settings: {
          timeout: 30000,
        },
      };

      expect(() => engine.loadWorkflow(workflow)).not.toThrow();
    });

    it('should throw error for workflow with missing nodes', () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [],
        connections: [],
        settings: {
          timeout: 30000,
        },
      };

      expect(() => engine.loadWorkflow(workflow)).toThrow('Workflow must have at least one node');
    });

    it('should throw error for workflow with unregistered node type', () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'non-existent-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
        settings: {
          timeout: 30000,
        },
      };

      expect(() => engine.loadWorkflow(workflow)).toThrow();
    });

    it('should detect cycles in workflow', () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
          },
          {
            id: 'node2',
            type: 'example-node',
            name: 'Node 2',
            position: { x: 100, y: 0 },
          },
        ],
        connections: [
          { from: 'node1', to: 'node2' },
          { from: 'node2', to: 'node1' }, // Cycle
        ],
        settings: {
          timeout: 30000,
        },
      };

      expect(() => engine.loadWorkflow(workflow)).toThrow('Cycle detected');
    });
  });

  describe('execute', () => {
    it('should execute a simple workflow', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
            config: { multiplier: 2 },
          },
        ],
        connections: [],
        settings: {
          timeout: 30000,
        },
      };

      engine.loadWorkflow(workflow);
      const result = await engine.execute({ value: 5 });

      expect(result).toBeDefined();
      expect(result.processedValue).toBe(10); // 5 * 2
    });

    it('should execute a workflow with multiple nodes', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
            config: { multiplier: 2 },
          },
          {
            id: 'node2',
            type: 'example-node',
            name: 'Node 2',
            position: { x: 100, y: 0 },
            config: { multiplier: 3 },
          },
        ],
        connections: [
          { from: 'node1', to: 'node2', fromOutput: 'success' },
        ],
        settings: {
          timeout: 30000,
        },
      };

      engine.loadWorkflow(workflow);
      const result = await engine.execute({ value: 5 });

      expect(result).toBeDefined();
      expect(result.processedValue).toBe(30); // 5 * 2 * 3
    });

    it('should handle node execution errors', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
            config: { shouldFail: true },
          },
        ],
        connections: [],
        settings: {
          timeout: 30000,
        },
      };

      engine.loadWorkflow(workflow);
      
      await expect(engine.execute({ value: 5 })).rejects.toThrow();
    });

    it('should timeout long-running workflows', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
            config: { delay: 5000 }, // 5 seconds
          },
        ],
        connections: [],
        settings: {
          timeout: 1000, // 1 second timeout
        },
      };

      engine.loadWorkflow(workflow);
      
      await expect(engine.execute({ value: 5 })).rejects.toThrow('timeout');
    }, 10000);
  });

  describe('getExecutionSummary', () => {
    it('should return execution summary after successful execution', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
        settings: {
          timeout: 30000,
        },
      };

      engine.loadWorkflow(workflow);
      await engine.execute({ value: 5 });

      const summary = engine.getExecutionSummary();

      expect(summary.status).toBe('completed');
      expect(summary.totalNodes).toBe(1);
      expect(summary.nodesExecuted).toBe(1);
      expect(summary.nodesFailed).toBe(0);
      expect(summary.totalExecutionTime).toBeGreaterThan(0);
    });

    it('should return execution summary after failed execution', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
            config: { shouldFail: true },
          },
        ],
        connections: [],
        settings: {
          timeout: 30000,
        },
      };

      engine.loadWorkflow(workflow);
      
      try {
        await engine.execute({ value: 5 });
      } catch (error) {
        // Expected error
      }

      const summary = engine.getExecutionSummary();

      expect(summary.status).toBe('failed');
      expect(summary.totalNodes).toBe(1);
      expect(summary.nodesFailed).toBe(1);
    });
  });

  describe('getExecutionHistory', () => {
    it('should return execution history', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
          },
          {
            id: 'node2',
            type: 'example-node',
            name: 'Node 2',
            position: { x: 100, y: 0 },
          },
        ],
        connections: [
          { from: 'node1', to: 'node2', fromOutput: 'success' },
        ],
        settings: {
          timeout: 30000,
        },
      };

      engine.loadWorkflow(workflow);
      await engine.execute({ value: 5 });

      const history = engine.getExecutionHistory();

      expect(history).toHaveLength(2);
      expect(history[0].nodeId).toBe('node1');
      expect(history[1].nodeId).toBe('node2');
    });
  });

  describe('generateVisualization', () => {
    it('should generate Mermaid visualization', () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
          },
          {
            id: 'node2',
            type: 'example-node',
            name: 'Node 2',
            position: { x: 100, y: 0 },
          },
        ],
        connections: [
          { from: 'node1', to: 'node2' },
        ],
        settings: {
          timeout: 30000,
        },
      };

      engine.loadWorkflow(workflow);
      const visualization = engine.generateVisualization();

      expect(visualization).toContain('graph TD');
      expect(visualization).toContain('node1');
      expect(visualization).toContain('node2');
      expect(visualization).toContain('-->');
    });
  });

  describe('reset', () => {
    it('should reset engine state', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'example-node',
            name: 'Node 1',
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
        settings: {
          timeout: 30000,
        },
      };

      engine.loadWorkflow(workflow);
      await engine.execute({ value: 5 });

      engine.reset();

      const history = engine.getExecutionHistory();
      expect(history).toHaveLength(0);
    });
  });
});
