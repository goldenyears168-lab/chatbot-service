/**
 * Pipeline v3 - 工作流集成测试
 * 
 * 测试完整的工作流执行
 */

import { WorkflowEngine } from '../WorkflowEngine.js';
import { NodeRegistry } from '../base/Node.js';
import { ExampleNode } from '../../nodes-v3/core/ExampleNode/index.js';

/**
 * 测试工作流定义
 */
const testWorkflow = {
  id: 'test-workflow',
  name: 'Test Workflow',
  version: '1.0.0',
  description: 'Test workflow for Pipeline v3',
  
  nodes: [
    {
      id: 'node-1',
      type: 'example-node',
      name: 'First Node',
      config: {
        prefix: 'Step1: '
      }
    },
    {
      id: 'node-2',
      type: 'example-node',
      name: 'Second Node',
      config: {
        toUpperCase: true,
        prefix: 'Step2: '
      }
    },
    {
      id: 'node-3',
      type: 'example-node',
      name: 'Third Node',
      config: {
        prefix: 'Step3: ',
        addTimestamp: true
      }
    }
  ],
  
  connections: [
    {
      from: 'node-1',
      fromOutput: 'success',
      to: 'node-2'
    },
    {
      from: 'node-2',
      fromOutput: 'success',
      to: 'node-3'
    }
  ],
  
  settings: {
    timeout: 30000,
    logging: {
      level: 'info',
      traceExecution: true
    }
  }
};

/**
 * 工作流引擎测试
 */
describe('WorkflowEngine - Integration Tests', () => {
  beforeAll(() => {
    // 注册节点类型
    NodeRegistry.register(ExampleNode);
  });

  afterAll(() => {
    // 清理注册表
    NodeRegistry.clear();
  });

  it('should create workflow engine', () => {
    const engine = new WorkflowEngine(testWorkflow as any);
    expect(engine).toBeDefined();
  });

  it('should execute simple workflow', async () => {
    const engine = new WorkflowEngine(testWorkflow as any);
    
    const result = await engine.execute({
      message: 'hello world'
    });

    expect(result).toBeDefined();
    expect(result.processed).toBe(true);
    expect(result.message).toContain('STEP2');
  });

  it('should track execution history', async () => {
    const engine = new WorkflowEngine(testWorkflow as any);
    
    await engine.execute({ message: 'test 1' });
    await engine.execute({ message: 'test 2' });
    
    const history = engine.getExecutionHistory();
    expect(history).toHaveLength(2);
  });

  it('should generate visualization', () => {
    const engine = new WorkflowEngine(testWorkflow as any);
    
    const diagram = engine.generateVisualization();
    expect(diagram).toContain('graph TD');
    expect(diagram).toContain('node-1');
    expect(diagram).toContain('node-2');
    expect(diagram).toContain('node-3');
  });
});

/**
 * 执行上下文测试
 */
describe('ExecutionContext - Integration Tests', () => {
  beforeAll(() => {
    NodeRegistry.register(ExampleNode);
  });

  it('should track execution trace', async () => {
    const engine = new WorkflowEngine(testWorkflow as any);
    
    await engine.execute({ message: 'test' });
    
    const history = engine.getExecutionHistory();
    const context = history[0];
    const summary = context.getSummary();
    
    expect(summary.nodesExecuted).toBeGreaterThan(0);
    expect(summary.trace).toBeDefined();
    expect(summary.trace.length).toBeGreaterThan(0);
  });

  it('should share data between nodes', async () => {
    const engine = new WorkflowEngine(testWorkflow as any);
    
    await engine.execute({ message: 'shared data test' });
    
    const history = engine.getExecutionHistory();
    const context = history[0];
    
    // ExampleNode 会设置 processCount
    expect(context.getData('processCount')).toBe(3); // 3 个节点
  });
});

/**
 * 错误处理测试
 */
describe('WorkflowEngine - Error Handling', () => {
  beforeAll(() => {
    NodeRegistry.register(ExampleNode);
  });

  it('should handle missing input', async () => {
    const engine = new WorkflowEngine(testWorkflow as any);
    
    // 应该在第一个节点失败（缺少 message）
    await expect(
      engine.execute({})
    ).rejects.toThrow();
  });

  it('should detect workflow cycles', () => {
    const cyclicWorkflow = {
      ...testWorkflow,
      connections: [
        ...testWorkflow.connections,
        {
          from: 'node-3',
          fromOutput: 'success',
          to: 'node-1' // 循环！
        }
      ]
    };

    expect(() => {
      new WorkflowEngine(cyclicWorkflow as any);
    }).toThrow(/cycle/i);
  });
});

/**
 * 性能测试
 */
describe('WorkflowEngine - Performance', () => {
  beforeAll(() => {
    NodeRegistry.register(ExampleNode);
  });

  it('should execute workflow quickly', async () => {
    const engine = new WorkflowEngine(testWorkflow as any);
    
    const startTime = Date.now();
    await engine.execute({ message: 'performance test' });
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(100); // < 100ms
  });

  it('should handle multiple executions', async () => {
    const engine = new WorkflowEngine(testWorkflow as any);
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        engine.execute({ message: `test ${i}` })
      );
    }
    
    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.processed).toBe(true);
    });
  });
});

/**
 * 运行测试
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Pipeline v3 integration tests...');
}
