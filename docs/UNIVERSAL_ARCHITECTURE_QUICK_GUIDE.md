# 通用知识库架构快速使用指南

## 🎯 核心答案

**是的，可以用同一个架构！** 只需要通过配置文件切换模式即可。

---

## 📋 三种使用模式

### 模式 1：对外客服机器人（当前 goldenyears）

**配置文件：`0-config.json`**
```json
{
  "mode": "customer_service",
  "enabled_modules": {
    "services": true,        // ✅ 使用服务列表
    "personas": true,        // ✅ 使用客户画像
    "response_templates": true,  // ✅ 使用回复模板
    "faq": true,            // ✅ 使用 FAQ
    "knowledge_base": false // ❌ 不使用知识库
  }
}
```

**使用的文件：**
- ✅ `1-services.json`
- ✅ `2-company_info.json`
- ✅ `3-ai_config.json`
- ✅ `3-personas.json`
- ✅ `4-response_templates.json`
- ✅ `5-faq_detailed.json`
- ❌ `6-knowledge_base.json`（不使用）

---

### 模式 2：对内解惑顾问

**配置文件：`0-config.json`**
```json
{
  "mode": "internal_advisor",
  "enabled_modules": {
    "services": false,       // ❌ 不需要服务列表
    "personas": false,       // ❌ 不需要客户画像
    "response_templates": false, // ❌ 不需要回复模板
    "faq": true,            // ✅ 可选：常见问题
    "knowledge_base": true  // ✅ 主要知识源
  }
}
```

**使用的文件：**
- ❌ `1-services.json`（不使用）
- ✅ `2-company_info.json`（改为组织信息）
- ✅ `3-ai_config.json`
- ❌ `3-personas.json`（不使用）
- ❌ `4-response_templates.json`（不使用）
- ✅ `5-faq_detailed.json`（可选）
- ✅ `6-knowledge_base.json`（主要知识源）

**知识库内容示例：**
```json
{
  "articles": [
    {
      "id": "article_001",
      "title": "如何申请年假",
      "content": "申请年假的流程...",
      "tags": ["年假", "请假", "HR"]
    }
  ],
  "procedures": [
    {
      "id": "proc_001",
      "title": "新员工入职流程",
      "steps": [...]
    }
  ],
  "policies": [
    {
      "id": "policy_001",
      "title": "远程办公政策",
      "content": "..."
    }
  ]
}
```

---

### 模式 3：混合模式

**配置文件：`0-config.json`**
```json
{
  "mode": "hybrid",
  "enabled_modules": {
    "services": true,
    "personas": true,
    "response_templates": true,
    "faq": true,
    "knowledge_base": true  // ✅ 同时使用知识库
  }
}
```

**使用的文件：**
- ✅ 所有文件都使用

---

## 🔄 FAQ vs 知识库的区别

### FAQ（预定义QA）

**特点：**
- ✅ 问题和答案都是预定义的
- ✅ 回答质量高（人工编写）
- ✅ 适合常见、标准的问题
- ⚠️ 需要预先准备所有问题和答案

**使用场景：**
- 对外客服：常见客户问题
- 对内顾问：常见员工问题

**示例：**
```json
{
  "question": "如何申请年假？",
  "answer": "申请年假的流程如下：1. 登录 HR 系统..."
}
```

---

### 知识库（动态检索）

**特点：**
- ✅ 只需添加知识内容，不需要预定义问题
- ✅ AI 从知识库中检索相关内容生成回答
- ✅ 适合复杂、多变的问题
- ⚠️ 回答质量取决于知识库内容和 AI 能力

**使用场景：**
- 对内顾问：各种内部问题
- 复杂查询：需要组合多个知识点的回答

**示例：**
```json
{
  "articles": [
    {
      "title": "年假政策",
      "content": "年假可以累积，最多累积 20 天..."
    }
  ]
}
```

**用户问："年假可以累积吗？"**
→ AI 检索知识库 → 找到相关文章 → 生成回答："根据公司政策，年假可以累积，最多累积 20 天..."

---

## 💡 推荐使用方式

### 对外客服机器人

**推荐：FAQ + 服务列表 + 回复模板**

