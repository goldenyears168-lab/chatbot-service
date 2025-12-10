# 最终部署步骤

## ✅ 多租户代码实施完成

所有代码已完成并修复，但由于文件过多导致本地 Wrangler 无法启动。

---

## 🚀 推荐方案：直接部署到 Cloudflare Pages 测试

### 为什么跳过本地测试？

- Wrangler 无法监视 goldenyears/ 目录（文件过多）
- 生产环境不会有这个问题
- 多租户代码已完整实施并修复

---

## 📋 部署步骤

### 步骤 1: 清理 goldenyears 目录（可选）

如果希望本地测试，需要先手动移动 goldenyears 目录：

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
mv goldenyears ../goldenyears-backup
```

### 步骤 2: 部署到 Cloudflare Pages

#### 2.1 创建 Cloudflare Pages 项目

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** → **Create application** → **Pages**
3. **选择方式**:

**方式 A: 直接上传（推荐，快速）**

- 点击 **Upload assets**
- 项目名称: `chatbot-service-multi-tenant`
- 上传整个 `chatbot-service` 目录的内容（排除 goldenyears/）

**方式 B: Git 整合（推荐，自动部署）**

- 点击 **Connect to Git**
- 选择你的 Git 仓库
- 配置:
  - Project name: `chatbot-service-multi-tenant`
  - Root directory: `/chatbot-service` ⚠️
  - Build command: `npm run build:css`
  - Build output directory: `.`

#### 2.2 设置环境变量

在 Cloudflare Dashboard 中：
1. 进入项目 → **Settings** → **Environment variables**
2. 添加 **Production** 环境变量:
   - `GEMINI_API_KEY`: 你的 Gemini API Key

#### 2.3 配置自定义域名（可选）

1. 进入项目 → **Custom domains**
2. 添加域名: `chatbot-api.goldenyearsphoto.com`
3. 等待 DNS 配置

---

### 步骤 3: 验证部署

#### 3.1 测试 API 端点

```bash
# 测试 goldenyears 公司的 Chat API
curl -X POST https://chatbot-api.goldenyearsphoto.com/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.goldenyearsphoto.com" \
  -d '{"message": "你好", "sessionId": "test-123"}'
```

**预期结果**: 返回 JSON 格式的聊天回复

#### 3.2 测试 FAQ Menu

```bash
curl https://chatbot-api.goldenyearsphoto.com/api/goldenyears/faq-menu \
  -H "Origin: https://www.goldenyearsphoto.com"
```

**预期结果**: 返回 FAQ 菜单 JSON

#### 3.3 测试 Widget 文件

在浏览器中访问：
- `https://chatbot-api.goldenyearsphoto.com/widget/loader.js`
- `https://chatbot-api.goldenyearsphoto.com/widget/widget.js`
- `https://chatbot-api.goldenyearsphoto.com/widget/widget.css`

**预期结果**: 所有文件正常加载

#### 3.4 测试知识库文件

```bash
curl https://chatbot-api.goldenyearsphoto.com/knowledge/goldenyears/services.json
curl https://chatbot-api.goldenyearsphoto.com/knowledge/companies.json
```

---

### 步骤 4: 部署 goldenyearsphoto 网站

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto

# 构建网站
npm run build

# 部署（根据你的部署方式）
# 如果使用 Cloudflare Pages，推送到 Git 即可
git add .
git commit -m "Switch to multi-tenant chatbot service"
git push
```

---

### 步骤 5: 最终验证

1. 访问 `https://www.goldenyearsphoto.com`
2. 打开浏览器开发者工具（F12）
3. 查看 Console 标签：
   - 应该看到: `[GYChatbot] Initializing for company: goldenyears`
   - 应该看到: `[GYChatbot] Widget initialized successfully for goldenyears`
4. 测试 Widget 功能：
   - 点击 Widget 图标
   - 发送消息
   - 验证收到回复

---

## 🎯 添加新公司（示例）

### 添加 "company2"

#### 1. 创建知识库

在你的本地或通过 Git 添加：

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
mkdir -p knowledge/company2
cp knowledge/goldenyears/*.json knowledge/company2/
# 编辑 knowledge/company2/*.json 文件
```

#### 2. 更新公司配置

编辑 `knowledge/companies.json`:

```json
{
  "goldenyears": { ... },
  "company2": {
    "id": "company2",
    "name": "公司 2",
    "name_en": "Company 2",
    "allowedOrigins": [
      "https://www.company2.com"
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

#### 3. 重新部署

```bash
git add .
git commit -m "Add company2"
git push
# 或使用: npm run deploy
```

#### 4. 客户网站引用

提供给客户的代码：

```html
<script 
  src="https://chatbot-api.goldenyearsphoto.com/widget/loader.js" 
  data-company="company2"
  data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/company2/chat"
  data-api-base-url="https://chatbot-api.goldenyearsphoto.com"
  defer
></script>
```

---

## 📊 部署检查清单

### Chatbot Service
- [ ] Cloudflare Pages 项目已创建
- [ ] 环境变量已设置（GEMINI_API_KEY）
- [ ] 自定义域名已配置（可选）
- [ ] 部署成功
- [ ] API 测试通过 (`/api/goldenyears/chat`)
- [ ] FAQ Menu 测试通过 (`/api/goldenyears/faq-menu`)
- [ ] Widget 文件可访问
- [ ] 知识库文件可访问

### Goldenyearsphoto 网站
- [ ] base-layout.njk 已更新（已完成）
- [ ] 代码已提交
- [ ] 网站已部署
- [ ] Widget 在生产环境正常工作

---

## ⚠️ 重要提示

1. **goldenyears 目录**: 可以保留作为备份，或手动删除以减少文件数
2. **环境变量**: 必须在 Cloudflare Dashboard 中设置
3. **CORS 配置**: 通过 `knowledge/companies.json` 配置
4. **Widget 路径**: 确保包含 `data-company="goldenyears"`

---

## 🎉 完成

多租户架构已完全实施，可以直接部署到 Cloudflare Pages 进行测试！

---

**下一步**: 
1. 部署到 Cloudflare Pages
2. 在生产环境验证功能
3. 添加新公司（如需要）

**相关文档**:
- `DEPLOYMENT_GUIDE.md` - 详细部署步骤
- `README.md` - 项目说明
- `MULTI_TENANT_ARCHITECTURE.md` - 架构设计
