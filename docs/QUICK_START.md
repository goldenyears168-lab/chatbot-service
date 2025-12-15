# Chatbot Service 快速开始指南

## 📍 当前项目位置

```
/Users/jackm4/Documents/GitHub/chatbot-service/
├── goldenyears/          # 好時有影 Chatbot Service
└── README.md             # 架构文档
```

## 🚀 开发工作流

### 本地开发（Golden Years）

```bash
# 进入项目目录
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears

# 安装依赖
npm install

# 启动本地开发服务器
npm run dev
# 或
npx wrangler pages dev

# 服务器会在 http://localhost:8788 启动
```

### 编译 CSS

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
npm run build:css
```

### 部署到 Cloudflare Pages

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears

# 部署到 Production
npm run deploy

# 部署到 Preview
npm run deploy:preview
```

## 🔗 连接方式

### 主网站连接（goldenyearsphoto）

`goldenyearsphoto` 项目通过以下方式连接：

**生产环境**:
```html
<script 
  src="https://chatbot-api.goldenyearsphoto.com/widget/loader.js" 
  data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/chat"
  data-api-base-url="https://chatbot-api.goldenyearsphoto.com"
  defer
></script>
```

**本地开发**:
```html
<script 
  src="http://localhost:8788/widget/loader.js" 
  data-api-endpoint="http://localhost:8788/api/chat"
  data-api-base-url="http://localhost:8788"
  defer
></script>
```

## ➕ 添加新公司项目

### 1. 复制模板

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
cp -r goldenyears company-name
cd company-name
```

### 2. 更新配置

编辑以下文件：
- `package.json` - 更新项目名称
- `wrangler.toml` - 更新 Cloudflare Pages 项目名称
- `knowledge/` - 更新知识库文件

### 3. 部署

```bash
npm install
npm run deploy
```

详细步骤请参考 [README.md](./README.md)

## 📚 相关文档

- [README.md](./README.md) - 完整架构文档
- [ARCHITECTURE_AUDIT.md](./ARCHITECTURE_AUDIT.md) - 架构审计报告
- [goldenyears/DEPLOYMENT.md](./goldenyears/DEPLOYMENT.md) - 部署指南

## ⚠️ 重要提示

1. **路径移动不影响连接**: `goldenyearsphoto` 通过 URL 连接，不依赖本地路径
2. **每个项目独立**: 每个公司的 chatbot service 是独立的 Cloudflare Pages 项目
3. **环境变量**: 在 Cloudflare Dashboard 中设置，不要提交到 Git
4. **CORS 配置**: 确保配置正确的 `CHATBOT_ALLOWED_ORIGINS`

---

**最后更新**: 2024-01-XX
