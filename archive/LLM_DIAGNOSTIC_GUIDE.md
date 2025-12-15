# 🔍 LLM 诊断指南

**问题**: Chat API 持续返回 500 错误  
**状态**: 正在诊断中  
**创建时间**: 2025-12-10

---

## 📊 已完成的修复

1. ✅ Widget FAQ 菜单路径（添加 companyId）
2. ✅ Gemini 模型名称（gemini-2.0-flash → gemini-1.5-flash）
3. ✅ 环境变量已配置（GEMINI_API_KEY）

但 Chat API 仍然返回 500 错误！

---

## 🔍 诊断步骤

### 步骤 1: 等待诊断端点部署（1-2 分钟）

我刚创建了一个诊断端点来测试 LLM 服务。

### 步骤 2: 访问诊断端点

等待 1-2 分钟后，在浏览器中访问：

```
https://chatbot-service-9qg.pages.dev/api/test-llm
```

或使用命令行：

```bash
curl https://chatbot-service-9qg.pages.dev/api/test-llm
```

### 步骤 3: 查看诊断结果

诊断端点会测试：

1. **环境变量检查**
   - GEMINI_API_KEY 是否存在
   - API Key 长度
   - API Key 预览（隐藏大部分内容）

2. **Gemini SDK 初始化**
   - GoogleGenerativeAI 是否正常初始化

3. **模型加载**
   - gemini-1.5-flash 模型是否可用

4. **API 调用测试**
   - 发送简单的 "你好" 测试
   - 查看返回结果

---

## 📋 可能的诊断结果

### 结果 A: API Key 问题

```json
{
  "environment": {
    "hasApiKey": false  // ❌ API Key 未设置
  }
}
```

**解决方法**: 重新设置环境变量

---

### 结果 B: API Key 格式错误

```json
{
  "gemini": {
    "initError": "Invalid API key"  // ❌ API Key 无效
  }
}
```

**解决方法**: 
1. 访问 https://makersuite.google.com/app/apikey
2. 重新生成 API Key
3. 确保复制完整且没有空格

---

### 结果 C: 模型不可用

```json
{
  "gemini": {
    "modelError": "Model not found: gemini-1.5-flash"  // ❌
  }
}
```

**解决方法**: 
- Gemini 1.5 Flash 可能在你的 API Key 上不可用
- 尝试使用 gemini-pro 模型

---

### 结果 D: API 调用失败

```json
{
  "gemini": {
    "apiCallSuccess": false,
    "apiError": "..."  // 具体错误信息
  }
}
```

**常见原因**:
1. API 配额用完
2. API Key 权限不足
3. 网络问题
4. Gemini API 服务故障

---

### 结果 E: 一切正常 ✅

```json
{
  "environment": {
    "hasApiKey": true,
    "apiKeyLength": 39
  },
  "gemini": {
    "initialized": true,
    "modelLoaded": true,
    "apiCallSuccess": true,
    "responsePreview": "你好！很高興為您服務..."
  }
}
```

**如果看到这个结果但 Chat API 仍然失败**:
- 可能是知识库加载问题
- 可能是 Pipeline 其他节点的问题

---

## 🔧 常见问题修复

### 问题 1: API Key 无效

**原因**: API Key 可能过期或复制不完整

**解决方法**:
```bash
# 1. 生成新的 API Key
# 访问: https://makersuite.google.com/app/apikey

# 2. 在 Cloudflare Dashboard 更新
# Pages → chatbot-service → Settings → Environment variables
# 编辑 GEMINI_API_KEY

# 3. 触发重新部署
# 保存后会自动重新部署
```

---

### 问题 2: Gemini 1.5 Flash 不可用

**原因**: 某些 API Key 可能不支持最新模型

**解决方法**: 修改为使用 gemini-pro

```typescript
// 修改 functions/api/lib/llm.ts
this.model = this.genAI.getGenerativeModel({ 
  model: 'gemini-pro'  // 使用旧版本
});
```

---

### 问题 3: API 配额用完

**症状**: 
```json
{
  "apiError": "Resource exhausted"
}
```

**解决方法**:
1. 等待配额重置（通常每天重置）
2. 或升级到付费计划
3. 或创建新的 API Key

---

### 问题 4: 网络连接问题

**症状**:
```json
{
  "apiError": "Failed to fetch"
}
```

**原因**: Cloudflare Workers 可能无法访问 Gemini API

**解决方法**:
- 检查 Cloudflare Workers 的网络设置
- 确认没有防火墙规则阻止

---

## 📞 下一步行动

### 立即执行（2 分钟后）

1. **访问诊断端点**
   ```
   https://chatbot-service-9qg.pages.dev/api/test-llm
   ```

2. **查看结果并截图**

3. **根据结果修复**:
   - 如果是 API Key 问题 → 重新配置
   - 如果是模型问题 → 切换到 gemini-pro
   - 如果是配额问题 → 等待或升级
   - 如果一切正常 → 查看知识库加载

---

## 🎯 预期时间线

```
现在（0分钟）: 诊断端点已推送，正在部署
+1 分钟: 诊断端点部署 50%
+2 分钟: 诊断端点完全可用 ✅
+3 分钟: 访问并查看诊断结果
+5 分钟: 根据结果实施修复
+8 分钟: 修复完成，系统恢复正常 🎉
```

---

## 📊 诊断端点详情

**URL**: `/api/test-llm`  
**方法**: GET  
**返回**: JSON 格式的测试结果  

**测试内容**:
1. 环境变量检查
2. Gemini SDK 初始化
3. 模型加载测试
4. 简单 API 调用测试

**优点**:
- 无需查看日志
- 直接在浏览器中查看
- 详细的错误信息
- 易于理解的 JSON 格式

---

**下一步**: 等待 2 分钟，然后访问诊断端点查看结果！

