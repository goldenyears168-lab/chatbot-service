/**
 * Chatbot Workflow - 集成测试
 * 
 * 测试完整的聊天机器人工作流
 * 
 * @version 3.0.0
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { WorkflowEngine } from '../../WorkflowEngine.js';
import { NodeRegistry } from '../../base/Node.js';

// Import all nodes
import { ValidateNode } from '../../../nodes-v3/core/ValidateNode/index.js';
import { InitializeNode } from '../../../nodes-v3/core/InitializeNode/index.js';
import { ContextNode } from '../../../nodes-v3/core/ContextNode/index.js';
import { IntentNode } from '../../../nodes-v3/core/IntentNode/index.js';
import { StateTransitionNode } from '../../../nodes-v3/core/StateTransitionNode/index.js';
import { SpecialIntentNode } from '../../../nodes-v3/core/SpecialIntentNode/index.js';
import { FAQNode } from '../../../nodes-v3/core/FAQNode/index.js';
import { LLMNode } from '../../../nodes-v3/core/LLMNode/index.js';
import { ResponseNode } from '../../../nodes-v3/core/ResponseNode/index.js';

describe('Chatbot Workflow Integration', () => {
  let engine: WorkflowEngine;

  beforeAll(() => {
    // Register all nodes
    NodeRegistry.register(ValidateNode);
    NodeRegistry.register(InitializeNode);
    NodeRegistry.register(ContextNode);
    NodeRegistry.register(IntentNode);
    NodeRegistry.register(StateTransitionNode);
    NodeRegistry.register(SpecialIntentNode);
    NodeRegistry.register(FAQNode);
    NodeRegistry.register(LLMNode);
    NodeRegistry.register(ResponseNode);

    engine = new WorkflowEngine();
  });

  afterAll(() => {
    NodeRegistry.clear();
  });

  describe('Simple message flow', () => {
    it('should process a simple message through the workflow', async () => {
      // Load workflow from JSON
      const workflow = await import('../../../workflows-v3/chatbot-main-workflow.json');
      
      engine.loadWorkflow(workflow);

      // Create mock request
      const request = new Request('https://example.com/api/chat', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello, I need help',
        }),
      });

      const input = {
        request,
        companyId: 'goldenyears',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await engine.execute(input);

      expect(result).toBeDefined();
      
      // Check execution summary
      const summary = engine.getExecutionSummary();
      expect(summary.status).toBe('completed');
      expect(summary.nodesExecuted).toBeGreaterThan(0);
      expect(summary.nodesFailed).toBe(0);
    });
  });

  describe('FAQ flow', () => {
    it('should handle FAQ questions', async () => {
      const workflow = await import('../../../workflows-v3/chatbot-main-workflow.json');
      engine.loadWorkflow(workflow);

      const request = new Request('https://example.com/api/chat', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'What are your business hours?',
          source: 'menu',
        }),
      });

      const input = {
        request,
        companyId: 'goldenyears',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await engine.execute(input);

      expect(result).toBeDefined();
      
      const summary = engine.getExecutionSummary();
      expect(summary.status).toBe('completed');
    });
  });

  describe('Error handling', () => {
    it('should handle validation errors gracefully', async () => {
      const workflow = await import('../../../workflows-v3/chatbot-main-workflow.json');
      engine.loadWorkflow(workflow);

      const request = new Request('https://example.com/api/chat', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '', // Empty message
        }),
      });

      const input = {
        request,
        companyId: 'goldenyears',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      // Should not throw, but return error response
      const result = await engine.execute(input);
      
      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      expect(response.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should complete workflow execution within acceptable time', async () => {
      const workflow = await import('../../../workflows-v3/chatbot-main-workflow.json');
      engine.loadWorkflow(workflow);

      const request = new Request('https://example.com/api/chat', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test message',
        }),
      });

      const input = {
        request,
        companyId: 'goldenyears',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const startTime = Date.now();
      await engine.execute(input);
      const executionTime = Date.now() - startTime;

      // Should complete in less than 3 seconds (without LLM)
      expect(executionTime).toBeLessThan(3000);
    });

    it('should handle concurrent executions', async () => {
      const workflow = await import('../../../workflows-v3/chatbot-main-workflow.json');
      engine.loadWorkflow(workflow);

      const createRequest = (message: string) => {
        return new Request('https://example.com/api/chat', {
          method: 'POST',
          headers: {
            'Origin': 'https://example.com',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
      };

      const requests = [
        { request: createRequest('Message 1'), companyId: 'goldenyears', companyConfig: { allowedOrigins: ['https://example.com'] } },
        { request: createRequest('Message 2'), companyId: 'goldenyears', companyConfig: { allowedOrigins: ['https://example.com'] } },
        { request: createRequest('Message 3'), companyId: 'goldenyears', companyConfig: { allowedOrigins: ['https://example.com'] } },
      ];

      const results = await Promise.all(
        requests.map(input => engine.execute(input))
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Workflow visualization', () => {
    it('should generate visualization for loaded workflow', async () => {
      const workflow = await import('../../../workflows-v3/chatbot-main-workflow.json');
      engine.loadWorkflow(workflow);

      const visualization = engine.generateVisualization();

      expect(visualization).toContain('graph TD');
      expect(visualization).toContain('validate');
      expect(visualization).toContain('initialize');
      expect(visualization).toContain('response');
    });
  });
});
