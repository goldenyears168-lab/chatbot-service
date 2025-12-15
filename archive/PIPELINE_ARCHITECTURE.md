# 🔄 Pipeline 架构改造方案（N8N 风格）

**设计者**: 资深工程师  
**参考**: N8N Workflow System  
**目标**: 清晰的流程节点与可视化管理

---

## 🎯 改造目标

### 现状问题

```
当前 Pipeline:
- 节点分散在 nodes/ 目录
- 依赖关系不清晰
- 难以调试和追踪
- 缺少可视化界面
- 无法灵活组合节点
```

### 目标状态（N8N 风格）

```
理想 Pipeline:
✅ 清晰的节点定义和元数据
✅ 可视化流程图
✅ 节点执行追踪和日志
✅ 灵活的节点组合
✅ 实时状态监控
✅ 错误处理和重试
```

---

## 🏗️ 架构设计

### N8N 核心概念

```
Workflow (工作流)
  ├── Nodes (节点)
  │   ├── Input Node (输入)
  │   ├── Processing Nodes (处理)
  │   └── Output Node (输出)
  │
  ├── Connections (连接)
  │   ├── Success Path (成功路径)
  │   └── Error Path (错误路径)
  │
  └── Execution (执行)
      ├── Context (上下文)
      ├── Data Flow (数据流)
      └── State Management (状态管理)
```

---

## 📁 新的目录结构

```
functions/api/
├── workflows/                    # 工作流定义
│   ├── chatbot-workflow.json    # 聊天机器人工作流
│   ├── faq-workflow.json        # FAQ 工作流
│   └── admin-workflow.json      # 管理工作流
│
├── nodes/                        # 节点定义（重构）
│   ├── core/                     # 核心节点
│   │   ├── InputNode/
│   │   │   ├── index.ts
│   │   │   ├── metadata.json
│   │   │   └── README.md
│   │   │
│   │   ├── ValidateNode/
│   │   ├── LLMNode/
│   │   └── OutputNode/
│   │
│   ├── custom/                   # 自定义节点
│   │   ├── IntentExtractionNode/
│   │   ├── FAQCheckNode/
│   │   └── StateTransitionNode/
│   │
│   └── base/                     # 基础类
│       ├── Node.ts               # 节点基类
│       ├── NodeExecutor.ts       # 执行器
│       └── NodeMetadata.ts       # 元数据定义
│
├── pipeline/                     # Pipeline 引擎
│   ├── WorkflowEngine.ts         # 工作流引擎
│   ├── ExecutionContext.ts       # 执行上下文
│   ├── DataFlowManager.ts        # 数据流管理
│   └── StateManager.ts           # 状态管理
│
├── visualization/                # 可视化
│   ├── FlowDiagram.ts            # 流程图生成
│   ├── ExecutionTracer.ts        # 执行追踪
│   └── templates/                # 可视化模板
│       ├── workflow-view.html
│       └── execution-log.html
│
└── [company]/                    # API 端点（保持不变）
    ├── chat.ts
    └── faq-menu.ts
```

---

## 🎨 节点设计规范

### 节点元数据

每个节点都有清晰的元数据定义：

```typescript
// nodes/core/ValidateNode/metadata.json
{
  "id": "validate-request",
  "name": "Validate Request",
  "version": "1.0.0",
  "category": "core",
  "description": "验证请求参数和权限",
  "icon": "🔍",
  "color": "#4CAF50",
  
  "inputs": [
    {
      "name": "request",
      "type": "Request",
      "required": true,
      "description": "HTTP 请求对象"
    }
  ],
  
  "outputs": [
    {
      "name": "success",
      "type": "ValidatedRequest",
      "description": "验证成功的请求"
    },
    {
      "name": "error",
      "type": "Error",
      "description": "验证失败的错误"
    }
  ],
  
  "config": {
    "maxMessageLength": 1000,
    "allowedMethods": ["POST"],
    "requireAuth": false
  }
}
```

### 节点基类

