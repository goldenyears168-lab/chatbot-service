# 🐛 Chat API 500 错误深度调查

**问题**: POST /api/goldenyears/chat 返回 500 错误  
**状态**: 环境变量已配置，需要查看后端日志

---

## 📊 已知信息

✅ **已确认的正常项目**:
- GEMINI_API_KEY 已配置（截图显示 "Value encrypted"）
- FAQ 菜单 API 工作正常（200 OK）
- Widget 前端正常加载
- Cloudflare Pages 部署成功

❌ **问题**:
- Chat API 返回 500 Internal Server Error
- 错误响应时间极快（0.08秒）

---

## 🔍 可能的原因

### 原因 #1: 知识库文件加载失败 ⚡ 现在最可能

**症状**:
- 环境变量已配置
- FAQ API 正常（说明文件路径部分正常）
- Chat API 失败

**可能的问题**:
1. 知识库文件路径不正确
2. 某些知识库文件缺失或格式错误
3. ASSETS 绑定问题

**检查方法**:
```bash
# 查看 Cloudflare Pages 实时日志
wrangler pages deployment tail --project-name=chatbot-service

# 或在 Dashboard 查看
# https://dash.cloudflare.com/ → Pages → chatbot-service → Logs
```

---

### 原因 #2: Pipeline 执行错误

**可能的问题**:
1. Node 执行失败
2. LLM 服务初始化失败
3. Intent 提取失败
4. Context 管理失败

---

### 原因 #3: LLM API 配置问题

**可能的问题**:
1. API Key 格式不正确
2. Gemini API 端点变更
3. API 配额限制
4. 网络连接问题

---

## 🛠️ 调试步骤

### 步骤 1: 查看实时日志（最重要）

```bash
# 在终端运行
wrangler pages deployment tail --project-name=chatbot-service
```

**在另一个终端触发请求**:
```bash
curl -X POST https://chatbot-service-9qg.pages.dev/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://chatbot-service-9qg.pages.dev" \
  -d '{"message":"你好","mode":"auto","pageType":"demo"}'
```

**观察日志中的错误信息**，常见模式：

```
[Chat-goldenyears] Error: Knowledge base file not found: /knowledge/goldenyears/xxx.json
[Chat-goldenyears] Error: Failed to initialize LLM service
[Chat-goldenyears] Error: Invalid API key format
[Chat-goldenyears] Error: Pipeline node failed: xxx
[Chat-goldenyears] Error: Gemini API error: xxx
```

---

### 步骤 2: 检查知识库文件部署

**验证知识库文件是否正确部署**:

```bash
# 检查本地知识库文件
ls -la knowledge/goldenyears/

# 应该看到这些文件：
# - contact_info.json
# - emotion_templates.json
# - entity_patterns.json
# - faq_detailed.json
# - intent_config.json
# - intent_nba_mapping.json
# - personas.json
# - policies.json
# - response_templates.json
# - service_summaries.json
# - services.json
# - state_transitions.json
```

---

### 步骤 3: 测试 Gemini API Key

**手动测试 API Key 是否有效**:

```bash
# 使用你的 API Key 测试
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "你好"
      }]
    }]
  }'
```

如果这个测试失败，说明 API Key 有问题。

---

### 步骤 4: 检查 Cloudflare Pages 构建日志

访问 Cloudflare Dashboard:
1. https://dash.cloudflare.com/
2. Pages → chatbot-service
3. 点击最新的部署
4. 查看 "Build log"

**查找错误信息**:
- TypeScript 编译错误
- 文件打包错误
- 依赖安装失败

---

## 🎯 快速诊断命令

### 一键查看所有关键信息

```bash
# 检查知识库文件
echo "=== 知识库文件检查 ==="
ls -la knowledge/goldenyears/ | wc -l
echo "应该有 12+ 个文件"

# 检查 API 路由文件
echo -e "\n=== API 路由检查 ==="
ls -la functions/api/[company]/

# 检查最近的提交
echo -e "\n=== 最近的提交 ==="
git log --oneline -5

# 测试 FAQ API (正常的)
echo -e "\n=== FAQ API 测试 ==="
curl -s -w "\nHTTP: %{http_code}\n" \
  https://chatbot-service-9qg.pages.dev/api/goldenyears/faq-menu | head -20

# 测试 Chat API (有问题的)
echo -e "\n=== Chat API 测试 ==="
curl -s -w "\nHTTP: %{http_code}\n" \
  -X POST https://chatbot-service-9qg.pages.dev/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好","mode":"auto","pageType":"demo"}'
```

