# Chatbot Service 多公司架构

本目录包含多个公司的独立 Chatbot 微服务项目。每个公司的 chatbot service 都是独立的 Cloudflare Pages 项目，可以独立部署和维护。

## 📁 目录结构

```
chatbot-service/
├── goldenyears/          # 好時有影 (Golden Years Photo) 的 Chatbot Service
│   ├── functions/        # Cloudflare Pages Functions
│   ├── knowledge/        # 知识库文件
│   ├── widget/           # Widget 文件（提供给客户嵌入）
│   └── wrangler.toml     # Cloudflare Pages 配置
├── company2/             # 未来其他公司的 Chatbot Service
└── README.md             # 本文件
```

## 🏗️ 架构设计

### 核心原则

1. **独立部署**: 每个公司的 chatbot service 是独立的 Cloudflare Pages 项目
2. **URL 连接**: 主网站通过 CDN URL 引用 widget，不依赖本地路径
3. **代码维护**: Widget 代码由我们维护，客户只需嵌入 script tag
4. **可扩展性**: 可以轻松添加新公司的 chatbot service

### 连接方式

主网站（如 `goldenyearsphoto`）通过以下方式连接 chatbot service：

```html
<!-- 生产环境 -->
<script 
  src="https://chatbot-api.goldenyearsphoto.com/widget/loader.js" 
  data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/chat"
  data-api-base-url="https://chatbot-api.goldenyearsphoto.com"
  data-page-type="home"
  defer
></script>

<!-- 本地开发 -->
<script 
  src="http://localhost:8788/widget/loader.js" 
  data-api-endpoint="http://localhost:8788/api/chat"
  data-api-base-url="http://localhost:8788"
  defer
></script>
```

**重要**: 由于使用 URL 连接，移动项目目录不会影响主网站的连接路径。

## 🚀 添加新公司的 Chatbot Service

### 步骤 1: 创建新公司目录

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
cp -r goldenyears company-name
cd company-name
```

### 步骤 2: 更新配置

1. **更新 `package.json`**:
   ```json
   {
     "name": "company-name-chatbot-service",
     ...
   }
   ```

2. **更新 `wrangler.toml`**:
   ```toml
   name = "company-name-chatbot-service"
   
   [env.production]
   name = "company-name-chatbot-service-prod"
   
   [env.preview]
   name = "company-name-chatbot-service-preview"
   ```

3. **更新 `knowledge/` 目录中的知识库文件**:
   - `services.json` - 服务信息
   - `faq_detailed.json` - FAQ 数据
   - `policies.json` - 政策信息
   - 其他公司特定的知识库文件

### 步骤 3: 部署到 Cloudflare Pages

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/company-name
npm install
npm run deploy
```

### 步骤 4: 配置环境变量

在 Cloudflare Dashboard 中设置：
- `GEMINI_API_KEY` - Google Gemini API Key
- `CHATBOT_ALLOWED_ORIGINS` - 允许的 CORS 来源（客户网站域名）

### 步骤 5: 配置自定义域名

在 Cloudflare Pages 中配置：
- API 域名: `chatbot-api.company-domain.com`
- Widget CDN: 可以使用同一个域名，或单独配置 CDN 域名

### 步骤 6: 提供给客户嵌入代码

```html
<script 
  src="https://chatbot-api.company-domain.com/widget/loader.js" 
  data-api-endpoint="https://chatbot-api.company-domain.com/api/chat"
  data-api-base-url="https://chatbot-api.company-domain.com"
  data-page-type="embed"
  defer
></script>
```

## 📋 项目清单

### 每个公司项目应包含

- [ ] `functions/` - API 端点和业务逻辑
- [ ] `knowledge/` - 知识库文件（JSON）
- [ ] `widget/` - Widget 文件（loader.js, widget.js, widget.css）
- [ ] `wrangler.toml` - Cloudflare Pages 配置
- [ ] `package.json` - 项目依赖
- [ ] `README.md` - 公司特定的文档（可选）
- [ ] `DEPLOYMENT.md` - 部署指南（可选）

## 🔒 安全考虑

1. **CORS 配置**: 每个项目应配置 `CHATBOT_ALLOWED_ORIGINS` 限制允许的来源
2. **API Key**: 使用环境变量存储敏感信息，不要提交到 Git
3. **域名验证**: 在 API 中验证请求来源
4. **Rate Limiting**: 考虑在 Cloudflare 层面配置 Rate Limiting

## 📊 监控和维护

### 每个项目独立监控

- Cloudflare Pages 日志
- API 响应时间
- 错误率
- Widget 加载成功率

### 代码维护

- Widget 核心代码（`widget/widget.js`）可以共享，但每个项目独立部署
- 知识库文件（`knowledge/`）每个公司独立维护
- API 逻辑（`functions/api/`）可以根据公司需求定制

## 🎯 最佳实践

1. **版本控制**: 每个公司项目应该有独立的 Git 仓库或分支
2. **文档**: 为每个公司项目维护独立的文档
3. **测试**: 在部署前进行本地测试
4. **备份**: 定期备份知识库文件
5. **更新**: Widget 核心代码更新时，需要更新所有公司项目

## 📝 示例：Golden Years

参考 `goldenyears/` 目录作为示例：

- **部署域名**: `chatbot-api.goldenyearsphoto.com`
- **Widget URL**: `https://chatbot-api.goldenyearsphoto.com/widget/loader.js`
- **主网站**: `goldenyearsphoto` 项目

## ❓ 常见问题

### Q: 移动项目目录会影响主网站吗？

**A**: 不会。主网站通过 URL（CDN）连接 chatbot service，不依赖本地路径。

### Q: 可以共享 Widget 代码吗？

**A**: 可以。Widget 核心代码可以共享，但每个公司项目独立部署，可以定制样式和配置。

### Q: 如何更新所有公司的 Widget？

**A**: 需要分别更新每个公司项目的 `widget/` 目录，然后重新部署。

### Q: 客户需要访问代码吗？

**A**: 不需要。客户只需要嵌入 script tag，代码由我们维护和部署。

---

**最后更新**: 2024-01-XX
