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
├── companies/                 # 公司配置和知识库
│   ├── registry.json          # 公司注册表
│   ├── goldenyears/           # 好時有影
│   │   ├── knowledge/         # 知识库
│   │   └── config.json        # 公司配置
│   └── company-*/             # 其他公司
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

### 步骤 1: 创建公司目录

```bash
mkdir -p companies/company-name/knowledge
```

### 步骤 2: 复制知识库文件

```bash
cp companies/goldenyears/knowledge/*.json companies/company-name/knowledge/
```

知识库文件按编号组织（共8个文件）：
- `1-services.json` - 核心：服务列表、价格
- `2-contact_info.json` - 核心：联系方式
- `3-personas.json` - 核心：AI人格
- `4-policies.json` - 核心：公司政策
- `5-intent_config.json` - 增强：意图识别配置
- `6-entity_patterns.json` - 增强：实体提取模式
- `7-response_templates.json` - 增强：回复模板
- `8-faq_detailed.json` - 增强：FAQ详细内容

### 步骤 3: 创建公司配置

创建 `companies/company-name/config.json`：

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

- [快速开始指南](./docs/QUICK_START.md)
- [理想架构设计（100+公司）](./docs/IDEAL_ARCHITECTURE_100_COMPANIES.md)
- [架构对比说明](./docs/ARCHITECTURE_COMPARISON.md)
- [迁移完成说明](./docs/MIGRATION_COMPLETE.md)

## 🌐 API 端点

```
GET  /api/{company}/faq-menu     # FAQ 菜单
POST /api/{company}/chat         # 聊天
```

## 📝 许可证

ISC
