# Pipeline v3 - API 文档

**版本**: 3.0.0  
**最后更新**: 2025-12-10

---

## 📚 目录

1. [概述](#概述)
2. [工作流 API](#工作流-api)
3. [执行 API](#执行-api)
4. [可视化 API](#可视化-api)
5. [系统 API](#系统-api)
6. [认证](#认证)
7. [错误处理](#错误处理)
8. [示例](#示例)

---

## 概述

Pipeline v3 提供了一套完整的 RESTful API，用于管理工作流、执行任务和查询系统状态。

### 基础 URL

```
https://chatbot-service-multi-tenant.pages.dev/api
```

### API 版本

当前版本：`v3.0.0`

所有 API 响应都包含版本信息：

```json
{
  "success": true,
  "data": {...},
  "metadata": {
    "timestamp": "2025-12-10T10:00:00.000Z",
    "version": "3.0.0"
  }
}
```

---

## 工作流 API

### 获取工作流列表

```http
GET /api/workflows
```

#### 响应

```json
{
  "success": true,
  "data": [
    {
      "id": "chatbot-main-workflow",
      "name": "Chatbot Main Workflow",
      "version": "1.0.0",
      "status": "active",
      "nodeCount": 9,
      "connectionCount": 12,
      "lastModified": "2025-12-10T10:00:00.000Z"
    }
  ],
  "metadata": {
    "timestamp": "2025-12-10T10:00:00.000Z",
    "version": "3.0.0"
  }
}
```

### 获取工作流详情

```http
GET /api/workflows/:workflowId
```

#### 参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| workflowId | string | 是 | 工作流 ID |

#### 响应

```json
{
  "success": true,
  "data": {
    "id": "chatbot-main-workflow",
    "name": "Chatbot Main Workflow",
    "version": "1.0.0",
    "nodes": [...],
    "connections": [...],
    "settings": {...}
  }
}
```

### 创建工作流

```http
POST /api/workflows
```

#### 请求体

```json
{
  "id": "new-workflow",
  "name": "New Workflow",
  "version": "1.0.0",
  "nodes": [
    {
      "id": "node1",
      "type": "example-node",
      "name": "Node 1",
      "position": { "x": 0, "y": 0 }
    }
  ],
  "connections": [],
  "settings": {
    "timeout": 30000
  }
}
```

#### 响应

```json
{
  "success": true,
  "data": {
    "id": "new-workflow",
    "name": "New Workflow",
    ...
  }
}
```

### 更新工作流

```http
PUT /api/workflows/:workflowId
```

#### 请求体

```json
{
  "name": "Updated Workflow Name",
  "settings": {
    "timeout": 60000
  }
}
```

### 删除工作流

```http
DELETE /api/workflows/:workflowId
```

#### 响应

```json
{
  "success": true,
  "metadata": {
    "timestamp": "2025-12-10T10:00:00.000Z"
  }
}
```

---

## 执行 API

### 执行工作流

```http
POST /api/workflows/:workflowId/execute
```

#### 请求体

```json
{
  "input": {
    "message": "Hello, world!"
  },
  "config": {
    "timeout": 30000,
    "traceExecution": true
  }
}
```

#### 响应

```json
{
  "success": true,
  "data": {
    "result": {...},
    "summary": {
      "workflowId": "chatbot-main-workflow",
      "status": "completed",
      "nodesExecuted": 9,
      "nodesFailed": 0,
      "totalExecutionTime": 2350
    },
    "sessionId": "session_123456"
  }
}
```

### 获取执行历史

```http
GET /api/executions?limit=50
```

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| limit | number | 50 | 返回的记录数 |

#### 响应

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "session_123456",
      "workflowId": "chatbot-main-workflow",
      "workflowName": "Chatbot Main Workflow",
      "startTime": "2025-12-10T10:00:00.000Z",
      "endTime": "2025-12-10T10:00:02.350Z",
      "status": "completed"
    }
  ]
}
```

### 获取执行详情

```http
GET /api/executions/:sessionId
```

#### 响应

```json
{
  "success": true,
  "data": {
    "sessionId": "session_123456",
    "workflowId": "chatbot-main-workflow",
    "startTime": "2025-12-10T10:00:00.000Z",
    "endTime": "2025-12-10T10:00:02.350Z",
    "status": "completed",
    "events": [...],
    "summary": {...}
  }
}
```

---

## 可视化 API

### 获取工作流可视化

```http
GET /api/workflows/:workflowId/visualization
```

#### 响应

```json
{
  "success": true,
  "data": "graph TD\n  node1[Node 1]\n  node2[Node 2]\n  node1 --> node2"
}
```

返回的是 Mermaid 格式的流程图代码。

---

## 系统 API

### 获取统计信息

```http
GET /api/stats
```

#### 响应

```json
{
  "success": true,
  "data": {
    "totalWorkflows": 12,
    "totalExecutions": 1247,
    "successfulExecutions": 1229,
    "failedExecutions": 18,
    "successRate": "98.56"
  }
}
```

### 健康检查

```http
GET /api/health
```

#### 响应

```json
{
  "success": true,
  "data": {
    "status": "healthy"
  }
}
```

---

## 认证

目前 API 处于开发阶段，暂不需要认证。

生产环境建议使用以下认证方式之一：

### API Key 认证

```http
GET /api/workflows
Authorization: Bearer YOUR_API_KEY
```

### JWT 认证

```http
GET /api/workflows
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "WORKFLOW_NOT_FOUND",
    "message": "Workflow not found: non-existent-workflow",
    "details": "..."
  },
  "metadata": {
    "timestamp": "2025-12-10T10:00:00.000Z",
    "version": "3.0.0"
  }
}
```

### 错误码

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| `WORKFLOW_NOT_FOUND` | 404 | 工作流不存在 |
| `WORKFLOW_EXISTS` | 409 | 工作流已存在 |
| `INVALID_WORKFLOW` | 400 | 工作流格式无效 |
| `EXECUTE_WORKFLOW_ERROR` | 500 | 工作流执行失败 |
| `SESSION_NOT_FOUND` | 404 | 执行会话不存在 |

---

## 示例

### 使用 cURL

```bash
# 获取工作流列表
curl https://chatbot-service-multi-tenant.pages.dev/api/workflows

# 执行工作流
curl -X POST \
  https://chatbot-service-multi-tenant.pages.dev/api/workflows/chatbot-main-workflow/execute \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "message": "Hello"
    },
    "config": {
      "traceExecution": true
    }
  }'
```

### 使用 JavaScript

```javascript
// 获取工作流列表
const response = await fetch('https://chatbot-service-multi-tenant.pages.dev/api/workflows');
const data = await response.json();

console.log(data.data); // 工作流列表

// 执行工作流
const execResponse = await fetch(
  'https://chatbot-service-multi-tenant.pages.dev/api/workflows/chatbot-main-workflow/execute',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { message: 'Hello' },
      config: { traceExecution: true },
    }),
  }
);

const execData = await execResponse.json();
console.log(execData.data.summary); // 执行摘要
```

### 使用 TypeScript

```typescript
import { WorkflowAPI } from './api/WorkflowAPI';

const api = new WorkflowAPI();

// 获取工作流列表
const listResponse = await api.listWorkflows();
if (listResponse.success) {
  console.log(listResponse.data);
}

// 执行工作流
const execResponse = await api.executeWorkflow({
  workflowId: 'chatbot-main-workflow',
  input: { message: 'Hello' },
  config: { traceExecution: true },
});

if (execResponse.success) {
  console.log(execResponse.data.summary);
}
```

---

## 速率限制

目前没有速率限制。

生产环境建议实施以下限制：

- **每 IP**: 100 请求/分钟
- **每 API Key**: 1000 请求/分钟

---

## 联系方式

如有问题或建议，请联系：

- **Email**: support@example.com
- **GitHub**: https://github.com/your-repo/issues

---

**文档版本**: 3.0.0  
**最后更新**: 2025-12-10