```typescript
// nodes/base/Node.ts

export interface NodeMetadata {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  config?: Record<string, any>;
}

export interface NodeInput {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface NodeOutput {
  name: string;
  type: string;
  description: string;
}

export interface NodeExecutionResult {
  success: boolean;
  output: any;
  outputName: string;  // 'success' or 'error'
  metadata: {
    executionTime: number;
    timestamp: string;
    nodeId: string;
  };
}

export abstract class BaseNode {
  protected metadata: NodeMetadata;
  protected config: Record<string, any>;
  
  constructor(metadata: NodeMetadata, config?: Record<string, any>) {
    this.metadata = metadata;
    this.config = { ...metadata.config, ...config };
  }
  
  /**
   * 执行节点逻辑
   */
  abstract async execute(
    input: any,
    context: ExecutionContext
  ): Promise<NodeExecutionResult>;
  
  /**
   * 验证输入
   */
  protected validateInput(input: any): boolean {
    // 验证逻辑
    return true;
  }
  
  /**
   * 获取元数据
   */
  getMetadata(): NodeMetadata {
    return this.metadata;
  }
  
  /**
   * 获取配置
   */
  getConfig(): Record<string, any> {
    return this.config;
  }
}
```

### 节点实现示例

```typescript
// nodes/core/ValidateNode/index.ts

import { BaseNode, NodeExecutionResult } from '../../base/Node.js';
import { ExecutionContext } from '../../../pipeline/ExecutionContext.js';
import metadata from './metadata.json';

export class ValidateNode extends BaseNode {
  constructor(config?: Record<string, any>) {
    super(metadata, config);
  }
  
  async execute(input: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 验证逻辑
      const { request } = input;
      
      if (!request) {
        return {
          success: false,
          output: { error: 'Request is required' },
          outputName: 'error',
          metadata: {
            executionTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            nodeId: this.metadata.id,
          }
        };
      }
      
      // 验证成功
      return {
        success: true,
        output: {
          validatedRequest: request,
          // ... 其他验证结果
        },
        outputName: 'success',
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          nodeId: this.metadata.id,
        }
      };
      
    } catch (error) {
      return {
        success: false,
        output: { error },
        outputName: 'error',
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          nodeId: this.metadata.id,
        }
      };
    }
  }
}
```

---

## 🔄 工作流定义

### 工作流 JSON

```json
// workflows/chatbot-workflow.json
{
  "id": "chatbot-main-flow",
  "name": "Chatbot Main Workflow",
  "version": "1.0.0",
  "description": "主聊天机器人工作流",
  
  "nodes": [
    {
      "id": "node-1",
      "type": "validate-request",
      "name": "验证请求",
      "position": { "x": 100, "y": 100 },
      "config": {
        "maxMessageLength": 1000
      }
    },
    {
      "id": "node-2",
      "type": "initialize-services",
      "name": "初始化服务",
      "position": { "x": 300, "y": 100 }
    },
    {
      "id": "node-3",
      "type": "context-management",
      "name": "上下文管理",
      "position": { "x": 500, "y": 100 }
    },
    {
      "id": "node-4",
      "type": "intent-extraction",
      "name": "意图提取",
      "position": { "x": 700, "y": 100 }
    },
    {
      "id": "node-5",
      "type": "faq-check",
      "name": "FAQ 检查",
      "position": { "x": 900, "y": 100 }
    },
    {
      "id": "node-6",
      "type": "llm-generation",
      "name": "LLM 生成",
      "position": { "x": 900, "y": 300 }
    },
    {
      "id": "node-7",
      "type": "build-response",
      "name": "构建响应",
      "position": { "x": 1100, "y": 200 }
    }
  ],
  
  "connections": [
    {
      "from": "node-1",
      "fromOutput": "success",
      "to": "node-2",
      "toInput": "request"
    },
    {
      "from": "node-1",
      "fromOutput": "error",
      "to": "node-7",
      "toInput": "error"
    },
    {
      "from": "node-2",
      "fromOutput": "success",
      "to": "node-3"
    },
    {
      "from": "node-3",
      "fromOutput": "success",
      "to": "node-4"
    },
    {
      "from": "node-4",
      "fromOutput": "success",
      "to": "node-5"
    },
    {
      "from": "node-5",
      "fromOutput": "faq-found",
      "to": "node-7"
    },
    {
      "from": "node-5",
      "fromOutput": "faq-not-found",
      "to": "node-6"
    },
    {
      "from": "node-6",
      "fromOutput": "success",
      "to": "node-7"
    }
  ],
  
  "settings": {
    "timeout": 30000,
    "retryPolicy": {
      "maxRetries": 3,
      "backoff": "exponential"
    },
    "logging": {
      "level": "info",
      "traceExecution": true
    }
  }
}
```

---

## 🎮 工作流引擎

