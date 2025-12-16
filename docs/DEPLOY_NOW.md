# 🚀 立即部署指南

## ✅ 构建状态

- ✅ Next.js 构建成功
- ✅ Cloudflare Pages 构建成功
- ✅ 输出目录：`.vercel/output/static`

## 📋 部署前最后检查

### 1. 环境变量（必须在 Cloudflare Dashboard 中配置）

在部署前，确保在 Cloudflare Pages Dashboard 中配置以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://gprjocjpibsqhdbncvga.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcmpvY2pwaWJzcWhkYm5jdmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Njc1NDAsImV4cCI6MjA4MDA0MzU0MH0.kuallDCX0DruwBxjfMhrdhm0jRgK3ODK75ppXJYOTRA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcmpvY2pwaWJzcWhkYm5jdmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ2NzU0MCwiZXhwIjoyMDgwMDQzNTQwfQ.kSu5Gn8XuvVnWMilNXOOmj0_0VpqWAbQsYZtpJa7AGQ
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

⚠️ **重要**: `GEMINI_API_KEY` 需要替换为真实的 API Key！

### 2. 数据库迁移

在 Supabase SQL Editor 中执行 `sql/01-init.sql`

## 🚀 部署方法

### 方法 1: 使用 Wrangler CLI（推荐，最快）

```bash
npm run deploy
```

这将：
1. 构建 Next.js 应用
2. 转换为 Cloudflare Pages 格式
3. 部署到 Cloudflare Pages

### 方法 2: 使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Pages** → **Create a project**
3. 选择 **Upload assets**
4. 上传 `.vercel/output/static` 目录的内容
5. 配置环境变量（见上方）
6. 部署

### 方法 3: 连接 GitHub（自动部署）

1. 在 Cloudflare Pages 中创建项目
2. 连接 GitHub 仓库
3. 配置构建设置：
   - **Build command**: `npm install && npm run build && npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (根目录)
4. 添加环境变量
5. 保存并部署

## 📝 部署命令

```bash
# 完整部署流程
# 1. 构建
npm run build
npm run pages:build

# 2. 部署（需要先配置 wrangler 认证）
npm run deploy
```

## 🔐 Wrangler 认证

首次使用 Wrangler 需要认证：

```bash
npx wrangler login
```

这将打开浏览器进行 Cloudflare 登录。

## ✅ 部署后验证

部署成功后，访问你的 Cloudflare Pages URL（例如：`https://chatbot-service-9qg.pages.dev`）

### 测试端点

```bash
# 替换为你的实际域名
DOMAIN="https://your-project.pages.dev"

# 主页
curl $DOMAIN/

# FAQ Menu
curl $DOMAIN/api/goldenyears/faq-menu

# Chat API
curl -X POST $DOMAIN/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "sessionId": "test-123"}'
```

## 🎯 下一步

1. ✅ 部署完成
2. 测试所有功能
3. 配置自定义域名（可选）
4. 设置监控和告警
5. 收集用户反馈

## 📚 相关文档

- [完整部署指南](./DEPLOYMENT.md)
- [部署检查清单](./DEPLOY_CHECKLIST.md)
- [故障排查](./DEPLOYMENT.md#故障排查)

---

**准备就绪！** 🚀

