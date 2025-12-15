# 快速部署命令

## 🚀 立即部署

### 方式 1: 使用 Wrangler CLI（推荐）

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
npm run deploy
```

这会部署到 Cloudflare Pages。首次部署时，Wrangler 会提示你登录。

---

### 方式 2: 通过 Cloudflare Dashboard

1. 访问 https://dash.cloudflare.com/
2. **Workers & Pages** → **Create application** → **Pages** → **Upload assets**
3. 上传 `chatbot-service` 目录（排除 goldenyears/）
4. 项目名称: `chatbot-service-multi-tenant`

---

## ⚙️ 部署后配置

### 1. 设置环境变量

在 Cloudflare Dashboard:
- 进入项目 → **Settings** → **Environment variables**
- 添加 **Production**:
  - `GEMINI_API_KEY`: 你的 API Key

### 2. 配置域名（可选）

- 进入项目 → **Custom domains**
- 添加: `chatbot-api.goldenyearsphoto.com`

---

## ✅ 验证部署

```bash
# 测试 API
curl -X POST https://chatbot-api.goldenyearsphoto.com/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.goldenyearsphoto.com" \
  -d '{"message": "你好", "sessionId": "test-123"}'

# 测试 Widget
curl https://chatbot-api.goldenyearsphoto.com/widget/loader.js
```

---

## 🌐 更新主网站

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto

# base-layout.njk 已更新（包含 data-company="goldenyears"）

# 构建并部署
npm run build
git push  # 如果使用 Git 自动部署
```

---

**准备好了吗？运行：**

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
npm run deploy
```
