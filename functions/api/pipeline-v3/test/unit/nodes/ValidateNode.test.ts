/**
 * ValidateNode - 单元测试
 * 
 * 测试验证节点的功能
 * 
 * @version 3.0.0
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ValidateNode } from '../../../../nodes-v3/core/ValidateNode/index.js';
import { ExecutionContext } from '../../../ExecutionContext.js';

describe('ValidateNode', () => {
  let node: ValidateNode;
  let context: ExecutionContext;

  beforeEach(() => {
    node = new ValidateNode();
    const workflow = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      nodes: [],
      connections: [],
      settings: { timeout: 30000 },
    };
    context = new ExecutionContext(workflow);
  });

  describe('OPTIONS request', () => {
    it('should handle OPTIONS request', async () => {
      const request = new Request('https://example.com', {
        method: 'OPTIONS',
        headers: { 'Origin': 'https://example.com' },
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await node.execute(input, context);

      expect(result.success).toBe(false);
      expect(result.outputName).toBe('error');
      expect(result.output).toBeInstanceOf(Response);
      const response = result.output as Response;
      expect(response.status).toBe(204);
    });
  });

  describe('Content-Type validation', () => {
    it('should reject non-JSON content type', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'text/plain',
        },
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await node.execute(input, context);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Content-Type');
    });

    it('should accept application/json content type', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'test message' }),
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await node.execute(input, context);

      expect(result.success).toBe(true);
    });
  });

  describe('message validation', () => {
    it('should reject empty message', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: '' }),
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await node.execute(input, context);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('message');
    });

    it('should reject message exceeding max length', async () => {
      const longMessage = 'a'.repeat(2000);
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: longMessage }),
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await node.execute(input, context);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('长度');
    });

    it('should accept valid message', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Valid message' }),
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await node.execute(input, context);

      expect(result.success).toBe(true);
      expect(result.output.body.message).toBe('Valid message');
    });
  });

  describe('conversationId validation', () => {
    it('should accept valid conversationId', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'test',
          conversationId: 'conv_abc123',
        }),
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await node.execute(input, context);

      expect(result.success).toBe(true);
    });

    it('should reject invalid conversationId format', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'test',
          conversationId: 'invalid-format',
        }),
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await node.execute(input, context);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('conversationId');
    });
  });

  describe('CORS headers', () => {
    it('should set correct CORS headers', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'test' }),
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await node.execute(input, context);

      expect(result.success).toBe(true);
      expect(result.output.corsHeaders).toBeDefined();
      expect(result.output.corsHeaders['Access-Control-Allow-Origin']).toBe('https://example.com');
    });
  });

  describe('configuration', () => {
    it('should use custom maxMessageLength', async () => {
      const customNode = new ValidateNode({ maxMessageLength: 10 });
      
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'Origin': 'https://example.com',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'This is a long message' }),
      });

      const input = {
        request,
        companyId: 'test',
        companyConfig: {
          allowedOrigins: ['https://example.com'],
        },
      };

      const result = await customNode.execute(input, context);

      expect(result.success).toBe(false);
    });
  });
});
