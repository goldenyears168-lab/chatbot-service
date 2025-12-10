/**
 * ExecutionContext - 单元测试
 * 
 * 测试执行上下文的核心功能
 * 
 * @version 3.0.0
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ExecutionContext } from '../../ExecutionContext.js';

describe('ExecutionContext', () => {
  let context: ExecutionContext;

  beforeEach(() => {
    const workflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      version: '1.0.0',
      nodes: [],
      connections: [],
      settings: { timeout: 30000 },
    };
    context = new ExecutionContext(workflow);
  });

  describe('setData / getData', () => {
    it('should store and retrieve data', () => {
      context.setData('testKey', 'testValue');
      expect(context.getData('testKey')).toBe('testValue');
    });

    it('should return undefined for non-existent keys', () => {
      expect(context.getData('nonExistent')).toBeUndefined();
    });

    it('should overwrite existing data', () => {
      context.setData('key', 'value1');
      context.setData('key', 'value2');
      expect(context.getData('key')).toBe('value2');
    });

    it('should handle complex data types', () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { foo: 'bar' },
        },
      };
      context.setData('complex', complexData);
      expect(context.getData('complex')).toEqual(complexData);
    });
  });

  describe('hasData', () => {
    it('should return true for existing keys', () => {
      context.setData('key', 'value');
      expect(context.hasData('key')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(context.hasData('nonExistent')).toBe(false);
    });
  });

  describe('removeData', () => {
    it('should remove data', () => {
      context.setData('key', 'value');
      context.removeData('key');
      expect(context.hasData('key')).toBe(false);
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => context.removeData('nonExistent')).not.toThrow();
    });
  });

  describe('clearData', () => {
    it('should clear all data', () => {
      context.setData('key1', 'value1');
      context.setData('key2', 'value2');
      context.clearData();
      expect(context.hasData('key1')).toBe(false);
      expect(context.hasData('key2')).toBe(false);
    });
  });

  describe('recordNodeStart', () => {
    it('should record node start', () => {
      context.recordNodeStart('node1', 'Node 1', { input: 'test' });
      const records = context.getExecutionRecords();
      
      expect(records).toHaveLength(1);
      expect(records[0].nodeId).toBe('node1');
      expect(records[0].nodeName).toBe('Node 1');
      expect(records[0].status).toBe('running');
    });
  });

  describe('recordNodeComplete', () => {
    it('should record node completion', () => {
      context.recordNodeStart('node1', 'Node 1', { input: 'test' });
      context.recordNodeComplete('node1', { success: true, output: 'result' });
      
      const records = context.getExecutionRecords();
      const record = records.find(r => r.nodeId === 'node1');
      
      expect(record).toBeDefined();
      expect(record?.status).toBe('completed');
      expect(record?.result?.success).toBe(true);
      expect(record?.executionTime).toBeGreaterThan(0);
    });

    it('should throw if node was not started', () => {
      expect(() => {
        context.recordNodeComplete('node1', { success: true });
      }).toThrow('No running record found for node');
    });
  });

  describe('recordNodeError', () => {
    it('should record node error', () => {
      context.recordNodeStart('node1', 'Node 1', { input: 'test' });
      const error = new Error('Test error');
      context.recordNodeError('node1', error);
      
      const records = context.getExecutionRecords();
      const record = records.find(r => r.nodeId === 'node1');
      
      expect(record).toBeDefined();
      expect(record?.status).toBe('failed');
      expect(record?.error).toBeDefined();
      expect(record?.error?.message).toBe('Test error');
    });
  });

  describe('getNodeRecord', () => {
    it('should retrieve specific node record', () => {
      context.recordNodeStart('node1', 'Node 1', { input: 'test' });
      context.recordNodeComplete('node1', { success: true });
      
      const record = context.getNodeRecord('node1');
      
      expect(record).toBeDefined();
      expect(record?.nodeId).toBe('node1');
      expect(record?.status).toBe('completed');
    });

    it('should return undefined for non-existent node', () => {
      expect(context.getNodeRecord('nonExistent')).toBeUndefined();
    });
  });

  describe('getSummary', () => {
    it('should generate execution summary', () => {
      context.recordNodeStart('node1', 'Node 1', {});
      context.recordNodeComplete('node1', { success: true });
      
      context.recordNodeStart('node2', 'Node 2', {});
      context.recordNodeComplete('node2', { success: true });
      
      const summary = context.getSummary();
      
      expect(summary.workflowId).toBe('test-workflow');
      expect(summary.status).toBe('completed');
      expect(summary.nodesExecuted).toBe(2);
      expect(summary.nodesFailed).toBe(0);
      expect(summary.totalExecutionTime).toBeGreaterThan(0);
    });

    it('should mark summary as failed if any node failed', () => {
      context.recordNodeStart('node1', 'Node 1', {});
      context.recordNodeComplete('node1', { success: true });
      
      context.recordNodeStart('node2', 'Node 2', {});
      context.recordNodeError('node2', new Error('Failed'));
      
      const summary = context.getSummary();
      
      expect(summary.status).toBe('failed');
      expect(summary.nodesExecuted).toBe(2);
      expect(summary.nodesFailed).toBe(1);
    });
  });

  describe('getDataSnapshot', () => {
    it('should return snapshot of all data', () => {
      context.setData('key1', 'value1');
      context.setData('key2', 'value2');
      
      const snapshot = context.getDataSnapshot();
      
      expect(snapshot).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should return deep copy to prevent mutation', () => {
      const data = { nested: { value: 'test' } };
      context.setData('key', data);
      
      const snapshot = context.getDataSnapshot();
      snapshot.key.nested.value = 'modified';
      
      expect(context.getData('key').nested.value).toBe('test');
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        context.setData(`key${i}`, `value${i}`);
      }
      
      const setTime = Date.now() - startTime;
      expect(setTime).toBeLessThan(100); // Should complete in less than 100ms
      
      const getStartTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        context.getData(`key${i}`);
      }
      
      const getTime = Date.now() - getStartTime;
      expect(getTime).toBeLessThan(50); // Should complete in less than 50ms
    });

    it('should handle many node records efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        context.recordNodeStart(`node${i}`, `Node ${i}`, {});
        context.recordNodeComplete(`node${i}`, { success: true });
      }
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(200); // Should complete in less than 200ms
      
      const records = context.getExecutionRecords();
      expect(records).toHaveLength(100);
    });
  });
});
