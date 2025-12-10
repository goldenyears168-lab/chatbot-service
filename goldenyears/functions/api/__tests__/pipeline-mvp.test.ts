/**
 * Pipeline MVP 測試
 * 測試 Pipeline 框架和核心節點的正確性
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Pipeline, PipelineContext } from '../lib/pipeline.js';
import { node_validateRequest, node_initializeServices, handlePipelineError } from '../nodes/index.js';

describe('Pipeline MVP Tests', () => {
  let pipeline: Pipeline;
  let baseContext: PipelineContext;

  beforeEach(() => {
    pipeline = new Pipeline({
      enableDetailedLogging: false, // 測試時關閉詳細日誌
    });
    baseContext = {
      request: new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify({
          message: '測試訊息',
        }),
      }),
      env: {
        GEMINI_API_KEY: 'test-key',
      },
      corsHeaders: {},
      startTime: Date.now(),
      logs: [],
    };
  });

  describe('Node 1: Validate Request', () => {
    it('should return 204 for OPTIONS request', async () => {
      const ctx = {
        ...baseContext,
        request: new Request('http://localhost/api/chat', {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:8080',
          },
        }),
      };

      const result = await node_validateRequest(ctx);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(204);
      }
    });

    it('should return 400 for invalid Content-Type', async () => {
      const ctx = {
        ...baseContext,
        request: new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: 'test',
        }),
      };

      const result = await node_validateRequest(ctx);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(400);
        const body = await result.json();
        expect(body.error).toBe('Invalid Content-Type');
      }
    });

    it('should return 400 for empty message', async () => {
      const ctx = {
        ...baseContext,
        request: new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: '',
          }),
        }),
      };

      const result = await node_validateRequest(ctx);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(400);
        const body = await result.json();
        expect(body.error).toBe('Invalid request');
      }
    });

    it('should pass validation for valid request', async () => {
      const result = await node_validateRequest(baseContext);

      expect(result).not.toBeInstanceOf(Response);
      if (!(result instanceof Response)) {
        expect(result.body).toBeDefined();
        expect(result.body.message).toBe('測試訊息');
      }
    });
  });

  describe('Pipeline Framework', () => {
    it('should execute nodes in order', async () => {
      pipeline.addNode('validate', node_validateRequest);
      
      const executedNodes: string[] = [];
      const mockNode = async (ctx: PipelineContext) => {
        executedNodes.push('mock');
        return ctx;
      };
      
      pipeline.addNode('mock', mockNode);

      const ctx = await pipeline.execute(baseContext);

      expect(executedNodes).toContain('mock');
    });

    it('should stop execution when node returns Response', async () => {
      pipeline.addNode('validate', node_validateRequest);
      
      const executedNodes: string[] = [];
      const mockNode = async (ctx: PipelineContext) => {
        executedNodes.push('mock');
        return ctx;
      };
      
      pipeline.addNode('mock', mockNode);

      const invalidCtx = {
        ...baseContext,
        request: new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
        }),
      };

      const result = await pipeline.execute(invalidCtx);

      expect(result).toBeInstanceOf(Response);
      expect(executedNodes).not.toContain('mock'); // 不應該執行後續節點
    });

    it('should propagate errors to outer catch', async () => {
      pipeline.addNode('validate', node_validateRequest);
      
      const errorNode = async (ctx: PipelineContext) => {
        throw new Error('Test error');
      };
      
      pipeline.addNode('error', errorNode);

      await expect(pipeline.execute(baseContext)).rejects.toThrow('Test error');
    });

    it('should log node execution', async () => {
      pipeline.addNode('validate', node_validateRequest);

      const ctx = await pipeline.execute(baseContext);

      expect(ctx.logs.length).toBeGreaterThan(0);
      expect(ctx.logs[0].node).toBe('validate');
    });
  });

  describe('Error Handler', () => {
    it('should return 500 error response', async () => {
      const error = new Error('Test error');
      const result = handlePipelineError(error, baseContext);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(500);
        const body = await result.json();
        expect(body.intent).toBe('handoff_to_human');
      }
    });

    it('should include error logging for knowledge base errors', async () => {
      const error = new Error('Failed to load knowledge base');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      handlePipelineError(error, baseContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Knowledge base loading failed')
      );

      consoleSpy.mockRestore();
    });
  });
});

