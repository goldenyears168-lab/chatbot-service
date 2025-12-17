# 部署检查清单

使用此清单确保部署过程完整且正确。

---

## 📋 部署前准备

### 环境准备
- [ ] Cloudflare 账号已准备
- [ ] Google Gemini API Key 已取得
- [ ] Wrangler CLI 已安装（`npm install` 完成）
- [ ] 项目已移动到正确位置：`/Users/jackm4/Documents/GitHub/chatbot-service/goldenyears`

### 文件检查
- [ ] `widget/loader.js` 存在且完整
- [ ] `widget/widget.js` 存在且完整
- [ ] `widget/widget.css` 已编译（执行 `npm run build:css`）
- [ ] `functions/api/chat.ts` 存在
- [ ] `functions/api/faq-menu.ts` 存在
- [ ] `knowledge/*.json` 所有文件存在
- [ ] `wrangler.toml` 配置正确

### 代码检查
- [ ] CORS 配置正确（`01-validate-request.ts`）
- [ ] API 端点路径正确
- [ ] Widget 加载器配置正确

---

## 🚀 第一部分：部署 Chatbot Service

### 步骤 1: 本地测试
- [ ] 执行 `npm install` 安装依赖
- [ ] 执行 `npm run build:css` 编译 CSS
- [ ] 执行 `npm run dev` 启动本地服务器
- [ ] 测试 `http://localhost:8788/widget/loader.js` 可访问
- [ ] 测试 `http://localhost:8788/api/chat` API 正常工作
- [ ] 本地测试通过

### 步骤 2: Cloudflare Pages 项目设置
- [ ] 在 Cloudflare Dashboard 创建 Pages 项目
- [ ] 项目名称: `goldenyears-chatbot-service`
- [ ] 如果使用 Git 整合：
  - [ ] Git 仓库已连接
  - [ ] Root directory: `/chatbot-service/goldenyears` ⚠️ **重要**
  - [ ] Build command: `npm run build:css`（或留空）
  - [ ] Build output directory: `.`
- [ ] 如果使用直接上传：
  - [ ] 已上传项目文件

### 步骤 3: 环境变量设置
- [ ] `GEMINI_API_KEY` 已设置（Production）
- [ ] `CHATBOT_ALLOWED_ORIGINS` 已设置（Production）
  - 值: `https://www.goldenyearsphoto.com,https://goldenyearsphoto.com`
- [ ] Preview 环境变量已设置（可选）

### 步骤 4: 自定义域名（可选但推荐）
- [ ] 已添加自定义域名: `chatbot-api.goldenyearsphoto.com`
- [ ] DNS 记录已配置
- [ ] SSL 证书已自动配置
- [ ] 域名状态为 Active

### 步骤 5: 部署执行
- [ ] 执行 `npm run build:css` 编译 CSS
- [ ] 执行 `npm run deploy` 部署到 Production
- [ ] 或通过 Git 推送触发自动部署
- [ ] 确认部署成功（状态为 Success）

### 步骤 6: 部署后验证
- [ ] API 端点测试通过：
  ```bash
  curl -X POST https://chatbot-api.goldenyearsphoto.com/api/chat \
    -H "Content-Type: application/json" \
    -H "Origin: https://www.goldenyearsphoto.com" \
    -d '{"message": "你好", "sessionId": "test-123"}'
  ```
- [ ] Widget 文件可访问：
  - [ ] `https://chatbot-api.goldenyearsphoto.com/widget/loader.js`
  - [ ] `https://chatbot-api.goldenyearsphoto.com/widget/widget.js`
  - [ ] `https://chatbot-api.goldenyearsphoto.com/widget/widget.css`
- [ ] 知识库文件可访问：
  - [ ] `https://chatbot-api.goldenyearsphoto.com/knowledge/services.json`
- [ ] CORS headers 正确
- [ ] OPTIONS 预检请求正确处理

---

## 🌐 第二部分：更新 Goldenyearsphoto 网站

