# E2E Tests

端到端测试套件，模拟真实用户场景。

---

## 📋 测试覆盖

### 1. 基础对话流程 ✅
- 问候消息处理
- 服务咨询
- 价格查询
- 预约咨询

### 2. FAQ 流程 ✅
- 获取 FAQ 菜单
- 处理 FAQ 问题
- FAQ 答案验证

### 3. 上下文管理 ✅
- 跨消息上下文保持
- 追问处理
- 会话连续性

### 4. 错误处理 ✅
- 空消息
- 超长消息
- 无效会话 ID

### 5. 性能测试 ✅
- 响应时间（< 10 秒）
- 并发请求处理
- 负载测试

### 6. 多租户隔离 ✅
- 公司数据隔离
- 配置隔离

### 7. CORS 和安全性 ✅
- CORS 预检请求
- 未授权来源拒绝
- 安全头验证

### 8. 数据持久化 ✅
- 会话数据保存
- 消息历史
- 用户追踪

### 9. 特殊意图 ✅
- 联系请求
- 作品查看
- 告别消息

### 10. Widget 集成 ✅
- Widget 脚本加载
- 样式文件加载
- 配置验证

### 11. API 端点 ✅
- 主页访问
- Demo 页面访问
- API 响应验证

---

## 🚀 运行测试

### 前提条件

```bash
# 安装依赖
npm install --save-dev @jest/globals

# 确保本地服务运行
npm run dev
```

### 运行所有 E2E 测试

```bash
# 使用默认配置（localhost:8788）
npm run test:e2e

# 指定测试环境
TEST_BASE_URL=https://chatbot-service-9qg.pages.dev npm run test:e2e

# 运行特定测试文件
npm test tests/e2e/chatbot-flow.test.ts
```

### 测试配置

在 `package.json` 中：

```json
{
  "scripts": {
    "test:e2e": "jest tests/e2e --runInBand",
    "test:e2e:staging": "TEST_BASE_URL=https://staging.chatbot-service.pages.dev npm run test:e2e",
    "test:e2e:prod": "TEST_BASE_URL=https://chatbot-service-9qg.pages.dev npm run test:e2e"
  }
}
```

---

## 📊 测试结果示例

```
E2E: Complete Chatbot Flow
  1. 基础对话流程
    ✓ should handle greeting message (2345ms)
    ✓ should handle service inquiry (3456ms)
    ✓ should handle pricing question (2987ms)
    ✓ should handle booking inquiry (3123ms)
    
  2. FAQ 流程
    ✓ should get FAQ menu (456ms)
    ✓ should handle FAQ question (2789ms)
    
  3. 上下文管理
    ✓ should maintain conversation context (4567ms)
    ✓ should handle follow-up questions (3890ms)
    
  4. 错误处理
    ✓ should handle empty message (234ms)
    ✓ should handle very long message (345ms)
    ✓ should handle invalid conversation ID (2456ms)
    
  5. 性能测试
    ✓ should respond within acceptable time (3456ms)
    ✓ should handle concurrent requests (8765ms)
    
  6. 多租户隔离
    ✓ should isolate different companies (2345ms)
    
  7. CORS 和安全性
    ✓ should handle CORS correctly (234ms)
    ✓ should reject unauthorized origins (345ms)
    
  8. 数据持久化
    ✓ should persist conversation data (5678ms)
    
  9. 特殊意图处理
    ✓ should handle contact request (2890ms)
    ✓ should handle portfolio request (2789ms)
    ✓ should handle goodbye (2345ms)

E2E: Widget Integration
  ✓ should load widget script (456ms)
  ✓ should load widget styles (345ms)

E2E: API Endpoints
  ✓ should access main page (234ms)
  ✓ should access demo page (345ms)

Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
Time:        75.234s
```

---

## 🔧 自定义测试

### 添加新测试场景

```typescript
describe('My Custom E2E Test', () => {
  it('should do something', async () => {
    const conversationId = generateConversationId();
    
    const response = await sendChatMessage(
      conversationId,
      '我的測試消息'
    );

    expect(response).toBeDefined();
    expect(response.reply).toContain('預期內容');
  });
});
```

### 测试不同公司

```typescript
const TEST_COMPANIES = ['goldenyears', 'company2', 'company3'];

TEST_COMPANIES.forEach(companyId => {
  describe(`E2E: ${companyId}`, () => {
    it('should work for this company', async () => {
      const response = await fetch(
        `${TEST_CONFIG.baseUrl}/api/${companyId}/chat`,
        { /* ... */ }
      );
      
      expect(response.ok).toBe(true);
    });
  });
});
```

---

## 🎯 最佳实践

### 1. 独立的会话 ID
每个测试用例使用独立的会话 ID，避免测试间干扰。

```typescript
it('my test', async () => {
  const conversationId = generateConversationId();
  // 使用这个唯一的 ID
});
```

### 2. 合理的超时时间
考虑网络延迟和 LLM 处理时间：

```typescript
it('slow operation', async () => {
  // ...
}, 30000); // 30 秒超时
```

### 3. 清理测试数据
在 `afterAll` 中清理测试创建的数据：

```typescript
afterAll(async () => {
  // 清理测试会话
  await cleanupTestData();
});
```

### 4. 环境变量
使用环境变量配置不同环境：

```bash
# 本地测试
TEST_BASE_URL=http://localhost:8788 npm run test:e2e

# Staging 测试
TEST_BASE_URL=https://staging.example.com npm run test:e2e

# 生产测试（谨慎！）
TEST_BASE_URL=https://prod.example.com npm run test:e2e
```

---

## 📈 与 hoashiflow 的对比

| 功能 | hoashiflow | chatbot-service | 优势 |
|------|------------|-----------------|------|
| E2E 测试 | ✅ | ✅ | 持平 |
| 测试覆盖 | 基础流程 | 完整流程 | chatbot |
| 并发测试 | ❌ | ✅ | chatbot |
| 性能测试 | ❌ | ✅ | chatbot |
| CORS 测试 | ❌ | ✅ | chatbot |
| 多租户测试 | ❌ | ✅ | chatbot |

---

## 🚨 注意事项

1. **不要在生产环境频繁运行 E2E 测试**
   - 会产生真实的 API 调用和 LLM 成本
   - 可能影响真实用户

2. **使用测试专用的公司 ID**
   - 避免污染生产数据

3. **监控测试成本**
   - E2E 测试会调用 Gemini API
   - 设置合理的测试频率

---

## 📚 相关文档

- [Unit Tests](../api/pipeline-v3/test/)
- [Integration Tests](../api/pipeline-v3/test/integration/)
- [Jest Documentation](https://jestjs.io/)
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/testing/)

---

**状态**: ✅ E2E 测试套件完成  
**测试用例数**: 24  
**覆盖场景**: 11 种
