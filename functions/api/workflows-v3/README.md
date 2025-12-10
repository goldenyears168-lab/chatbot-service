# Workflows v3

Pipeline v3 工作流定义文件目录。

---

## 📋 文件说明

### schema.json
工作流定义的 JSON Schema。用于验证工作流文件的正确性。

### test-simple.json
简单的 3 节点测试工作流。用于验证 Pipeline v3 的基本功能。

---

## 🎯 工作流文件规范

### 基本结构

```json
{
  "id": "workflow-id",
  "name": "Workflow Name",
  "version": "1.0.0",
  "description": "Workflow description",
  "nodes": [...],
  "connections": [...],
  "settings": {...},
  "metadata": {...}
}
```

### 必需字段

- `id`: 唯一标识符（小写字母、数字、连字符）
- `name`: 人类可读的名称
- `version`: 版本号（语义化版本）
- `nodes`: 节点列表（至少1个）
- `connections`: 连接列表

### 节点定义

```json
{
  "id": "node-1",
  "type": "node-type",
  "name": "Node Name",
  "position": { "x": 100, "y": 100 },
  "config": {
    // 节点特定配置
  }
}
```

### 连接定义

```json
{
  "from": "node-1",
  "fromOutput": "success",
  "to": "node-2",
  "toInput": "input"
}
```

---

## 🚀 使用工作流

### 加载工作流

```typescript
import { WorkflowEngine } from '../pipeline-v3/WorkflowEngine.js';
import workflowDef from './test-simple.json';

const engine = new WorkflowEngine(workflowDef);
```

### 执行工作流

```typescript
const result = await engine.execute({
  message: "Hello, World!"
});

console.log(result);
```

---

## 📝 创建新工作流

1. **复制模板**
   ```bash
   cp test-simple.json my-workflow.json
   ```

2. **编辑工作流**
   - 修改 `id`, `name`, `version`
   - 定义节点
   - 定义连接
   - 配置设置

3. **验证工作流**
   ```bash
   # 使用 JSON Schema 验证
   ajv validate -s schema.json -d my-workflow.json
   ```

4. **测试工作流**
   ```typescript
   import myWorkflow from './my-workflow.json';
   
   const engine = new WorkflowEngine(myWorkflow);
   const result = await engine.execute(testInput);
   ```

---

## 🎨 最佳实践

### 命名规范

- **工作流 ID**: `{purpose}-{type}-workflow`
  - 例如: `chatbot-main-workflow`, `admin-report-workflow`

- **节点 ID**: `{function}-node-{number}`
  - 例如: `validate-node-1`, `llm-node-1`

### 节点组织

- 从左到右排列节点
- 使用合理的间距（100-200 像素）
- 相关节点垂直对齐

### 错误处理

- 为关键节点添加错误输出连接
- 使用专门的错误处理节点
- 配置合理的重试策略

---

## 📚 示例工作流

### 1. test-simple.json
简单的 3 节点流程：输入验证 → 处理 → 输出

**用途**: 测试基本功能

### 2. chatbot-main-workflow.json (待创建)
完整的聊天机器人流程

**节点**:
- 请求验证
- 服务初始化
- 上下文管理
- 意图提取
- 状态转换
- 特殊意图处理
- FAQ 检查
- LLM 生成
- 响应构建

---

## 🔧 配置选项

### timeout
工作流超时时间（毫秒）
- 最小: 1000ms (1秒)
- 最大: 600000ms (10分钟)
- 默认: 30000ms (30秒)

### retryPolicy
重试策略
- `maxRetries`: 最大重试次数 (0-10)
- `backoff`: 退避策略 ('linear' | 'exponential')
- `initialDelay`: 初始延迟（毫秒）

### logging
日志配置
- `level`: 日志级别 ('debug' | 'info' | 'warn' | 'error')
- `traceExecution`: 是否追踪执行 (true | false)

### concurrency
并发配置
- `maxParallel`: 最大并行节点数 (≥1)

---

## 📊 工作流验证

### 必需验证

- [x] 所有节点 ID 唯一
- [x] 所有连接引用的节点存在
- [x] 无循环依赖
- [x] 至少有一个入口节点（无输入连接）

### 推荐验证

- [ ] 所有节点都可达
- [ ] 没有孤立节点
- [ ] 错误路径完整
- [ ] 合理的超时配置

---

## 📖 相关文档

- **Pipeline v3 README**: `../pipeline-v3/README.md`
- **JSON Schema**: `schema.json`
- **实施计划**: `/PIPELINE_IMPLEMENTATION_PLAN.md`

---

**最后更新**: 2025-12-10  
**版本**: 3.0.0
