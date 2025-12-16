# 快速开始指南

## ✅ 已完成

1. ✅ Next.js 项目已创建
2. ✅ Supabase 环境变量已配置
3. ✅ 数据库迁移 SQL 文件已准备

## 📋 下一步：执行数据库迁移

### 步骤 1: 在 Supabase 中执行 SQL 迁移

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`gprjocjpibsqhdbncvga`
3. 进入 **SQL Editor**
4. 点击 **New Query**
5. 打开项目中的 `sql/01-init.sql` 文件
6. 复制全部内容并粘贴到 SQL Editor
7. 点击 **Run** 执行

### 步骤 2: 验证数据库表

在 Supabase Dashboard 中：

1. 进入 **Table Editor**
2. 确认以下表已创建：
   - ✅ conversations
   - ✅ messages
   - ✅ users
   - ✅ performance_metrics
   - ✅ workflow_executions
   - ✅ faq_queries
   - ✅ intent_statistics

### 步骤 3: 测试连接

运行测试脚本：

```bash
npm run test:supabase
```

如果看到 ✅ 表示连接成功！

### 步骤 4: 配置 Gemini API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的 API Key
3. 更新 `.env.local` 文件：

```bash
GEMINI_API_KEY=your_actual_gemini_api_key
```

## 🚀 开始开发

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 📚 相关文档

- [数据库设置指南](./DATABASE_SETUP.md)
- [环境变量配置](./ENV_CONFIG.md)
- [迁移计划](../MIGRATION_PLAN.md)