```typescript
// pipeline/WorkflowEngine.ts

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  nodes: NodeDefinition[];
  connections: ConnectionDefinition[];
  settings: WorkflowSettings;
}

export class WorkflowEngine {
  private workflow: WorkflowDefinition;
  private nodes: Map<string, BaseNode>;
  private executionHistory: ExecutionRecord[];
  
  constructor(workflow: WorkflowDefinition) {
    this.workflow = workflow;
    this.nodes = new Map();
    this.executionHistory = [];
    this.initializeNodes();
  }
  
  /**
   * 初始化所有节点
   */
  private initializeNodes(): void {
    this.workflow.nodes.forEach(nodeDef => {
      const NodeClass = this.loadNodeClass(nodeDef.type);
      const node = new NodeClass(nodeDef.config);
      this.nodes.set(nodeDef.id, node);
    });
  }
  
  /**
   * 执行工作流
   */
  async execute(initialInput: any): Promise<any> {
    const executionId = this.generateExecutionId();
    const context = new ExecutionContext(executionId, this.workflow);
    
    console.log(`[Workflow] Starting execution: ${executionId}`);
    
    try {
      // 找到入口节点（没有输入连接的节点）
      const entryNode = this.findEntryNode();
      
      // 从入口节点开始执行
      const result = await this.executeNode(
        entryNode,
        initialInput,
        context
      );
      
      console.log(`[Workflow] Execution completed: ${executionId}`);
      return result;
      
    } catch (error) {
      console.error(`[Workflow] Execution failed: ${executionId}`, error);
      throw error;
    }
  }
  
  /**
   * 执行单个节点
   */
  private async executeNode(
    nodeId: string,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    
    // 记录开始执行
    context.recordNodeStart(nodeId);
    
    try {
      // 执行节点
      const result = await node.execute(input, context);
      
      // 记录执行结果
      context.recordNodeComplete(nodeId, result);
      
      // 如果成功，找到下一个节点
      if (result.success) {
        const nextNode = this.findNextNode(nodeId, result.outputName);
        if (nextNode) {
          return await this.executeNode(nextNode, result.output, context);
        } else {
          // 没有下一个节点，返回结果
          return result.output;
        }
      } else {
        // 失败，找错误处理节点
        const errorNode = this.findErrorHandler(nodeId);
        if (errorNode) {
          return await this.executeNode(errorNode, result.output, context);
        } else {
          throw new Error(`Node execution failed: ${nodeId}`);
        }
      }
      
    } catch (error) {
      context.recordNodeError(nodeId, error);
      throw error;
    }
  }
  
  /**
   * 找到入口节点
   */
  private findEntryNode(): string {
    // 找到没有输入连接的节点
    const nodesWithInput = new Set(
      this.workflow.connections.map(c => c.to)
    );
    
    const entryNode = this.workflow.nodes.find(
      node => !nodesWithInput.has(node.id)
    );
    
    if (!entryNode) {
      throw new Error('No entry node found in workflow');
    }
    
    return entryNode.id;
  }
  
  /**
   * 找到下一个节点
   */
  private findNextNode(nodeId: string, outputName: string): string | null {
    const connection = this.workflow.connections.find(
      c => c.from === nodeId && c.fromOutput === outputName
    );
    
    return connection ? connection.to : null;
  }
  
  /**
   * 可视化工作流
   */
  generateVisualization(): string {
    // 生成 Mermaid 或其他格式的流程图
    return this.generateMermaidDiagram();
  }
  
  /**
   * 生成 Mermaid 流程图
   */
  private generateMermaidDiagram(): string {
    let diagram = 'graph TD\n';
    
    // 添加节点
    this.workflow.nodes.forEach(node => {
      diagram += `  ${node.id}["${node.name}"]\n`;
    });
    
    // 添加连接
    this.workflow.connections.forEach(conn => {
      diagram += `  ${conn.from} -->|${conn.fromOutput}| ${conn.to}\n`;
    });
    
    return diagram;
  }
}
```

---

## 📊 执行上下文

