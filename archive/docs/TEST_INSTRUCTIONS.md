# 多租户 Chatbot Service 测试说明

## ✅ 准备工作完成

1. ✅ 依赖已安装
2. ✅ CSS 已编译
3. ✅ 多租户代码已修复

---

## 🧪 测试步骤

### 步骤 1: 启动开发服务器

在终端中执行：

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
npm run dev
```

服务器会在 `http://localhost:8788` 启动。

⚠️ **保持这个终端窗口打开**，不要关闭。

---

### 步骤 2: 测试 API（在新终端窗口）

打开**新的终端窗口**，执行以下测试：

#### 2.1 测试 goldenyears 公司的 Chat API

```bash
curl -X POST http://localhost:8788/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{
    "message": "你好",
    "sessionId": "test-123"
  }'
```

**预期结果**: 
- 返回 JSON 格式的回复
- 包含 `reply`, `intent`, `conversationId` 等字段

#### 2.2 测试 FAQ Menu API

```bash
curl http://localhost:8788/api/goldenyears/faq-menu \
  -H "Origin: http://localhost:8080"
```

**预期结果**:
- 返回 FAQ 菜单的 JSON 数据
- 包含各类常见问题

#### 2.3 测试 Widget 文件

```bash
# 测试 loader.js
curl http://localhost:8788/widget/loader.js

# 测试 widget.js
curl http://localhost:8788/widget/widget.js

# 测试 widget.css
curl http://localhost:8788/widget/widget.css
```

**预期结果**:
- 所有文件都能正常访问
- 返回对应的 JavaScript/CSS 代码

#### 2.4 测试知识库文件

```bash
curl http://localhost:8788/knowledge/goldenyears/services.json
```

**预期结果**:
- 返回服务信息的 JSON 数据

#### 2.5 测试公司配置

```bash
curl http://localhost:8788/knowledge/companies.json
```

**预期结果**:
- 返回公司配置的 JSON 数据
- 包含 goldenyears 公司的配置

---

### 步骤 3: 测试不存在的公司

```bash
curl -X POST http://localhost:8788/api/nonexistent/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"message": "你好", "sessionId": "test-123"}'
```

**预期结果**:
- 返回 404 错误
- 错误信息: "Company not found"

---

### 步骤 4: 测试 CORS

```bash
# 测试不允许的 Origin
curl -X POST http://localhost:8788/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://evil-site.com" \
  -d '{"message": "你好", "sessionId": "test-123"}'
```

**预期结果**:
- 返回 403 错误
- 错误信息: "CORS not allowed"

---

## 🌐 测试 Widget 在浏览器中

### 步骤 1: 创建测试 HTML 文件

创建文件 `test-widget.html`:

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>多租户 Widget 测试</title>
</head>
<body>
    <h1>多租户 Chatbot Widget 测试</h1>
    <p>打开浏览器控制台查看加载信息</p>
    
    <!-- 多租户 Widget -->
    <script 
      src="http://localhost:8788/widget/loader.js" 
      data-company="goldenyears"
      data-api-endpoint="http://localhost:8788/api/goldenyears/chat"
      data-api-base-url="http://localhost:8788"
      data-page-type="embed"
      defer
    ></script>
</body>
</html>
```

### 步骤 2: 在浏览器中打开

1. 用浏览器打开 `test-widget.html`
2. 打开开发者工具（F12）
3. 查看 Console 标签

**预期结果**:
- 看到 `[GYChatbot] Initializing for company: goldenyears`
- 看到 `[GYChatbot] Widget initialized successfully for goldenyears`
- Widget 图标显示在页面右下角

### 步骤 3: 测试 Widget 功能

1. 点击 Widget 图标
2. 输入 "你好" 并发送
3. 查看是否收到回复

---

## ✅ 测试检查清单

### API 测试
- [ ] goldenyears chat API 正常工作
- [ ] goldenyears FAQ menu 正常工作
- [ ] Widget 文件可访问（loader.js, widget.js, widget.css）
- [ ] 知识库文件可访问
- [ ] 公司配置文件可访问
- [ ] 不存在的公司返回 404
- [ ] 不允许的 Origin 返回 403

### Widget 测试
- [ ] Widget 在浏览器中加载成功
- [ ] Widget 图标显示正常
- [ ] Widget 可以打开/关闭
- [ ] 可以发送消息
- [ ] 可以收到 AI 回复
- [ ] FAQ 菜单正常显示

### 多租户测试
- [ ] 公司 ID 从 URL 参数正确识别
- [ ] 知识库按公司加载
- [ ] CORS 按公司配置验证

---

## 🐛 常见问题

### 问题 1: 服务器启动失败

**错误**: `Cannot find module ...`

**解决**:
```bash
npm install
```

### 问题 2: CSS 文件找不到

**错误**: `widget.css not found`

**解决**:
```bash
npm run build:css
```

### 问题 3: API 返回 500 错误

**检查**:
1. 控制台日志
2. 知识库文件是否存在
3. 公司配置是否正确

### 问题 4: Widget 无法加载

**检查**:
1. 浏览器控制台错误
2. 网络标签查看请求状态
3. CORS 配置

---

## 📝 测试报告模板

测试完成后，记录结果：

```
测试日期: ___________
测试人员: ___________

API 测试结果:
- goldenyears chat API: [ ] 通过 [ ] 失败
- goldenyears FAQ menu: [ ] 通过 [ ] 失败
- Widget 文件访问: [ ] 通过 [ ] 失败
- 公司不存在处理: [ ] 通过 [ ] 失败
- CORS 验证: [ ] 通过 [ ] 失败

Widget 测试结果:
- Widget 加载: [ ] 通过 [ ] 失败
- 发送消息: [ ] 通过 [ ] 失败
- 接收回复: [ ] 通过 [ ] 失败
- FAQ 菜单: [ ] 通过 [ ] 失败

多租户测试结果:
- 公司 ID 识别: [ ] 通过 [ ] 失败
- 知识库隔离: [ ] 通过 [ ] 失败
- 配置隔离: [ ] 通过 [ ] 失败

问题记录:
_______________________________
_______________________________
_______________________________
```

---

**准备开始测试！** 🚀
