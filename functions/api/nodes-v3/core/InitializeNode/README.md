# Initialize Services Node

服务初始化节点，验证所有必需的服务（知识库、LLM、上下文管理器）已正确初始化。

**迁移自**: `functions/api/nodes/02-initialize-services.ts`

---

## 📋 功能

1. **验证知识库**
   - 检查知识库实例存在
   - 验证知识库已加载数据
   - 警告空知识库

2. **验证 LLM 服务**
   - 检查 LLM 服务实例存在
   - 验证必需方法存在

3. **验证上下文管理器**
   - 检查上下文管理器实例存在
   - 验证必需方法存在

4. **设置全局引用**
   - 设置 responseTemplates 的知识库引用
   - 存储服务引用到执行上下文

---

## 📥 输入

### knowledgeBase (必需)
- **类型**: `KnowledgeBase`
- **描述**: 知识库实例

### llmService (必需)
- **类型**: `LLMService`
- **描述**: LLM 服务实例

### contextManager (必需)
- **类型**: `ContextManager`
- **描述**: 上下文管理器实例

### companyId (必需)
- **类型**: `string`
- **描述**: 公司 ID

---

## 📤 输出

### success
验证成功时的输出：
```typescript
{
  knowledgeBase: KnowledgeBase;
  llmService: LLMService;
  contextManager: ContextManager;
  companyId: string;
  initialized: true;
}
```

### error
验证失败时的错误信息。

---

## ⚙️ 配置

### validateKnowledgeBase
- **默认**: true
- **描述**: 是否验证知识库

### validateLLMService
- **默认**: true
- **描述**: 是否验证 LLM 服务

### validateContextManager
- **默认**: true
- **描述**: 是否验证上下文管理器

---

## 🎯 使用示例

```typescript
import { InitializeNode } from './index.js';

const node = new InitializeNode();

const result = await node.execute({
  knowledgeBase: kb,
  llmService: llm,
  contextManager: cm,
  companyId: 'goldenyears'
}, context);

if (result.success) {
  // 所有服务已验证
  console.log('Services initialized');
} else {
  // 有服务未初始化
  throw result.error;
}
```

---

## 🔍 验证流程

1. **知识库验证**
   - 检查实例存在
   - 调用 `getServices()` 验证数据已加载
   - 警告空知识库但不中断流程

2. **LLM 服务验证**
   - 检查实例存在
   - 验证 `generateResponse` 方法存在

3. **上下文管理器验证**
   - 检查实例存在
   - 验证 `getContext` 和 `updateContext` 方法存在

4. **设置全局引用**
   - 动态导入 `setKnowledgeBase` 函数
   - 设置 responseTemplates 的知识库引用
   - 失败时仅警告，不中断

5. **存储到上下文**
   - 将所有服务引用存储到执行上下文
   - 供后续节点使用

---

## ⚠️ 注意事项

1. **多租户架构**
   - 在多租户架构中，服务已在 `[company]/chat.ts` 中初始化
   - 此节点只负责验证，不负责创建服务

2. **非阻塞警告**
   - 空知识库：警告但继续
   - responseTemplates 设置失败：警告但继续

3. **阻塞错误**
   - 服务不存在：抛出错误
   - 必需方法缺失：抛出错误

---

## 🆕 与旧版本的区别

### 改进
1. ✅ 使用 Pipeline v3 架构
2. ✅ 更完整的服务验证
3. ✅ 更好的错误处理
4. ✅ 可配置的验证选项
5. ✅ 存储到执行上下文

### 保持兼容
- ✅ 验证逻辑保持一致
- ✅ responseTemplates 设置保持

---

**迁移日期**: 2025-12-10  
**版本**: 1.0.0  
**状态**: ✅ 已迁移并测试