```typescript
// pipeline/ExecutionContext.ts

export class ExecutionContext {
  public executionId: string;
  public workflow: WorkflowDefinition;
  public startTime: number;
  public data: Map<string, any>;  // 节点间共享数据
  public executionTrace: ExecutionRecord[];
  
  constructor(executionId: string, workflow: WorkflowDefinition) {
    this.executionId = executionId;
    this.workflow = workflow;
    this.startTime = Date.now();
    this.data = new Map();
    this.executionTrace = [];
  }
  
  /**
   * 设置共享数据
   */
  setData(key: string, value: any): void {
    this.data.set(key, value);
  }
  
  /**
   * 获取共享数据
   */
  getData(key: string): any {
    return this.data.get(key);
  }
  
  /**
   * 记录节点开始执行
   */
  recordNodeStart(nodeId: string): void {
    this.executionTrace.push({
      nodeId,
      status: 'started',
      timestamp: Date.now(),
    });
  }
  
  /**
   * 记录节点完成
   */
  recordNodeComplete(nodeId: string, result: NodeExecutionResult): void {
    this.executionTrace.push({
      nodeId,
      status: 'completed',
      timestamp: Date.now(),
      result,
    });
  }
  
  /**
   * 记录节点错误
   */
  recordNodeError(nodeId: string, error: any): void {
    this.executionTrace.push({
      nodeId,
      status: 'error',
      timestamp: Date.now(),
      error,
    });
  }
  
  /**
   * 获取执行摘要
   */
  getSummary(): ExecutionSummary {
    return {
      executionId: this.executionId,
      workflowId: this.workflow.id,
      startTime: this.startTime,
      endTime: Date.now(),
      duration: Date.now() - this.startTime,
      nodesExecuted: this.executionTrace.length,
      trace: this.executionTrace,
    };
  }
}
```

---

## 🎨 可视化界面

### 流程图 HTML

```html
<!-- visualization/templates/workflow-view.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Workflow Visualization</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        .workflow-header {
            margin-bottom: 30px;
        }
        .mermaid {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
        }
        .node-info {
            margin-top: 30px;
        }
        .node-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="workflow-header">
        <h1>{{ workflow.name }}</h1>
        <p>{{ workflow.description }}</p>
    </div>
    
    <div class="mermaid">
        {{ mermaidDiagram }}
    </div>
    
    <div class="node-info">
        <h2>节点详情</h2>
        {% for node in workflow.nodes %}
        <div class="node-card">
            <h3>{{ node.icon }} {{ node.name }}</h3>
            <p>{{ node.description }}</p>
            <p><strong>类型:</strong> {{ node.type }}</p>
            <p><strong>位置:</strong> {{ node.position }}</p>
        </div>
        {% endfor %}
    </div>
    
    <script>
        mermaid.initialize({ startOnLoad: true });
    </script>
</body>
</html>
```

---

## 🚀 实施计划

### Phase 1: 基础架构（Week 1）

- [ ] 创建节点基类和元数据定义
- [ ] 实现工作流引擎核心
- [ ] 创建执行上下文管理
- [ ] 设置新的目录结构

### Phase 2: 节点迁移（Week 2）

- [ ] 将现有节点迁移到新架构
- [ ] 添加节点元数据
- [ ] 实现节点执行追踪
- [ ] 编写节点文档

### Phase 3: 可视化（Week 3）

- [ ] 实现流程图生成
- [ ] 创建可视化界面
- [ ] 添加执行日志查看
- [ ] 实时状态监控

### Phase 4: 测试和优化（Week 4）

- [ ] 完整测试新架构
- [ ] 性能优化
- [ ] 文档完善
- [ ] 部署到生产环境

---

## 📈 预期收益

### 开发效率

| 指标 | 之前 | 之后 | 提升 |
|------|------|------|------|
| 添加新节点 | 2 小时 | 30 分钟 | 75% ⬆️ |
| 调试问题 | 1 小时 | 15 分钟 | 85% ⬆️ |
| 理解流程 | 30 分钟 | 5 分钟 | 83% ⬆️ |
| 修改流程 | 1 小时 | 10 分钟 | 91% ⬆️ |

### 代码质量

- ✅ 更清晰的代码组织
- ✅ 更好的可测试性
- ✅ 更容易维护
- ✅ 更灵活的扩展

### 可观测性

- ✅ 实时流程可视化
- ✅ 详细的执行日志
- ✅ 节点性能监控
- ✅ 错误追踪和诊断

---

## 📚 参考资源

- **N8N Documentation**: https://docs.n8n.io/
- **Temporal Workflow**: https://docs.temporal.io/
- **Apache Airflow**: https://airflow.apache.org/

---

**设计完成**: 2025-12-10  
**预计实施**: 4 周  
**优先级**: High  
**状态**: 📋 待实施
