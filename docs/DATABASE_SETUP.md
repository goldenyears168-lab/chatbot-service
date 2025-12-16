# 数据库设置指南

## 📋 步骤 1: 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: chatbot-service
   - **Database Password**: 设置一个强密码（保存好）
   - **Region**: 选择离你最近的区域
4. 等待项目创建完成（约 2 分钟）

## 📋 步骤 2: 获取 API 密钥

1. 在 Supabase Dashboard 中，进入 **Settings** → **API**
2. 记录以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (公开密钥)
   - **service_role key**: `eyJhbGc...` (私密密钥，仅服务端使用)

## 📋 步骤 3: 执行数据库迁移

### 方法 1: 使用 Supabase SQL Editor（推荐）

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 点击 **New Query**
3. 复制 `sql/01-init.sql` 文件的内容
4. 粘贴到 SQL Editor
5. 点击 **Run** 执行

### 方法 2: 使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 链接到你的项目
supabase link --project-ref your-project-ref

# 执行迁移
supabase db push
```

## 📋 步骤 4: 验证数据库设置

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

3. 检查 **Database** → **Extensions**，确认 `vector` 扩展已启用

## 📋 步骤 5: 配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# Supabase 公开配置（客户端可见）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase 私密配置（仅服务端使用）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

⚠️ **重要**：
- `.env.local` 文件已在 `.gitignore` 中，不会被提交到 Git
- 在 Cloudflare Pages Dashboard 中也要设置这些环境变量

## 📋 步骤 6: 测试数据库连接

创建测试脚本 `scripts/test-db.ts`：

```typescript
import { DatabaseManager } from '@/lib/db'

async function testConnection() {
  const db = new DatabaseManager()
  
  try {
    // 测试查询
    const stats = await db.getCompanyStats('test-company', 7)
    console.log('✅ Database connection successful!')
    console.log('Stats:', stats)
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  }
}

testConnection()
```

运行测试：

```bash
npx tsx scripts/test-db.ts
```

## 🔍 常见问题

### Q: pgvector 扩展未启用？

A: 在 Supabase SQL Editor 中执行：
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Q: 如何重置数据库？

A: 在 Supabase Dashboard → **Settings** → **Database** → **Reset Database**

⚠️ **警告**：这会删除所有数据！

### Q: 如何备份数据？

A: 在 Supabase Dashboard → **Database** → **Backups** 可以查看自动备份

## 📚 参考资源

- [Supabase 文档](https://supabase.com/docs)
- [pgvector 文档](https://github.com/pgvector/pgvector)
- [Supabase TypeScript 客户端](https://supabase.com/docs/reference/javascript/introduction)