### 步骤 1: 代码更新
- [ ] 已备份当前代码（Git commit）
- [ ] 已更新 `src/_includes/base-layout.njk`
- [ ] Widget 加载器 URL 已改为生产环境：
  - [ ] `src="https://chatbot-api.goldenyearsphoto.com/widget/loader.js"`
  - [ ] `data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/chat"`
  - [ ] `data-api-base-url="https://chatbot-api.goldenyearsphoto.com"`
- [ ] 旧代码已注释或删除

### 步骤 2: 本地验证
- [ ] 执行 `npm run build` 构建成功
- [ ] 本地预览测试（可选，需要同时启动 chatbot service）
- [ ] 代码已提交到 Git

### 步骤 3: 部署网站
- [ ] 已重新部署 `goldenyearsphoto` 网站
- [ ] 部署成功

---

## ✅ 第三部分：生产环境验证

### Widget 加载检查
- [ ] 访问 `https://www.goldenyearsphoto.com`
- [ ] 打开浏览器开发者工具（F12）
- [ ] Console 标签：
  - [ ] 看到 `[GYChatbot] Widget initialized successfully`
  - [ ] 无错误信息
- [ ] Network 标签：
  - [ ] `loader.js` 成功加载（状态 200）
  - [ ] `widget.js` 成功加载（状态 200）
  - [ ] `widget.css` 成功加载（状态 200）

### Widget 功能测试
- [ ] Widget 图标显示正常
- [ ] 点击图标可以打开 Widget
- [ ] 发送消息 "你好" 收到 AI 回复
- [ ] FAQ 菜单正常显示
- [ ] 多轮对话上下文保持正常

### API 调用检查
- [ ] Network 标签中 `/api/chat` 请求状态为 200
- [ ] 响应包含 `reply` 字段
- [ ] 响应时间 < 3 秒

### 多页面测试
- [ ] 首页 (`/`) - Widget 正常工作
- [ ] FAQ 页面 (`/guide/faq`) - Widget 正常工作
- [ ] 服务页面 (`/services/*`) - Widget 正常工作
- [ ] 作品集页面 (`/blog/*`) - Widget 正常工作
- [ ] 预约页面 (`/booking/*`) - Widget 正常工作

### 性能检查
- [ ] Widget 加载时间 < 2 秒
- [ ] 首次 API 调用 < 3 秒
- [ ] Cloudflare Analytics 显示正常错误率

---

## 🔍 故障排除检查

如果遇到问题，检查以下项目：

### Widget 无法加载
- [ ] 检查 `loader.js` URL 是否正确
- [ ] 检查浏览器控制台错误信息
- [ ] 检查 Network 标签，确认文件是否成功加载
- [ ] 检查 CORS 配置

### API 返回 CORS 错误
- [ ] 检查 `CHATBOT_ALLOWED_ORIGINS` 环境变量
- [ ] 确保包含所有需要的域名
- [ ] 重新部署 chatbot service

### API 返回 500 错误
- [ ] 检查 `GEMINI_API_KEY` 是否已设置
- [ ] 检查 Cloudflare Pages 日志
- [ ] 检查 API 请求格式是否正确

### Widget 样式不正确
- [ ] 检查 `widget.css` 是否成功加载
- [ ] 确认已执行 `npm run build:css`
- [ ] 重新部署 chatbot service

---

## 📝 部署记录

**部署日期**: _______________

**部署人员**: _______________

**Chatbot Service 部署 URL**: 
- Production: `https://chatbot-api.goldenyearsphoto.com`
- 或 Pages 默认: `https://goldenyears-chatbot-service.pages.dev`

**Goldenyearsphoto 网站部署状态**: 
- [ ] 已更新
- [ ] 已部署
- [ ] 已验证

**问题记录**:
```
（如有问题，记录在此）
```

---

## ✅ 最终确认

- [ ] 所有检查项已完成
- [ ] 所有测试通过
- [ ] 生产环境运行正常
- [ ] 文档已更新

**部署完成！** 🎉

---

**最后更新**: 2024-01-XX
