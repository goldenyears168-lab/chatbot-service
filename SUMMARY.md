# 部署流程总结

## 📍 项目位置

```
/Users/jackm4/Documents/GitHub/
├── chatbot-service/
│   └── goldenyears/          # Chatbot Service 项目
└── goldenyearsphoto/          # 主网站项目
```

---

## 🚀 快速部署流程

### 第一步：部署 Chatbot Service

```bash
# 1. 进入项目目录
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears

# 2. 安装依赖
npm install

# 3. 编译 CSS
npm run build:css

# 4. 本地测试（可选）
npm run dev
# 访问 http://localhost:8788 测试

# 5. 部署到 Cloudflare Pages
npm run deploy
```

**或者使用部署脚本**:
```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
./deploy.sh
```

### 第二步：在 Cloudflare Dashboard 中配置

1. **创建 Pages 项目**:
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - **Workers & Pages** → **Create application** → **Pages**
   - 项目名称: `goldenyears-chatbot-service`
   - 如果使用 Git 整合，Root directory: `/chatbot-service/goldenyears`

2. **设置环境变量**:
   - **Settings** → **Environment variables**
   - `GEMINI_API_KEY`: 你的 Gemini API Key
   - `CHATBOT_ALLOWED_ORIGINS`: `https://www.goldenyearsphoto.com,https://goldenyearsphoto.com`

3. **配置自定义域名**（可选）:
   - **Custom domains** → 添加 `chatbot-api.goldenyearsphoto.com`

### 第三步：更新 Goldenyearsphoto 网站

```bash
# 1. 进入网站项目目录
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto

# 2. 确认 base-layout.njk 已更新（已完成）
# 文件: src/_includes/base-layout.njk
# Widget 加载器已指向: https://chatbot-api.goldenyearsphoto.com

# 3. 构建网站
npm run build

# 4. 部署网站（根据你的部署方式）
# 如果使用 Cloudflare Pages:
# - 推送到 Git 或通过 Dashboard 上传
# 如果使用其他平台:
# - 按照该平台的部署流程
```

---

## ✅ 验证清单

### Chatbot Service 验证

- [ ] 部署成功（Cloudflare Dashboard 显示 Success）
- [ ] API 端点可访问: `https://chatbot-api.goldenyearsphoto.com/api/chat`
- [ ] Widget 文件可访问:
  - [ ] `https://chatbot-api.goldenyearsphoto.com/widget/loader.js`
  - [ ] `https://chatbot-api.goldenyearsphoto.com/widget/widget.js`
  - [ ] `https://chatbot-api.goldenyearsphoto.com/widget/widget.css`
- [ ] 知识库文件可访问: `https://chatbot-api.goldenyearsphoto.com/knowledge/services.json`

### Goldenyearsphoto 网站验证

- [ ] 网站已重新部署
- [ ] 访问 `https://www.goldenyearsphoto.com`
- [ ] Widget 图标显示正常
- [ ] Widget 功能正常（可以发送消息）
- [ ] 浏览器控制台无错误

---

## 📚 详细文档

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - 完整部署指南（详细步骤）
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - 部署检查清单
- **[README.md](./README.md)** - 架构文档
- **[ARCHITECTURE_AUDIT.md](./ARCHITECTURE_AUDIT.md)** - 架构审计报告

---

## 🔧 常用命令

### Chatbot Service

```bash
# 本地开发
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
npm run dev

# 编译 CSS
npm run build:css

# 部署
npm run deploy

# 查看日志
npx wrangler pages deployment tail --project-name=goldenyears-chatbot-service
```

### Goldenyearsphoto 网站

```bash
# 本地开发
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto
npm run dev

# 构建
npm run build

# 部署（根据你的部署方式）
```

---

## ⚠️ 重要提示

1. **路径移动不影响连接**: `goldenyearsphoto` 通过 URL 连接，不依赖本地路径
2. **环境变量**: 必须在 Cloudflare Dashboard 中设置，不要提交到 Git
3. **CORS 配置**: 确保 `CHATBOT_ALLOWED_ORIGINS` 包含所有需要的域名
4. **CSS 编译**: 部署前必须执行 `npm run build:css`

---

## 🆘 遇到问题？

参考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 中的"故障排除"章节。

---

**最后更新**: 2024-01-XX