- ✅ 使用 `5-faq_detailed.json` 存储常见问题
- ✅ 使用 `1-services.json` 存储服务/产品信息
- ✅ 使用 `4-response_templates.json` 确保回复一致性
- ❌ 不需要 `6-knowledge_base.json`（除非有复杂知识需要检索）

---

### 对内解惑顾问

**推荐：知识库 + FAQ（可选）**

- ✅ 使用 `6-knowledge_base.json` 存储知识内容（文章、流程、政策）
- ✅ 可选：使用 `5-faq_detailed.json` 存储常见问题（作为快速参考）
- ❌ 不需要 `1-services.json`、`3-personas.json`、`4-response_templates.json`

**工作方式：**
1. 用户提问："如何申请年假？"
2. 系统在知识库中检索相关内容
3. AI 基于检索到的内容生成回答
4. 如果没有匹配，可以提示用户查看 FAQ 或联系 HR

---

## 🎯 实施步骤

### 步骤 1：创建配置文件

在 `knowledge/` 目录下创建 `0-config.json`：

**对外客服：**
```json
{
  "mode": "customer_service",
  "enabled_modules": {
    "services": true,
    "personas": true,
    "response_templates": true,
    "faq": true,
    "knowledge_base": false
  }
}
```

**对内顾问：**
```json
{
  "mode": "internal_advisor",
  "enabled_modules": {
    "services": false,
    "personas": false,
    "response_templates": false,
    "faq": true,
    "knowledge_base": true
  }
}
```

---

### 步骤 2：准备知识库内容（对内顾问）

在 `6-knowledge_base.json` 中添加：

```json
{
  "articles": [
    {
      "id": "article_001",
      "title": "如何申请年假",
      "category": "hr",
      "content": "申请年假的详细流程...",
      "tags": ["年假", "请假", "HR"]
    }
  ],
  "procedures": [
    {
      "id": "proc_001",
      "title": "新员工入职流程",
      "steps": [...]
    }
  ],
  "policies": [
    {
      "id": "policy_001",
      "title": "远程办公政策",
      "content": "..."
    }
  ]
}
```

---

### 步骤 3：代码自动适配

代码已经支持配置驱动，会自动：
- ✅ 根据配置文件加载相应文件
- ✅ 如果没有配置文件，使用默认配置（向后兼容）
- ✅ 提供知识库检索方法

---

## 📊 对比总结

| 特性 | 对外客服 | 对内顾问 | 混合模式 |
|------|---------|---------|---------|
| **主要知识源** | FAQ | 知识库 | FAQ + 知识库 |
| **服务列表** | ✅ 必需 | ❌ 不需要 | ✅ 可选 |
| **客户画像** | ✅ 有用 | ❌ 不需要 | ✅ 可选 |
| **回复模板** | ✅ 有用 | ❌ 不需要 | ✅ 可选 |
| **FAQ** | ✅ 必需 | ⚠️ 可选 | ✅ 有用 |
| **知识库** | ❌ 不需要 | ✅ 必需 | ✅ 有用 |
| **回答方式** | 预定义答案 | 动态检索生成 | 两者结合 |

---

## 🎯 结论

**当前架构已经是通用的！**

只需要：
1. ✅ **通过配置文件切换模式**（`0-config.json`）
2. ✅ **对内顾问使用 `6-knowledge_base.json`** 存储知识内容
3. ✅ **代码自动适配**，无需修改

**FAQ vs 知识库：**
- **FAQ**：适合常见、标准的问题（预定义QA）
- **知识库**：适合复杂、多变的问题（动态检索）

**最佳实践：**
- 两者可以结合使用
- FAQ 优先（如果匹配到）
- 知识库作为补充（如果 FAQ 没有匹配）

---

## 📚 相关文档

- `docs/UNIVERSAL_KNOWLEDGE_ARCHITECTURE.md` - 详细架构设计
- `docs/INTERNAL_ADVISOR_EXAMPLE.md` - 对内顾问示例
- `companies/goldenyears/knowledge/0-config.json` - 配置文件示例
- `companies/goldenyears/knowledge/6-knowledge_base.json` - 知识库模板
