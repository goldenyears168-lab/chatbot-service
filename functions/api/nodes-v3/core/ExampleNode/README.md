# Example Node

一个简单的示例节点，用于演示 Pipeline v3 的核心功能。

---

## 📋 基本信息

- **ID**: `example-node`
- **版本**: 1.0.0
- **分类**: core
- **图标**: 🎯

---

## 📥 输入

### message (必需)
- **类型**: `string`
- **描述**: 要处理的输入消息

### options (可选)
- **类型**: `object`
- **描述**: 可选的处理选项
- **默认**: `{}`

---

## 📤 输出

### success
- **类型**: `object`
- **描述**: 处理成功的结果
- **格式**:
  ```typescript
  {
    message: string;      // 处理后的消息
    processed: boolean;   // 始终为 true
    timestamp?: number;   // 时间戳（如果启用）
    options?: object;     // 用户选项（如果提供）
  }
  ```

### error
- **类型**: `Error`
- **描述**: 处理失败时的错误信息

---

## ⚙️ 配置

### toUpperCase
- **类型**: `boolean`
- **默认**: `false`
- **描述**: 是否将消息转换为大写

### addTimestamp
- **类型**: `boolean`
- **默认**: `true`
- **描述**: 是否在输出中添加时间戳

### prefix
- **类型**: `string`
- **默认**: `""`
- **描述**: 在消息前添加的前缀

---

## 🎯 使用示例

### 基本用法

```typescript
import { ExampleNode } from './index.js';
import { ExecutionContext } from '../../../pipeline-v3/ExecutionContext.js';

// 创建节点实例
const node = new ExampleNode();

// 创建执行上下文
const context = new ExecutionContext('test-exec', workflow);

// 执行节点
const result = await node.execute({
  message: 'Hello, World!'
}, context);

console.log(result.output);
// { message: 'Hello, World!', processed: true, timestamp: 1234567890 }
```

### 自定义配置

```typescript
// 转换为大写并添加前缀
const node = new ExampleNode({
  toUpperCase: true,
  addTimestamp: false,
  prefix: '[PROCESSED] '
});

const result = await node.execute({
  message: 'hello world'
}, context);

console.log(result.output);
// { message: '[PROCESSED] HELLO WORLD', processed: true }
```

### 在工作流中使用

```json
{
  "nodes": [
    {
      "id": "process-node",
      "type": "example-node",
      "name": "Process Message",
      "config": {
        "toUpperCase": true,
        "addTimestamp": true,
        "prefix": "Processed: "
      }
    }
  ]
}
```

---

## 🔍 功能演示

### 1. 输入验证
节点会自动验证输入是否符合 metadata.json 中的定义。

### 2. 数据处理
根据配置对消息进行处理（大写、前缀等）。

### 3. 上下文共享
演示如何使用 ExecutionContext 在节点间共享数据：
- `lastProcessedMessage`: 最后处理的消息
- `processCount`: 处理计数

### 4. 错误处理
优雅地处理和返回错误。

---

## 📊 性能

- **平均执行时间**: < 1ms
- **内存占用**: 最小
- **适合场景**: 测试、演示、轻量级文本处理

---

## 🧪 测试

```typescript
import { ExampleNode } from './index.js';

describe('ExampleNode', () => {
  it('should process message correctly', async () => {
    const node = new ExampleNode();
    const context = new ExecutionContext('test', {} as any);
    
    const result = await node.execute({
      message: 'test'
    }, context);
    
    expect(result.success).toBe(true);
    expect(result.output.message).toBe('test');
    expect(result.output.processed).toBe(true);
  });

  it('should convert to uppercase when configured', async () => {
    const node = new ExampleNode({ toUpperCase: true });
    const context = new ExecutionContext('test', {} as any);
    
    const result = await node.execute({
      message: 'hello'
    }, context);
    
    expect(result.output.message).toBe('HELLO');
  });
});
```

---

## 📝 注意事项

1. 这是一个**示例节点**，主要用于学习和测试
2. 生产环境建议使用更复杂和健壮的节点
3. 可以作为创建自定义节点的模板

---

## 🔗 相关资源

- [Pipeline v3 文档](../../../pipeline-v3/README.md)
- [创建自定义节点](../../../pipeline-v3/README.md#添加新节点)
- [节点基类 API](../../../pipeline-v3/base/Node.ts)

---

**创建日期**: 2025-12-10  
**最后更新**: 2025-12-10  
**作者**: Pipeline Team
