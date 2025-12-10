# Task Scheduler

chatbot-service 的任务调度系统，使用 Cloudflare Cron Triggers。

---

## 📅 已注册的定时任务

### 1. 清理旧数据
- **ID**: `cleanup-old-data`
- **描述**: 删除 90 天前的历史数据
- **调度**: `0 2 * * *` (每天凌晨 2 点)
- **用途**: 保持数据库整洁，释放存储空间

### 2. 生成小时统计
- **ID**: `generate-hourly-stats`
- **描述**: 生成每小时的统计数据
- **调度**: `0 * * * *` (每小时整点)
- **用途**: 实时监控系统性能

### 3. 生成周报
- **ID**: `generate-weekly-report`
- **描述**: 生成每周详细报告
- **调度**: `0 9 * * 1` (每周一上午 9 点)
- **用途**: 周度数据分析和报告

### 4. 优化数据库
- **ID**: `optimize-database`
- **描述**: 运行数据库维护
- **调度**: `0 3 * * *` (每天凌晨 3 点)
- **用途**: 保持数据库性能

### 5. 更新意图统计
- **ID**: `update-intent-statistics`
- **描述**: 更新意图统计数据
- **调度**: `*/5 * * * *` (每 5 分钟)
- **用途**: 实时意图分析

---

## 🚀 使用方法

### 1. 配置 Cloudflare Cron Triggers

在 `wrangler.toml` 中添加：

```toml
[triggers]
crons = [
  "0 2 * * *",    # cleanup-old-data
  "0 * * * *",    # generate-hourly-stats
  "0 9 * * 1",    # generate-weekly-report
  "0 3 * * *",    # optimize-database
  "*/5 * * * *"   # update-intent-statistics
]
```

### 2. 在代码中使用

```typescript
import { scheduler } from './scheduler/TaskScheduler.js';

// 获取所有任务
const tasks = scheduler.getTasks();

// 执行特定任务
await scheduler.executeTask('cleanup-old-data', env);

// 启用/禁用任务
scheduler.disableTask('generate-weekly-report');
scheduler.enableTask('generate-weekly-report');

// 获取状态报告
const status = scheduler.getStatusReport();
```

### 3. 手动触发任务

```bash
# 通过 API 手动触发
curl https://chatbot-service-9qg.pages.dev/scheduled

# 或触发特定 cron
curl "https://chatbot-service-9qg.pages.dev/scheduled?cron=0+2+*+*+*"
```

---

## 🔧 自定义任务

### 添加新任务

```typescript
import { scheduler } from './scheduler/TaskScheduler.js';

scheduler.registerTask({
  id: 'my-custom-task',
  name: '我的自定义任务',
  description: '这是一个自定义任务',
  schedule: '0 0 * * *', // 每天午夜
  enabled: true,
  execute: async (env: any) => {
    console.log('Running my custom task...');
    // 你的任务逻辑
  },
});
```

### Cron 表达式参考

```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日期 (1 - 31)
│ │ │ ┌───────────── 月份 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6) (0 = 周日)
│ │ │ │ │
* * * * *

示例:
- "0 * * * *"      每小时
- "0 2 * * *"      每天凌晨 2 点
- "*/5 * * * *"    每 5 分钟
- "0 9 * * 1"      每周一上午 9 点
- "0 0 1 * *"      每月 1 号午夜
```

---

## 📊 监控任务执行

### 查看任务状态

```typescript
const status = scheduler.getStatusReport();

console.log(`总任务数: ${status.totalTasks}`);
console.log(`启用任务: ${status.enabledTasks}`);
console.log(`禁用任务: ${status.disabledTasks}`);

status.tasks.forEach(task => {
  console.log(`${task.name} (${task.schedule})`);
  console.log(`  上次运行: ${task.lastRun}`);
  console.log(`  下次运行: ${task.nextRun}`);
});
```

### 查看日志

在 Cloudflare Dashboard 中：
1. 进入 Workers & Pages
2. 选择你的项目
3. 点击 "Logs" 标签
4. 筛选 `[Scheduler]` 日志

---

## 🎯 最佳实践

### 1. 任务执行时间选择

- **低流量时间**: 数据清理、数据库优化
  - 建议: 凌晨 2-4 点
  
- **工作时间**: 统计报告生成
  - 建议: 上午 9-10 点

- **高频任务**: 实时监控
  - 建议: 每 5-15 分钟

### 2. 错误处理

```typescript
execute: async (env: any) => {
  try {
    // 你的任务逻辑
    await doSomething();
  } catch (error) {
    console.error('[Task] Failed:', error);
    // 发送告警邮件
    // 或记录到错误跟踪系统
  }
}
```

### 3. 任务依赖

```typescript
// 如果任务 B 依赖任务 A 的结果
execute: async (env: any) => {
  // 先执行任务 A
  await scheduler.executeTask('task-a', env);
  
  // 再执行任务 B
  await doTaskB();
}
```

### 4. 长时间运行的任务

Cloudflare Workers 有 30 秒执行限制（付费版 15 分钟）

对于长任务：
- 分批处理数据
- 使用 Durable Objects 保持状态
- 或使用外部队列服务

---

## 🔒 安全性

### 认证保护

```typescript
// 在 scheduled.ts 中添加认证
export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;
  
  // 验证 Cloudflare Cron 触发器
  const isCronTrigger = request.headers.get('CF-Cron') !== null;
  
  if (!isCronTrigger) {
    // 手动触发需要 API Key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== env.SCHEDULER_API_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  
  // ... 执行任务
}
```

---

## 📚 相关文档

- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Database Management](../database/README.md)
- [Analytics Service](../database/analytics.ts)

---

## 🎉 优势

相比 hoashiflow 的调度器：

| 功能 | hoashiflow | chatbot-service | 优势 |
|------|------------|-----------------|------|
| 调度方式 | 本地 Cron | Cloudflare Cron | 云原生 |
| 可靠性 | 依赖服务器 | 高可用 | chatbot |
| 维护成本 | 需要管理 | 零维护 | chatbot |
| 扩展性 | 单机 | 全球分布 | chatbot |
| 监控 | 需自建 | 内置日志 | chatbot |

**状态**: ✅ 企业级调度能力完成
