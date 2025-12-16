# 环境变量配置

## ✅ 已配置的 Supabase 密钥

你的 Supabase 项目已配置：

- **Project URL**: `https://gprjocjpibsqhdbncvga.supabase.co`
- **anon key**: 已配置在 `.env.local`
- **service_role key**: 已配置在 `.env.local`

## 📋 下一步：配置 Gemini API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的 API Key
3. 更新 `.env.local` 文件中的 `GEMINI_API_KEY`

## 📋 在 Cloudflare Pages 中配置

部署到 Cloudflare Pages 时，需要在 Dashboard 中设置以下环境变量：

1. 进入 Cloudflare Dashboard
2. 选择你的 Pages 项目
3. 进入 **Settings** → **Environment variables**
4. 添加以下变量：

### Production 环境

```
NEXT_PUBLIC_SUPABASE_URL=https://gprjocjpibsqhdbncvga.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcmpvY2pwaWJzcWhkYm5jdmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Njc1NDAsImV4cCI6MjA4MDA0MzU0MH0.kuallDCX0DruwBxjfMhrdhm0jRgK3ODK75ppXJYOTRA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcmpvY2pwaWJzcWhkYm5jdmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQ2NzU0MCwiZXhwIjoyMDgwMDQzNTQwfQ.kSu5Gn8XuvVnWMilNXOOmj0_0VpqWAbQsYZtpJa7AGQ
GEMINI_API_KEY=your_gemini_api_key_here
```

⚠️ **安全提示**：
- `SUPABASE_SERVICE_ROLE_KEY` 和 `GEMINI_API_KEY` 是私密密钥，不要公开分享
- 如果密钥泄露，立即在 Supabase Dashboard 中重新生成

## 🔍 验证配置

运行以下命令验证环境变量是否正确加载：

```bash
npm run dev
```

然后在浏览器控制台检查是否有 Supabase 连接错误。

