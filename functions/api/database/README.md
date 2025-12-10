# Database Management

chatbot-service 的数据管理层，使用 Cloudflare D1 数据库。

---

## 📊 数据模型

### 1. 会话记录 (Conversations)

存储用户会话信息：
- 会话 ID、公司 ID
- 用户 ID（可选）
- 开始/结束时间
- 消息数量
- 状态（active/completed/abandoned）

### 2. 消息记录 (Messages)

存储所有对话消息：
- 消息 ID、会话 ID
- 角色（user/assistant/system）
- 内容
- 时间戳
- 意图、实体
- 响应时间

### 3. 用户记录 (Users)

存储用户信息：
- 用户 ID、公司 ID
- 首次/最近访问时间
- 会话数、消息数
- 偏好设置

### 4. 性能指标 (Performance Metrics)

存储工作流性能数据：
- 执行时间
- 节点指标
- 内存/CPU 使用

### 5. 工作流执行 (Workflow Executions)

存储工作流执行历史：
- 会话 ID、工作流 ID
- 开始/结束时间
- 状态、节点统计
- 错误信息

### 6. FAQ 查询 (FAQ Queries)

存储 FAQ 查询记录：
- 问题内容
- 匹配的 FAQ
- 置信度

### 7. 意图统计 (Intent Statistics)

存储意图统计数据：
- 意图名称
- 计数、成功率
- 平均响应时间

---

## 🚀 使用方法

### 初始化数据库

```typescript
import { DatabaseManager } from './database/database.js';

// 在 Cloudflare Workers 环境中
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = new DatabaseManager(env.DB);
    
    // 初始化数据库表（首次运行）
    await db.initialize();
    
    // ... 其他逻辑
  }
}
```

### 保存会话记录

```typescript
await db.saveConversation({
  id: 'conv_123',
  companyId: 'goldenyears',
  conversationId: 'conv_abc123',
  userId: 'user_456',
  startTime: new Date(),
  messageCount: 5,
  status: 'active',
});
```

### 保存消息

```typescript
await db.saveMessage({
  id: 'msg_789',
  conversationId: 'conv_abc123',
  role: 'user',
  content: '你好',
  timestamp: new Date(),
  intent: 'greeting',
  entities: {},
  responseTime: 250,
});
```

### 保存性能指标

```typescript
await db.savePerformanceMetric({
  id: 'perf_001',
  companyId: 'goldenyears',
  workflowId: 'chatbot-main-workflow',
  timestamp: new Date(),
  executionTime: 2350,
  nodeMetrics: [
    {
      nodeId: 'validate',
      executionTime: 35,
      status: 'success',
    },
    {
      nodeId: 'llm',
      executionTime: 2100,
      status: 'success',
    },
  ],
  memoryUsage: 25 * 1024 * 1024,
});
```

### 查询数据

```typescript
// 获取会话
const conversation = await db.getConversation('conv_abc123');

// 获取会话消息
const messages = await db.getConversationMessages('conv_abc123');

// 获取性能统计
const stats = await db.getPerformanceStats('goldenyears', 'chatbot-main-workflow', 7);

// 获取意图统计
const intentStats = await db.getIntentStats('goldenyears');
```

---

## 🔧 配置 Cloudflare D1

### 1. 创建 D1 数据库

```bash
# 创建数据库
npx wrangler d1 create chatbot-service-db

# 输出类似：
# ✅ Successfully created DB 'chatbot-service-db'
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "chatbot-service-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. 更新 wrangler.toml

```toml
[[d1_databases]]
binding = "DB"
database_name = "chatbot-service-db"
database_id = "YOUR_DATABASE_ID"
```

### 3. 初始化表结构

```bash
# 本地测试
npx wrangler d1 execute chatbot-service-db --local --file=./sql/init.sql

# 生产环境
npx wrangler d1 execute chatbot-service-db --file=./sql/init.sql
```

---

## 📊 数据分析示例

### 获取公司统计

```typescript
async function getCompanyStats(db: DatabaseManager, companyId: string) {
  // 总会话数
  const totalConversations = await db.db
    .prepare('SELECT COUNT(*) as count FROM conversations WHERE company_id = ?')
    .bind(companyId)
    .first();

  // 总消息数
  const totalMessages = await db.db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id IN (SELECT conversation_id FROM conversations WHERE company_id = ?)')
    .bind(companyId)
    .first();

  // 平均响应时间
  const avgResponseTime = await db.db
    .prepare('SELECT AVG(response_time) as avg FROM messages WHERE response_time IS NOT NULL AND conversation_id IN (SELECT conversation_id FROM conversations WHERE company_id = ?)')
    .bind(companyId)
    .first();

  return {
    totalConversations: totalConversations?.count || 0,
    totalMessages: totalMessages?.count || 0,
    avgResponseTime: avgResponseTime?.avg || 0,
  };
}
```

### 获取热门意图

```typescript
async function getTopIntents(db: DatabaseManager, companyId: string, limit: number = 10) {
  const results = await db.db
    .prepare(`
      SELECT intent, COUNT(*) as count
      FROM messages
      WHERE intent IS NOT NULL
        AND conversation_id IN (SELECT conversation_id FROM conversations WHERE company_id = ?)
      GROUP BY intent
      ORDER BY count DESC
      LIMIT ?
    `)
    .bind(companyId, limit)
    .all();

  return results.results;
}
```

---

## 🔒 数据隐私

- 所有用户数据存储在 Cloudflare D1 中
- 支持数据清理（90 天自动清理）
- 可配置数据保留策略
- 符合 GDPR 要求

---

## 🚨 注意事项

1. **D1 限制**:
   - 免费版: 5 GB 存储, 1M 读取/天
   - 付费版: 无限存储, 无限读取

2. **性能优化**:
   - 使用索引加速查询
   - 定期清理旧数据
   - 批量操作时使用事务

3. **数据备份**:
   - D1 自动备份
   - 可导出数据到 R2

---

## 📚 相关文档

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [D1 Best Practices](https://developers.cloudflare.com/d1/best-practices/)
- [chatbot-service Architecture](../MULTI_TENANT_ARCHITECTURE.md)
