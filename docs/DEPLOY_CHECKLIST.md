# 部署检查清单

## ✅ 部署前检查

### 1. 环境变量
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - 已在 `.env.local` 配置
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 已在 `.env.local` 配置
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - 已在 `.env.local` 配置
- [ ] `GEMINI_API_KEY` - 需要配置真实值（当前为占位符）

### 2. 数据库
- [ ] 已在 Supabase 中执行 `sql/01-init.sql`
- [ ] 运行 `npm run test:supabase` 验证连接

### 3. 构建测试
- [x] `npm run build` - 成功
- [x] `npm run pages:build` - 待测试
- [x] TypeScript 类型检查通过

### 4. Cloudflare Pages 配置
- [ ] 在 Cloudflare Dashboard 中配置环境变量
- [ ] 确认项目名称：`chatbot-service-9qg`
- [ ] 确认构建输出目录：`.vercel/output/static`

## 🚀 部署步骤

### 步骤 1: 配置 Cloudflare Pages 环境变量

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Pages** → 选择项目 `chatbot-service-9qg`（或创建新项目）
3. 进入 **Settings** → **Environment variables**
4. 为 **Production** 和 **Preview** 环境添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://gprjocjpibsqhdbncvga.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcmpvY2pwaWJzcWhkYm5jdmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Njc1NDAsImV4cCI6MjA4MDA0MzU0MH0.kuallDCX0DruwBxjfMhrdhm0jRgK3ODK75ppXJYOTRA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcmpvY2pwaWJzcWhkYm5jdmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ2NzU0MCwiZXhwIjoyMDgwMDQzNTQwfQ.kSu5Gn8XuvVnWMilNXOOmj0_0VpqWAbQsYZtpJa7AGQ
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 步骤 2: 执行数据库迁移

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目：`gprjocjpibsqhdbncvga`
3. 进入 **SQL Editor**
4. 打开 `sql/01-init.sql` 文件
5. 复制全部内容并粘贴到 SQL Editor
6. 点击 **Run** 执行

### 步骤 3: 部署

#### 方法 A: 使用 Wrangler CLI（推荐）

```bash
npm run deploy
```

#### 方法 B: 使用 Cloudflare Dashboard

1. 在 Cloudflare Pages 中创建新项目
2. 连接 GitHub 仓库
3. 配置构建设置：
   - **Build command**: `npm install && npm run build && npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (根目录)
4. 添加环境变量（见步骤 1）
5. 保存并部署

## 🔍 部署后验证

### 1. 检查部署状态
- 访问 Cloudflare Pages Dashboard
- 确认部署成功（绿色状态）

### 2. 测试端点

```bash
# 替换为你的实际域名
DOMAIN="https://your-project.pages.dev"

# 主页
curl $DOMAIN/

# FAQ Menu API
curl $DOMAIN/api/goldenyears/faq-menu

# Chat API
curl -X POST $DOMAIN/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "sessionId": "test-123"}'
```

### 3. 测试 Widget

在测试页面中嵌入：

```html
<script>
  window.smartBotConfig = {
    companyId: "goldenyears",
    themeColor: "#667eea",
    apiBaseUrl: "https://your-project.pages.dev"
  };
</script>
<script src="https://your-project.pages.dev/widget/widget.js" async></script>
```

## ⚠️ 常见问题

### 问题 1: 构建失败
- 检查 Node.js 版本（需要 18+）
- 检查依赖是否完整安装
- 查看构建日志

### 问题 2: 环境变量未生效
- 确认在 Cloudflare Dashboard 中正确配置
- 重新部署以应用新变量

### 问题 3: API 返回错误
- 检查环境变量是否正确
- 检查 Supabase 连接
- 查看 Cloudflare Pages 日志

## 📝 下一步

部署成功后：
1. 测试所有功能
2. 监控性能
3. 收集用户反馈
4. 持续优化

