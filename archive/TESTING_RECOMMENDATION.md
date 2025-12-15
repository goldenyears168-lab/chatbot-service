# 测试建议

## ⚠️ 发现的问题

多租户项目由于包含 `goldenyears/` 子目录导致文件过多，Wrangler 无法正常启动：
```
Error: EMFILE: too many open files, watch
```

## ✅ 推荐解决方案

### 方案 1: 测试 goldenyears 单租户版本（立即可行）

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
npm run dev
```

测试端点：
```bash
curl -X POST http://localhost:8788/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"message": "你好", "sessionId": "test-123"}'
```

### 方案 2: 清理目录后测试多租户

删除或移动 `goldenyears/` 目录以减少文件数：

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
mv goldenyears ../goldenyears-backup
npm run dev
```

### 方案 3: 直接部署到 Cloudflare Pages 测试

跳过本地测试，直接部署到 Cloudflare Pages：

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
npm run deploy
```

---

## 🎯 建议的测试流程

### 立即执行（5 分钟）

```bash
# 1. 进入 goldenyears 目录
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears

# 2. 启动开发服务器
npm run dev
```

在另一个终端测试：

```bash
# 测试 Chat API
curl -X POST http://localhost:8788/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"message": "你好", "sessionId": "test-123"}'

# 测试 FAQ Menu
curl http://localhost:8788/api/faq-menu \
  -H "Origin: http://localhost:8080"

# 测试 Widget 文件
curl http://localhost:8788/widget/loader.js
```

### 然后清理并测试多租户

一旦确认单租户版本正常工作：

```bash
# 1. 停止服务器（Ctrl+C）

# 2. 返回根目录并清理
cd /Users/jackm4/Documents/GitHub/chatbot-service
mv goldenyears ../goldenyears-backup

# 3. 启动多租户服务器
npm run dev
```

测试多租户：

```bash
curl -X POST http://localhost:8788/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"message": "你好", "sessionId": "test-123"}'
```

---

## 📝 总结

**当前状态**:
- ✅ 多租户代码已完成
- ✅ 所有引用问题已修复
- ⚠️ 本地测试受文件数限制

**推荐**:
1. 先测试 goldenyears 单租户版本（确认核心功能）
2. 清理目录后测试多租户
3. 或直接部署到 Cloudflare Pages

---

**下一步**: 请在终端执行：

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/goldenyears
npm run dev
```
