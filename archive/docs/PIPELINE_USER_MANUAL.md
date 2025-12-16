# Pipeline v3 - 用户手册

**版本**: 3.0.0  
**最后更新**: 2025-12-10

欢迎使用 Pipeline v3！本手册将帮助您快速上手并充分利用 Pipeline v3 的强大功能。

---

## 🚀 快速开始

### 1. 访问管理控制台

打开浏览器，访问：

```
https://chatbot-service-multi-tenant.pages.dev/admin/pipeline/dashboard.html
```

您将看到管理控制台，包含：
- 📊 关键指标概览
- 📈 执行趋势图表
- 📋 工作流列表
- ⏰ 最近活动

### 2. 查看工作流

点击左侧导航栏的"工作流"，或访问：

```
https://chatbot-service-multi-tenant.pages.dev/admin/pipeline/workflow-viewer.html
```

您可以：
- 查看所有工作流列表
- 查看流程图可视化
- 导出 SVG/PNG 图片
- 查看 JSON 配置

### 3. 查看执行日志

点击左侧导航栏的"执行日志"，或访问：

```
https://chatbot-service-multi-tenant.pages.dev/admin/pipeline/execution-log.html
```

您可以：
- 查看所有执行会话
- 过滤事件类型
- 查看执行详情
- 导出执行报告

---

## 📋 核心功能

### 工作流管理

#### 查看工作流列表

1. 打开工作流查看器
2. 左侧显示所有工作流
3. 点击工作流名称查看详情

#### 查看流程图

1. 选择一个工作流
2. 主视图显示 Mermaid 流程图
3. 不同颜色表示不同类型的节点：
   - 🔵 蓝色：验证节点
   - 🟠 橙色：处理节点
   - 🟣 紫色：决策节点
   - 🟢 绿色：输出节点

#### 导出流程图

1. 点击"导出 SVG"或"导出 PNG"按钮
2. 选择保存位置
3. 文件将自动下载

### 执行追踪

#### 查看执行会话

1. 打开执行日志页面
2. 左侧显示所有会话
3. 会话按状态分类：
   - ✅ 已完成
   - ❌ 失败
   - 🔄 运行中

#### 过滤事件

使用顶部的过滤按钮：
- **全部**：显示所有事件
- **工作流**：只显示工作流事件
- **节点**：只显示节点事件
- **错误**：只显示错误
- **数据流**：只显示数据传递

#### 导出执行报告

1. 选择一个会话
2. 点击"导出报告"按钮
3. 选择格式（JSON 或 HTML）

### 实时监控

#### 查看统计数据

管理控制台显示：
- 📊 工作流总数
- ✅ 总执行次数
- 📈 成功率
- ⚡ 平均响应时间

#### 查看趋势图表

执行趋势图表显示：
- 最近 7 天的执行次数
- 成功/失败对比
- 趋势分析

---

## 🎯 常见操作

### 创建新工作流

**方法 1: 使用 JSON**

1. 创建 JSON 文件
2. 定义节点和连接
3. 使用 API 上传

```json
{
  "id": "my-workflow",
  "name": "My Workflow",
  "version": "1.0.0",
  "nodes": [
    {
      "id": "node1",
      "type": "validate-request",
      "name": "Validate",
      "position": { "x": 0, "y": 0 }
    }
  ],
  "connections": [],
  "settings": {
    "timeout": 30000
  }
}
```

**方法 2: 使用 API**

```javascript
const api = new WorkflowAPI();
const response = await api.createWorkflow(workflowDefinition);
```

### 执行工作流

**方法 1: 使用管理界面**

1. 打开工作流查看器
2. 选择工作流
3. 点击"执行"按钮（如果可用）

**方法 2: 使用 API**

```javascript
const api = new WorkflowAPI();
const response = await api.executeWorkflow({
  workflowId: 'chatbot-main-workflow',
  input: { message: 'Hello' },
  config: { traceExecution: true }
});
```

### 分析性能

1. 打开执行日志
2. 选择一个会话
3. 查看统计数据：
   - 总耗时
   - 平均节点耗时
   - 错误数

4. 识别瓶颈：
   - 查找执行时间最长的节点
   - 检查错误率高的节点

---

## 📚 高级功能

### 自定义节点

创建自定义节点：

1. 继承 `BaseNode` 类
2. 实现 `execute` 方法
3. 定义 `metadata.json`
4. 注册节点

```typescript
import { BaseNode } from '../base/Node.js';

export class MyCustomNode extends BaseNode {
  async execute(input, context) {
    // 您的逻辑
    return this.createSuccessResult(output);
  }
}

// 注册
NodeRegistry.register(MyCustomNode);
```

### 工作流调试

启用详细日志：

```typescript
const engine = new WorkflowEngine();
engine.loadWorkflow(workflow);

// 启用追踪
const tracer = new ExecutionTracer({
  logLevel: 'verbose',
  captureData: true,
});

const sessionId = tracer.startSession(workflowId, workflowName);
// 执行工作流
```

### 性能优化

查看性能建议：

```typescript
const optimizer = new PerformanceOptimizer();
optimizer.recordMetrics(workflowId, metrics);

const suggestions = optimizer.analyzePerformance(workflowId);
console.log(suggestions);
```

---

## ❓ 常见问题

### Q: 如何查看工作流的详细执行记录？

**A**: 
1. 打开执行日志页面
2. 在左侧会话列表中选择对应的会话
3. 主视图会显示所有事件的时间线

### Q: 流程图无法显示怎么办？

**A**: 
1. 检查浏览器控制台是否有错误
2. 确认工作流 JSON 格式正确
3. 刷新页面重试
4. 如果问题持续，导出 JSON 检查语法

### Q: 如何提高工作流执行速度？

**A**: 
1. 使用性能分析工具识别慢节点
2. 考虑添加缓存
3. 优化 LLM 调用
4. 使用批处理
5. 参考性能优化建议

### Q: 支持并行执行吗？

**A**: 
目前不支持节点级别的并行执行，但可以同时执行多个工作流实例。

### Q: 如何导出整个工作流？

**A**: 
1. 打开工作流查看器
2. 切换到"JSON 数据"标签
3. 复制 JSON 内容
4. 或使用 API: `GET /api/workflows/:workflowId`

---

## 💡 最佳实践

### 1. 命名规范

- **工作流 ID**: 使用 kebab-case（如：`user-registration-flow`）
- **节点 ID**: 使用描述性名称（如：`validate-email`）
- **节点名称**: 使用中文描述（如：`验证邮箱`）

### 2. 错误处理

- 在每个节点添加错误处理逻辑
- 使用 try-catch 包裹关键代码
- 记录详细的错误信息

### 3. 性能考虑

- 避免在节点间传递大对象
- 使用缓存减少重复计算
- 设置合理的超时时间

### 4. 可维护性

- 添加详细的节点描述
- 使用有意义的变量名
- 定期清理不用的工作流

---

## 🔗 相关资源

- **API 文档**: [PIPELINE_API_DOCUMENTATION.md](./PIPELINE_API_DOCUMENTATION.md)
- **迁移指南**: [PIPELINE_MIGRATION_GUIDE.md](./PIPELINE_MIGRATION_GUIDE.md)
- **架构文档**: [PIPELINE_ARCHITECTURE.md](./PIPELINE_ARCHITECTURE.md)

---

## 📞 获取帮助

如有问题，请：

1. 查看文档
2. 搜索常见问题
3. 联系技术支持

---

**文档版本**: 3.0.0  
**最后更新**: 2025-12-10
