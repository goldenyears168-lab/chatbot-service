/**
 * Example Node - 单元测试
 * 
 * 演示如何为 Pipeline v3 节点编写测试
 */

import { ExampleNode } from './index.js';
import { ExecutionContext } from '../../../pipeline-v3/ExecutionContext.js';

/**
 * 创建测试上下文
 */
function createTestContext(): ExecutionContext {
  const workflow = {
    id: 'test-workflow',
    name: 'Test Workflow',
    version: '1.0.0',
    description: 'Test',
    nodes: [],
    connections: [],
  };

  return new ExecutionContext('test-exec-123', workflow as any);
}

/**
 * 基本功能测试
 */
describe('ExampleNode - Basic Functionality', () => {
  it('should create node instance', () => {
    const node = new ExampleNode();
    expect(node).toBeDefined();
    expect(node.getId()).toBe('example-node');
    expect(node.getName()).toBe('Example Node');
  });

  it('should process message successfully', async () => {
    const node = new ExampleNode();
    const context = createTestContext();

    const result = await node.execute({
      message: 'test message'
    }, context);

    expect(result.success).toBe(true);
    expect(result.outputName).toBe('success');
    expect(result.output.message).toBe('test message');
    expect(result.output.processed).toBe(true);
    expect(result.output.timestamp).toBeDefined();
  });

  it('should fail with missing required input', async () => {
    const node = new ExampleNode();
    const context = createTestContext();

    const result = await node.execute({}, context);

    expect(result.success).toBe(false);
    expect(result.outputName).toBe('error');
    expect(result.error).toBeDefined();
  });
});

/**
 * 配置选项测试
 */
describe('ExampleNode - Configuration', () => {
  it('should convert to uppercase when configured', async () => {
    const node = new ExampleNode({ toUpperCase: true });
    const context = createTestContext();

    const result = await node.execute({
      message: 'hello world'
    }, context);

    expect(result.success).toBe(true);
    expect(result.output.message).toBe('HELLO WORLD');
  });

  it('should add prefix when configured', async () => {
    const node = new ExampleNode({ prefix: '[PROCESSED] ' });
    const context = createTestContext();

    const result = await node.execute({
      message: 'test'
    }, context);

    expect(result.success).toBe(true);
    expect(result.output.message).toBe('[PROCESSED] test');
  });

  it('should not add timestamp when disabled', async () => {
    const node = new ExampleNode({ addTimestamp: false });
    const context = createTestContext();

    const result = await node.execute({
      message: 'test'
    }, context);

    expect(result.success).toBe(true);
    expect(result.output.timestamp).toBeUndefined();
  });

  it('should apply multiple configurations', async () => {
    const node = new ExampleNode({
      toUpperCase: true,
      prefix: 'RESULT: ',
      addTimestamp: false
    });
    const context = createTestContext();

    const result = await node.execute({
      message: 'hello'
    }, context);

    expect(result.success).toBe(true);
    expect(result.output.message).toBe('RESULT: HELLO');
    expect(result.output.timestamp).toBeUndefined();
  });
});

/**
 * 上下文数据共享测试
 */
describe('ExampleNode - Context Data', () => {
  it('should store data in context', async () => {
    const node = new ExampleNode();
    const context = createTestContext();

    await node.execute({
      message: 'first message'
    }, context);

    expect(context.getData('lastProcessedMessage')).toBe('first message');
    expect(context.getData('processCount')).toBe(1);
  });

  it('should increment process count', async () => {
    const node = new ExampleNode();
    const context = createTestContext();

    await node.execute({ message: 'msg 1' }, context);
    await node.execute({ message: 'msg 2' }, context);
    await node.execute({ message: 'msg 3' }, context);

    expect(context.getData('processCount')).toBe(3);
    expect(context.getData('lastProcessedMessage')).toBe('msg 3');
  });
});

/**
 * 执行时间测试
 */
describe('ExampleNode - Performance', () => {
  it('should execute quickly', async () => {
    const node = new ExampleNode();
    const context = createTestContext();

    const result = await node.execute({
      message: 'test'
    }, context);

    expect(result.metadata.executionTime).toBeLessThan(10); // < 10ms
  });

  it('should handle large messages', async () => {
    const node = new ExampleNode();
    const context = createTestContext();

    const largeMessage = 'x'.repeat(10000);
    const result = await node.execute({
      message: largeMessage
    }, context);

    expect(result.success).toBe(true);
    expect(result.output.message).toBe(largeMessage);
  });
});

/**
 * 错误处理测试
 */
describe('ExampleNode - Error Handling', () => {
  it('should handle null input gracefully', async () => {
    const node = new ExampleNode();
    const context = createTestContext();

    const result = await node.execute(null, context);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle invalid input types', async () => {
    const node = new ExampleNode();
    const context = createTestContext();

    const result = await node.execute({
      message: 123 // should be string
    }, context);

    // Node should still process but may warn about type mismatch
    expect(result).toBeDefined();
  });
});

/**
 * 元数据测试
 */
describe('ExampleNode - Metadata', () => {
  it('should have correct metadata', () => {
    const node = new ExampleNode();
    const metadata = node.getMetadata();

    expect(metadata.id).toBe('example-node');
    expect(metadata.name).toBe('Example Node');
    expect(metadata.version).toBe('1.0.0');
    expect(metadata.category).toBe('core');
    expect(metadata.icon).toBe('🎯');
  });

  it('should have correct input definitions', () => {
    const node = new ExampleNode();
    const metadata = node.getMetadata();

    expect(metadata.inputs).toHaveLength(2);
    expect(metadata.inputs[0].name).toBe('message');
    expect(metadata.inputs[0].required).toBe(true);
  });

  it('should have correct output definitions', () => {
    const node = new ExampleNode();
    const metadata = node.getMetadata();

    expect(metadata.outputs).toHaveLength(2);
    expect(metadata.outputs[0].name).toBe('success');
    expect(metadata.outputs[1].name).toBe('error');
  });
});

/**
 * 运行所有测试
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running ExampleNode tests...');
  // Jest or other test runner will handle this
}
