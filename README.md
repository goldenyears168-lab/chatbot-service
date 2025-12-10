# Chatbot Service - 多租户架构

单一部署，支持多个公司的 AI 客服机器人。

## 📁 目录结构

```
chatbot-service/
├── functions/
│   └── api/
│       ├── [company]/        # 动态路由（多租户）
│       │   ├── chat.ts
│       │   └── faq-menu.ts
│       ├── lib/               # 共享库
│       │   ├── companyConfig.ts
│       │   ├── knowledge.ts
│       │   ├── llm.ts
│       │   └── ...
│       └── nodes/             # Pipeline 节点
├── knowledge/                 # 知识库（按公司隔离）
│   ├── companies.json         # 公司配置
│   ├── goldenyears/           # 好時有影知识库
│   └── shared/                # 共享知识库（可选）
├── widget/                    # Widget 文件（共享）
│   ├── loader.js
│   ├── widget.js
│   └── widget.css
├── package.json
└── wrangler.toml
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 编译 CSS

```bash
npm run build:css
```

### 3. 本地测试

```bash
npm run dev
```

服务器会在 `http://localhost:8788` 启动。

测试 API：
```bash
# 测试 goldenyears 公司
curl -X POST http://localhost:8788/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "sessionId": "test-123"}'
```

### 4. 部署到 Cloudflare Pages

```bash
npm run deploy
```

## 📋 添加新公司

### 步骤 1: 创建知识库目录

```bash
mkdir -p knowledge/company-name
```

### 步骤 2: 复制知识库文件

```bash
cp knowledge/goldenyears/*.json knowledge/company-name/
```

### 步骤 3: 更新公司配置

编辑 `knowledge/companies.json`：

```json
{
  "company-name": {
    "id": "company-name",
    "name": "公司名称",
    "name_en": "Company Name",
    "allowedOrigins": [
      "https://www.company-domain.com"
    ],
    "widgetConfig": {
      "theme": "light",
      "locale": "zh-TW"
    },
    "apiConfig": {
      "useSharedApiKey": true,
      "apiKeyEnv": "GEMINI_API_KEY"
    }
  }
}
```

### 步骤 4: 部署

```bash
npm run deploy
```

### 步骤 5: 客户网站引用

```html
<script 
  src="https://chatbot-api.example.com/widget/loader.js" 
  data-company="company-name"
  data-api-endpoint="https://chatbot-api.example.com/api/company-name/chat"
  defer
></script>
```

## 🔧 环境变量

在 Cloudflare Dashboard 中设置：

- `GEMINI_API_KEY` - Google Gemini API Key（必需）

## 📚 详细文档

- [多租户架构设计](./MULTI_TENANT_ARCHITECTURE.md)
- [实施指南](./MULTI_TENANT_IMPLEMENTATION.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)

## 🌐 API 端点

```
GET  /api/{company}/faq-menu     # FAQ 菜单
POST /api/{company}/chat         # 聊天
```

## 📝 许可证

ISC
