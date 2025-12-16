# 本地测试指南

## ✅ 已修复的问题

1. **知识库加载**: 已修复 Edge Runtime 中无法读取文件系统的问题
2. **FAQ 菜单**: 知识库文件已复制到 `public` 目录，可通过 HTTP 访问
3. **AI 对话**: 系统提示词已包含知识库信息

## 🧪 测试步骤

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 测试 FAQ 菜单 API

```bash
curl http://localhost:3000/api/goldenyears/faq-menu
```

应该返回包含 categories 的 JSON 数据。

### 3. 测试 Chat API

```bash
curl -X POST http://localhost:3000/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，我想预约拍照", "sessionId": "test-123"}'
```

应该返回流式响应。

### 4. 测试页面

- **主页**: http://localhost:3000
- **Demo 页面**: http://localhost:3000/demo/goldenyears
- **Widget 页面**: http://localhost:3000/widget/chat?company=goldenyears

## 📋 知识库文件

知识库文件位于：
- **源文件**: `projects/goldenyears/knowledge/`
- **公共访问**: `public/projects/goldenyears/knowledge/`

### 文件列表

1. `1-services.json` - 服务信息
2. `2-company_info.json` - 公司信息
3. `3-ai_config.json` - AI 配置
4. `3-personas.json` - 角色设定
5. `4-response_templates.json` - 回复模板
6. `5-faq_detailed.json` - FAQ 详细数据

## 🔧 故障排查

### 问题 1: FAQ 菜单返回空

**检查**:
1. 确认 `public/projects/goldenyears/knowledge/5-faq_detailed.json` 存在
2. 访问 http://localhost:3000/projects/goldenyears/knowledge/5-faq_detailed.json 确认可访问
3. 检查浏览器控制台的错误信息

**解决**:
```bash
# 重新复制知识库文件
npm run copy:knowledge
```

### 问题 2: AI 对话没有使用知识库

**检查**:
1. 确认 GEMINI_API_KEY 已配置
2. 检查 API 路由日志，确认知识库已加载
3. 查看系统提示词是否包含知识库信息

### 问题 3: Widget 无法加载

**检查**:
1. 确认公司 ID 正确
2. 检查 CORS 设置
3. 查看浏览器控制台错误

## 📝 下一步

1. 配置真实的 GEMINI_API_KEY
2. 测试完整的对话流程
3. 验证知识库信息是否正确传递给 AI
4. 测试 FAQ 菜单显示

