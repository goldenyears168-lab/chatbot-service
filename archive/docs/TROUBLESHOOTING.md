# 🔧 故障排除指南

## 当前问题：Functions API 503 错误

### 🔍 症状
- Widget 可以加载
- FAQ 菜单返回 HTML 而非 JSON
- API 请求返回 503 (Service Unavailable)
- 控制台错误：`SyntaxError: Unexpected token '<'`

### ✅ 根本原因
**Cloudflare Pages Functions 没有成功构建**，因为：
1. 依赖包 `@google/generative-ai` 没有安装
2. 构建命令没有配置或配置错误

---

## 🛠️ 完整解决步骤

### 第 1 步：配置构建命令（最重要！）

在 Cloudflare Pages Dashboard：

1. 进入项目：**chatbot-service**
2. 点击 **Settings** 标签
3. 向下滚动到 **Build & deployments** 部分
4. 点击 **Edit configuration** 按钮
5. 填写以下配置：

```
Framework preset: None
Build command: npm run build
Build output directory: /
Root directory: (留空)
```

6. 点击 **Save** 保存

### 第 2 步：触发重新部署

**方法 A - 重试部署（推荐）**：
1. 进入 **Deployments** 标签
2. 找到最新的部署（可能状态是 Failed 或 Success）
3. 点击该部署进入详情
4. 点击 **Retry deployment** 按钮

**方法 B - 自动触发**：
- 代码已经推送到 GitHub
- 应该会自动触发新的部署

### 第 3 步：验证构建日志

在新的部署中，您应该看到：

```
✅ 正确的构建流程：

1. Cloning repository...
2. Installing dependencies...
   npm install  ← 安装根目录依赖
3. Running build command...
   npm run build  ← 运行构建脚本
   cd functions && npm install  ← 安装 Functions 依赖
4. Found Functions directory...
5. Building Functions...
   ✓ Bundling Functions successfully  ← 应该成功
6. Deploying to Cloudflare...
   ✓ Deployment complete
```

**❌ 如果看到这个错误，说明还需要配置构建命令**：
```
No build command specified. Skipping build step.
✘ [ERROR] Could not resolve "@google/generative-ai"
```

---

## 📋 检查清单

完成以下每一项：

- [ ] ✅ `functions/package.json` 包含依赖（已完成）
- [ ] ✅ `package.json` 有 build 脚本（已完成）
- [ ] ⚠️ Cloudflare Build command 设置为 `npm run build`（**需要手动配置**）
- [ ] ⏳ 重新部署并等待构建完成
- [ ] ⏳ 验证 API 端点可访问
- [ ] ⏳ 测试 Chatbot 功能

---

## 🧪 测试 API 是否正常

构建成功后，在浏览器中测试以下 URL：

### 测试 FAQ 菜单 API
```
https://chatbot-service-9qg.pages.dev/api/goldenyears/faq-menu
```

**预期结果**：返回 JSON 数据
```json
{
  "categories": [...],
  "faqs": [...]
}
```

**❌ 错误结果**：返回 HTML（说明 Functions 还没部署）

### 测试聊天 API（使用 curl）
```bash
curl -X POST https://chatbot-service-9qg.pages.dev/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好",
    "sessionId": "test-123"
  }'
```

**预期结果**：返回 JSON 响应
```json
{
  "reply": "...",
  "suggestions": [...]
}
```

---

## 🎯 预期时间线

- **配置构建命令**: 1 分钟
- **触发重新部署**: 立即
- **等待构建完成**: 2-3 分钟
- **测试功能**: 1 分钟

**总计约 5 分钟**

---

## 💡 常见问题

### Q: 为什么 Functions 依赖不会自动安装？
**A**: Cloudflare Pages 默认**不运行构建命令**。您必须在项目设置中明确指定 `npm run build`。

### Q: 我已经设置了构建命令，为什么还是失败？
**A**: 检查：
1. 是否点击了 **Save** 保存配置
2. 是否触发了新的部署（旧部署不会使用新配置）
3. 查看构建日志确认 `npm run build` 是否执行

### Q: 503 错误还是存在怎么办？
**A**: 
1. 清除浏览器缓存
2. 等待 1-2 分钟（CDN 缓存）
3. 直接访问 API URL 测试
4. 检查 Cloudflare 项目状态

---

## 📞 需要帮助？

如果按照以上步骤操作后仍有问题，请提供：
1. 最新部署的构建日志（完整）
2. API 测试的响应内容
3. 浏览器控制台完整错误信息

---

**最后更新**: 2025-12-10  
**状态**: 等待配置构建命令并重新部署

