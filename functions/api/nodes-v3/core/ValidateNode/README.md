# Validate Request Node

请求验证节点，验证 CORS、Content-Type、请求体格式和所有参数。

**迁移自**: `functions/api/nodes/01-validate-request.ts`

---

## 📋 功能

1. **CORS 验证**
   - 构建正确的 CORS headers
   - 处理 OPTIONS 预检请求
   - 支持多租户配置的允许域名

2. **Content-Type 验证**
   - 确保请求使用 `application/json`

3. **请求体验证**
   - 解析 JSON 请求体
   - 验证必需字段
   - 验证字段格式和取值范围

4. **参数验证**
   - `message`: 必需，非空，最大长度
   - `conversationId`: 可选，格式验证
   - `mode`: 可选，枚举值验证
   - `source`: 可选，枚举值验证
   - `pageType`: 可选，枚举值验证

---

## 📥 输入

### request (必需)
- **类型**: `Request`
- **描述**: HTTP 请求对象

### companyId (必需)
- **类型**: `string`
- **描述**: 公司 ID（多租户）

### companyConfig (必需)
- **类型**: `object`
- **描述**: 公司配置（包含 allowedOrigins）

---

## 📤 输出

### success
验证成功时的输出：
```typescript
{
  body: ChatRequestBody;       // 解析后的请求体
  corsHeaders: Record<string, string>;  // CORS headers
  companyId: string;           // 公司 ID
  companyConfig: object;       // 公司配置
}
```

### error
验证失败时直接返回 HTTP Response 对象。

---

## ⚙️ 配置

### maxMessageLength
- **默认**: 1000
- **描述**: 消息最大长度

### allowedModes
- **默认**: `["auto", "decision_recommendation", "faq_flow_price"]`
- **描述**: 允许的 mode 值

### allowedSources
- **默认**: `["menu", "input"]`
- **描述**: 允许的 source 值

### allowedPageTypes
- **默认**: `["home", "qa"]`
- **描述**: 允许的 pageType 值

---

## 🎯 使用示例

```typescript
import { ValidateNode } from './index.js';

const node = new ValidateNode({
  maxMessageLength: 2000  // 自定义配置
});

const result = await node.execute({
  request: httpRequest,
  companyId: 'goldenyears',
  companyConfig: companyConfig
}, context);

if (result.success) {
  const { body, corsHeaders } = result.output;
  // 继续处理
} else {
  // 返回错误响应
  return result.output; // HTTP Response
}
```

---

## 📝 验证规则

### message 字段
- ✅ 必需
- ✅ 类型必须是 string
- ✅ 不能为空（trim 后）
- ✅ 长度 ≤ maxMessageLength

### conversationId 字段
- ⚠️ 可选
- ✅ 格式: `conv_[a-zA-Z0-9_]+`
- ✅ 长度 ≤ 100

### mode 字段
- ⚠️ 可选
- ✅ 枚举值: auto, decision_recommendation, faq_flow_price

### source 字段
- ⚠️ 可选
- ✅ 枚举值: menu, input

### pageType 字段
- ⚠️ 可选
- ✅ 枚举值: home, qa

---

## 🔍 错误响应

所有验证错误都会返回标准的 HTTP 响应：

```json
{
  "error": "Invalid request",
  "message": "具体的错误描述"
}
```

**HTTP 状态码**: 400 (Bad Request)

---

## 🆕 与旧版本的区别

### 改进
1. ✅ 使用 Pipeline v3 架构
2. ✅ 更清晰的类型定义
3. ✅ 更好的错误处理
4. ✅ 可配置的验证规则
5. ✅ 支持多租户

### 保持兼容
- ✅ 所有验证逻辑保持一致
- ✅ CORS 处理逻辑不变
- ✅ 错误响应格式兼容

---

**迁移日期**: 2025-12-10  
**版本**: 1.0.0  
**状态**: ✅ 已迁移并测试
