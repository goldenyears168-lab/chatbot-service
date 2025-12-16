# 部署指南

## 📋 部署前检查清单

### 1. 环境变量配置

确保以下环境变量已配置：

#### Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

#### AI 服务
- ✅ `GEMINI_API_KEY`

#### Cloudflare（可选，用于 GitHub Actions）
- ✅ `CLOUDFLARE_API_TOKEN`
- ✅ `CLOUDFLARE_ACCOUNT_ID`

### 2. 数据库迁移

确保已在 Supabase 中执行：
```bash
# 在 Supabase SQL Editor 中执行
sql/01-init.sql
```

验证：
```bash
npm run test:supabase
```

### 3. 构建测试

本地构建测试：
```bash
npm run build
npm run pages:build
```

## 🚀 部署到 Cloudflare Pages

### 方法 1: 使用 Wrangler CLI（推荐）

```bash
# 1. 构建项目
npm run build
npm run pages:build

# 2. 部署
npm run deploy
```

### 方法 2: 使用 GitHub Actions

1. 在 GitHub 仓库设置 Secrets：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. 推送代码到 `main` 分支，GitHub Actions 会自动部署

### 方法 3: 使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Pages** → **Create a project**
3. 连接 GitHub 仓库
4. 配置构建设置：
   - **Build command**: `npm install && npm run build && npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (根目录)
5. 添加环境变量（在 Settings → Environment variables）
6. 部署

## 🔧 环境变量配置

在 Cloudflare Pages Dashboard 中：

1. 进入项目 → **Settings** → **Environment variables**
2. 为每个环境（Production, Preview）添加变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
GEMINI_API_KEY=your_gemini_api_key
```

## 📊 部署后验证

### 1. 检查部署状态

访问 Cloudflare Pages Dashboard，确认部署成功。

### 2. 测试端点

```bash
# 主页
curl https://your-domain.pages.dev/

# FAQ Menu API
curl https://your-domain.pages.dev/api/goldenyears/faq-menu

# Chat API（需要 POST）
curl -X POST https://your-domain.pages.dev/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "sessionId": "test-123"}'
```

### 3. 测试 Widget

在测试页面中嵌入 Widget：

```html
<script>
  window.smartBotConfig = {
    companyId: "goldenyears",
    themeColor: "#667eea",
    apiBaseUrl: "https://your-domain.pages.dev"
  };
</script>
<script src="https://your-domain.pages.dev/widget/widget.js" async></script>
```

## 🔍 故障排查

### 问题 1: 构建失败

**症状**: `npm run pages:build` 失败

**解决方案**:
- 检查 Node.js 版本（需要 18+）
- 检查依赖是否完整安装
- 查看构建日志中的具体错误

### 问题 2: API 返回 404

**症状**: API 端点返回 404

**解决方案**:
- 检查路由配置是否正确
- 确认 `wrangler.toml` 中的 `pages_build_output_dir` 设置正确
- 检查 Cloudflare Pages 的构建输出目录

### 问题 3: 环境变量未生效

**症状**: API 无法访问 Supabase 或 Gemini

**解决方案**:
- 在 Cloudflare Dashboard 中检查环境变量
- 确认变量名称拼写正确
- 重新部署以应用新的环境变量

### 问题 4: CORS 错误

**症状**: Widget 无法调用 API

**解决方案**:
- 检查 `middleware.ts` 中的 CORS 配置
- 确认 `allowedOrigins` 配置正确
- 检查 API 路由中的 CORS 头

## 📈 性能优化建议

1. **启用 Cloudflare CDN**: 自动启用，无需额外配置
2. **使用 Edge Runtime**: API 路由已配置 `export const runtime = 'edge'`
3. **缓存策略**: 考虑为静态资源添加缓存头
4. **监控**: 使用 Cloudflare Analytics 监控性能

## 🔐 安全建议

1. **环境变量**: 不要在代码中硬编码敏感信息
2. **CORS**: 生产环境使用白名单而不是 `*`
3. **API 限流**: 考虑添加速率限制
4. **输入验证**: 所有用户输入都已验证

## 📚 相关文档

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