---

## 📋 常见问题和解决方案

### 问题 A: 知识库文件未部署

**症状**: 日志显示 "Knowledge base file not found"

**解决方法**:
```bash
# 1. 确认文件在 git 中
git ls-files knowledge/goldenyears/

# 2. 如果文件缺失，添加它们
git add knowledge/
git commit -m "add: ensure knowledge base files are included"
git push origin main
```

---

### 问题 B: ASSETS 绑定未配置

**症状**: 日志显示无法访问 ASSETS

**解决方法**:
在 Cloudflare Dashboard:
1. Pages → chatbot-service → Settings
2. Functions → Compatibility Flags
3. 确保 "Assets" 已启用

---

### 问题 C: API Key 格式错误

**症状**: 日志显示 "Invalid API key"

**解决方法**:
1. 重新生成 Gemini API Key
2. 确保没有额外的空格或换行
3. 重新设置环境变量:
```bash
wrangler pages secret put GEMINI_API_KEY --project-name=chatbot-service
```

---

### 问题 D: Pipeline 节点执行失败

**症状**: 日志显示具体的节点名称失败

**解决方法**:
查看对应的节点代码：
- `functions/api/nodes/` - Pipeline v2 节点
- `functions/api/nodes-v3/` - Pipeline v3 节点

检查是否有 TypeScript 错误或逻辑问题。

---

## 🔧 临时解决方案

### 方案 A: 添加更详细的日志

修改 `functions/api/[company]/chat.ts`，在关键位置添加日志：

```typescript
try {
  console.log('[Chat-DEBUG] Starting chat request for company:', companyId);
  
  // ... 现有代码 ...
  
  console.log('[Chat-DEBUG] Knowledge base loaded successfully');
  console.log('[Chat-DEBUG] LLM service initialized');
  console.log('[Chat-DEBUG] Starting pipeline execution');
  
  const response = await pipeline.execute(pipelineContext);
  
  console.log('[Chat-DEBUG] Pipeline execution completed');
  
  return response;
} catch (error) {
  console.error('[Chat-DEBUG] Detailed error:', error);
  console.error('[Chat-DEBUG] Error stack:', error.stack);
  console.error('[Chat-DEBUG] Error message:', error.message);
  // ... 错误处理 ...
}
```

然后重新部署并查看日志。

---

### 方案 B: 使用测试端点

创建一个简化的测试端点来隔离问题：

```typescript
// functions/api/test-chat.ts
export async function onRequestPost(context) {
  try {
    const { env } = context;
    
    // 测试 1: 环境变量
    const hasApiKey = !!env.GEMINI_API_KEY;
    
    // 测试 2: 知识库文件
    const kb = new KnowledgeBase('goldenyears');
    await kb.load('', env.ASSETS);
    const faq = kb.getFAQMenu();
    
    // 测试 3: LLM 初始化
    const llm = new LLMService(env.GEMINI_API_KEY);
    
    return new Response(JSON.stringify({
      success: true,
      tests: {
        apiKey: hasApiKey,
        knowledgeBase: faq.categories.length > 0,
        llmService: !!llm
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

---

## 📞 需要立即执行

### 最关键的命令

```bash
# 这个命令会显示真正的错误原因
wrangler pages deployment tail --project-name=chatbot-service
```

运行这个命令后：
1. 保持终端开启
2. 在浏览器中打开 Widget 并发送消息
3. 观察终端中显示的错误信息
4. 将错误信息发给我，我会帮你分析

---

## 🎯 预期的日志输出

### 正常的日志应该是：

```
[Chat-goldenyears] Received chat request
[Chat-goldenyears] Knowledge base loaded
[Chat-goldenyears] LLM service initialized
[Chat-goldenyears] Starting pipeline execution
[Chat-goldenyears] Intent extracted: xxx
[Chat-goldenyears] State transition: xxx -> xxx
[Chat-goldenyears] LLM response generated
[Chat-goldenyears] Request completed in 2500ms
```

### 错误的日志可能是：

```
[Chat-goldenyears] Received chat request
[Chat-goldenyears] Error: Cannot read property 'xxx' of undefined
[Chat-goldenyears] Error stack: ...
```

---

**下一步**: 请运行 `wrangler pages deployment tail` 并把看到的错误信息告诉我！

