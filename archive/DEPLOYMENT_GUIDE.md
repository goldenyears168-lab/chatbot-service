# Chatbot Service 完整部署指南

本指南详细说明如何部署 `chatbot-service` 到 Cloudflare Pages，以及如何更新 `goldenyearsphoto` 网站以使用新的 chatbot service。

---

## 📋 目录

1. [第一部分：部署 Chatbot Service](#第一部分部署-chatbot-service)
2. [第二部分：更新 Goldenyearsphoto 网站](#第二部分更新-goldenyearsphoto-网站)
3. [第三部分：验证和测试](#第三部分验证和测试)
4. [故障排除](#故障排除)

---

## 第一部分：部署 Chatbot Service

### 步骤 1: 准备项目

#### 1.1 确认项目位置

```bash
# 确认项目在正确的位置
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
pwd
# 应该显示: /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
```

#### 1.2 安装依赖

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
npm install
```

#### 1.3 编译 CSS

```bash
npm run build:css
```

这会生成 `widget/widget.css` 文件。

#### 1.4 本地测试

```bash
npm run dev
```

服务器会在 `http://localhost:8788` 启动。

**测试项目**:
- 打开浏览器访问 `http://localhost:8788/widget/loader.js` - 应该能看到 JavaScript 代码
- 访问 `http://localhost:8788/widget/widget.js` - 应该能看到 Widget 核心代码
- 访问 `http://localhost:8788/widget/widget.css` - 应该能看到 CSS 样式
- 访问 `http://localhost:8788/knowledge/services.json` - 应该能看到知识库 JSON

**测试 API**:
```bash
# 测试 Chat API
curl -X POST http://localhost:8788/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"message": "你好", "sessionId": "test-123"}'

# 测试 FAQ Menu API
curl http://localhost:8788/api/faq-menu \
  -H "Origin: http://localhost:8080"
```

如果本地测试通过，继续下一步。

---

### 步骤 2: 创建 Cloudflare Pages 项目

#### 2.1 登录 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录你的账号
3. 在左侧菜单选择 **Workers & Pages**
4. 点击 **Create application** → **Pages** → **Connect to Git**

#### 2.2 连接 Git 仓库（推荐方式）

**选项 A: 使用 Git 整合（推荐，支持自动部署）**

1. **选择 Git 提供商**: GitHub / GitLab / Bitbucket
2. **选择仓库**: 选择包含 `chatbot-service` 的仓库
3. **配置项目设置**:
   - **Project name**: `goldenyears-chatbot-service`
   - **Production branch**: `main` (或你的主分支)
   - **Root directory**: `/chatbot-service/goldenyears` ⚠️ **重要：需要指定子目录**
   - **Build command**: `npm run build:css` (或留空，如果 CSS 已编译)
   - **Build output directory**: `.` (根目录)

4. **点击 "Save and Deploy"**

**选项 B: 直接上传（快速测试）**

1. 在 Cloudflare Dashboard 中：
   - **Workers & Pages** → **Create application** → **Pages** → **Upload assets**
2. **Project name**: `goldenyears-chatbot-service`
3. 上传整个 `goldenyears` 目录的内容

---

### 步骤 3: 配置环境变量

#### 3.1 在 Cloudflare Dashboard 中设置

1. 进入 **Workers & Pages** → 选择 `goldenyears-chatbot-service` 项目
2. 点击 **Settings** → **Environment variables**
3. 添加以下环境变量：

**Production 环境**:

| 变量名称 | 值 | 说明 |
|---------|-----|------|
| `GEMINI_API_KEY` | `your_gemini_api_key` | Google Gemini API Key（必需） |
| `CHATBOT_ALLOWED_ORIGINS` | `https://www.goldenyearsphoto.com,https://goldenyearsphoto.com` | 允许的 CORS 来源（建议设置） |

**Preview 环境**（可选）:

设置相同的环境变量，或使用不同的 API Key 用于测试。

#### 3.2 获取 Gemini API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录 Google 账号
3. 点击 **Create API Key**
4. 复制 API Key 并保存到环境变量中

---

### 步骤 4: 配置自定义域名（可选但推荐）

#### 4.1 添加自定义域名

1. 在 Cloudflare Dashboard 中：
   - **Workers & Pages** → 选择项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入域名: `chatbot-api.goldenyearsphoto.com`
4. Cloudflare 会自动配置 DNS 记录

#### 4.2 验证域名

等待 DNS 传播（通常几分钟到几小时），然后验证：
- 域名状态显示为 **Active**
- SSL 证书已自动配置

---

### 步骤 5: 部署到 Cloudflare Pages

#### 方式 A: 使用 Wrangler CLI（推荐用于首次部署）

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears

# 确保 CSS 已编译
npm run build:css

# 部署到 Production
npm run deploy
# 或
npx wrangler pages deploy . --project-name=goldenyears-chatbot-service
```

#### 方式 B: 使用 Git 整合（推荐用于持续部署）

1. **提交代码到 Git**:
   ```bash
   cd /Users/jackm4/Documents/GitHub/chatbot-service
   git add .
   git commit -m "Deploy chatbot service"
   git push origin main
   ```

2. **自动部署**:
   - Cloudflare 会自动检测推送
   - 开始构建和部署
   - 在 Dashboard 中可以看到部署进度

#### 方式 C: 使用 Cloudflare Dashboard

1. 在 Cloudflare Dashboard 中：
   - **Workers & Pages** → 选择项目 → **Deployments**
2. 点击 **Create deployment**
3. 上传项目文件或选择 Git 分支

---

### 步骤 6: 验证部署

#### 6.1 检查部署状态

在 Cloudflare Dashboard 中：
- **Workers & Pages** → 选择项目 → **Deployments**
- 确认最新部署状态为 **Success**

#### 6.2 测试 API 端点

**获取部署 URL**:
- 如果使用自定义域名: `https://chatbot-api.goldenyearsphoto.com`
- 如果使用 Pages 默认域名: `https://goldenyears-chatbot-service.pages.dev`

**测试 Chat API**:
```bash
curl -X POST https://chatbot-api.goldenyearsphoto.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.goldenyearsphoto.com" \
  -d '{"message": "你好", "sessionId": "test-123"}'
```

**测试 FAQ Menu API**:
```bash
curl https://chatbot-api.goldenyearsphoto.com/api/faq-menu \
  -H "Origin: https://www.goldenyearsphoto.com"
```

#### 6.3 测试 Widget 文件

在浏览器中访问：
- `https://chatbot-api.goldenyearsphoto.com/widget/loader.js` - 应该能看到 JavaScript 代码
- `https://chatbot-api.goldenyearsphoto.com/widget/widget.js` - 应该能看到 Widget 核心代码
- `https://chatbot-api.goldenyearsphoto.com/widget/widget.css` - 应该能看到 CSS 样式

#### 6.4 测试知识库文件

在浏览器中访问：
- `https://chatbot-api.goldenyearsphoto.com/knowledge/services.json` - 应该能看到 JSON 数据

---

## 第二部分：更新 Goldenyearsphoto 网站

### 步骤 1: 备份当前代码

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto
git add .
git commit -m "Backup before chatbot service migration"
git push
```

### 步骤 2: 更新 base-layout.njk

#### 2.1 打开文件

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto
code src/_includes/base-layout.njk
# 或使用你喜欢的编辑器
```

#### 2.2 找到 Widget 加载部分

在 `base-layout.njk` 中，找到以下部分（大约在第 152-183 行）：

```njk
{# ========================================
   AI 客服 Widget - 已遷移到獨立服務
   ======================================== #}
```

#### 2.3 更新为生产环境配置

**替换本地测试配置**（第 162-170 行）为生产环境配置：

```njk
{# AI 客服 Widget - 外部載入（生產環境） #}
<script 
  src="https://chatbot-api.goldenyearsphoto.com/widget/loader.js" 
  data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/chat"
  data-api-base-url="https://chatbot-api.goldenyearsphoto.com"
  data-page-type="{{ pageType | default('other') }}"
  data-auto-open="{{ 'true' if pageType == 'home' else 'false' }}"
  defer
></script>
```

**或者，如果你想保留本地开发选项**，可以使用条件判断：

```njk
{# AI 客服 Widget - 外部載入 #}
{% if env == "development" %}
  {# 本地測試用 #}
  <script 
    src="http://localhost:8788/widget/loader.js" 
    data-api-endpoint="http://localhost:8788/api/chat"
    data-api-base-url="http://localhost:8788"
    data-page-type="{{ pageType | default('other') }}"
    data-auto-open="{{ 'true' if pageType == 'home' else 'false' }}"
    defer
  ></script>
{% else %}
  {# 生產環境 #}
  <script 
    src="https://chatbot-api.goldenyearsphoto.com/widget/loader.js" 
    data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/chat"
    data-api-base-url="https://chatbot-api.goldenyearsphoto.com"
    data-page-type="{{ pageType | default('other') }}"
    data-auto-open="{{ 'true' if pageType == 'home' else 'false' }}"
    defer
  ></script>
{% endif %}
```

#### 2.4 注释掉旧代码（如果存在）

确保旧的本地 chatbot 代码已被注释或删除：

```njk
{# 
  舊版引用（已停用）:
  <div data-chatbot-config data-page-type="{{ pageType | default('other') }}" style="display: none;" aria-hidden="true"></div>
  <script src="/assets/js/gy-chatbot.js" defer></script>
  <script src="/assets/js/gy-chatbot-init.js" defer></script>
#}
```

### 步骤 3: 验证更改

#### 3.1 本地构建测试

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto
npm run build
```

检查构建输出，确保没有错误。

#### 3.2 本地预览

```bash
# 启动本地服务器（需要同时启动 chatbot service）
# 终端 1: 启动 chatbot service
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
npm run dev

# 终端 2: 启动 goldenyearsphoto 网站
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto
npm run dev
```

在浏览器中访问 `http://localhost:8080`，检查：
- Widget 是否正常加载
- 控制台是否有错误
- Widget 功能是否正常

### 步骤 4: 提交更改

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto
git add src/_includes/base-layout.njk
git commit -m "Switch to external chatbot service"
git push
```

### 步骤 5: 部署 Goldenyearsphoto 网站

#### 5.1 确认部署方式

根据你的 `goldenyearsphoto` 项目配置，使用相应的部署方式：

**如果使用 Cloudflare Pages**:
```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto
npm run build
# 然后通过 Cloudflare Dashboard 或 Wrangler 部署
```

**如果使用 Git 整合**:
- 推送到 Git 后，Cloudflare 会自动部署

**如果使用其他平台**:
- 按照该平台的部署流程操作

---

## 第三部分：验证和测试

### 步骤 1: 生产环境验证

#### 1.1 检查 Widget 加载

1. 访问 `https://www.goldenyearsphoto.com`
2. 打开浏览器开发者工具（F12）
3. 检查 **Console** 标签：
   - 应该看到 `[GYChatbot] Widget initialized successfully`
   - 不应该有错误信息

4. 检查 **Network** 标签：
   - 应该看到 `loader.js` 成功加载（状态 200）
   - 应该看到 `widget.js` 成功加载（状态 200）
   - 应该看到 `widget.css` 成功加载（状态 200）

#### 1.2 测试 Widget 功能

1. **打开 Widget**: 点击页面上的 chatbot 图标
2. **发送消息**: 输入 "你好" 并发送
3. **检查响应**: 应该收到 AI 回复
4. **测试 FAQ**: 点击 FAQ 菜单，应该显示常见问题
5. **测试对话**: 进行多轮对话，检查上下文是否保持

#### 1.3 检查 API 调用

在浏览器开发者工具的 **Network** 标签中：
- 找到 `/api/chat` 请求
- 检查请求状态（应该是 200）
- 检查响应内容（应该包含 `reply` 字段）

### 步骤 2: 性能检查

#### 2.1 Widget 加载时间

- Widget 应该在 2 秒内加载完成
- 首次 API 调用应该在 3 秒内完成

#### 2.2 检查错误率

在 Cloudflare Dashboard 中：
- **Workers & Pages** → 选择项目 → **Analytics**
- 检查错误率和响应时间

### 步骤 3: 多页面测试

测试以下页面，确保 Widget 在所有页面正常工作：
- [ ] 首页 (`/`)
- [ ] FAQ 页面 (`/guide/faq`)
- [ ] 服务页面 (`/services/*`)
- [ ] 作品集页面 (`/blog/*`)
- [ ] 预约页面 (`/booking/*`)

---

## 故障排除

### 问题 1: Widget 无法加载

**症状**: Widget 图标不显示，或控制台有错误

**检查清单**:
1. ✅ 检查 `loader.js` URL 是否正确
2. ✅ 检查浏览器控制台错误信息
3. ✅ 检查 Network 标签，确认文件是否成功加载
4. ✅ 检查 CORS 配置（`CHATBOT_ALLOWED_ORIGINS`）

**解决方案**:
```bash
# 检查 chatbot service 是否正常运行
curl https://chatbot-api.goldenyearsphoto.com/widget/loader.js

# 检查 CORS 配置
# 在 Cloudflare Dashboard 中确认 CHATBOT_ALLOWED_ORIGINS 包含你的域名
```

### 问题 2: API 返回 CORS 错误

**症状**: 控制台显示 CORS 错误

**解决方案**:
1. 在 Cloudflare Dashboard 中检查 `CHATBOT_ALLOWED_ORIGINS` 环境变量
2. 确保包含所有需要的域名：
   ```
   https://www.goldenyearsphoto.com,https://goldenyearsphoto.com
   ```
3. 重新部署 chatbot service

### 问题 3: API 返回 500 错误

**症状**: API 请求失败，返回 500 错误

**检查清单**:
1. ✅ 检查 `GEMINI_API_KEY` 是否已设置
2. ✅ 检查 Cloudflare Pages 日志
3. ✅ 检查 API 请求格式是否正确

**解决方案**:
```bash
# 检查 Cloudflare Pages 日志
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
npx wrangler pages deployment tail --project-name=goldenyears-chatbot-service
```

### 问题 4: Widget 样式不正确

**症状**: Widget 显示但样式异常

**检查清单**:
1. ✅ 检查 `widget.css` 是否成功加载
2. ✅ 检查 CSS 文件路径是否正确
3. ✅ 确认已执行 `npm run build:css`

**解决方案**:
```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
npm run build:css
# 重新部署
npm run deploy
```

### 问题 5: 知识库文件无法访问

**症状**: FAQ 菜单为空或知识库相关功能异常

**检查清单**:
1. ✅ 检查 `knowledge/` 目录是否已部署
2. ✅ 检查文件路径是否正确
3. ✅ 检查 JSON 格式是否正确

**解决方案**:
```bash
# 检查知识库文件
curl https://chatbot-api.goldenyearsphoto.com/knowledge/services.json

# 如果返回 404，检查文件是否在正确的位置
```

---

## 📝 部署检查清单

使用此清单确保部署完整：

### Chatbot Service 部署
- [ ] 项目已编译（CSS）
- [ ] 本地测试通过
- [ ] Cloudflare Pages 项目已创建
- [ ] 环境变量已设置（`GEMINI_API_KEY`, `CHATBOT_ALLOWED_ORIGINS`）
- [ ] 自定义域名已配置（可选）
- [ ] 部署成功
- [ ] API 端点测试通过
- [ ] Widget 文件可访问
- [ ] 知识库文件可访问

### Goldenyearsphoto 网站更新
- [ ] `base-layout.njk` 已更新
- [ ] 本地构建测试通过
- [ ] 本地预览测试通过
- [ ] 代码已提交到 Git
- [ ] 网站已重新部署
- [ ] 生产环境 Widget 加载正常
- [ ] Widget 功能测试通过
- [ ] 多页面测试通过

---

## 🎉 部署完成

如果所有检查项都通过，恭喜！部署已完成。

### 后续维护

1. **监控**: 定期检查 Cloudflare Pages 日志和性能指标
2. **更新**: 更新 chatbot service 时，重新部署即可
3. **扩展**: 添加新公司时，参考本指南创建新项目

---

**最后更新**: 2024-01-XX  
**文档版本**: 1.0
