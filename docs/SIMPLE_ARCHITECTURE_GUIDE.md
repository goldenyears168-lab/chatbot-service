# 简化架构规划指南

## 🎯 核心思路

**不要通用架构，分别规划！**

- **对外客服机器人**：使用当前架构（6个文件）
- **对内解惑顾问**：使用简化架构（3-4个文件）

---

## 📁 对内解惑顾问的简化架构

### 文件结构（3-4个文件）

```
knowledge/
├── 1-company_info.json      # 组织信息
├── 2-ai_config.json         # AI 配置（简化版）
└── 3-knowledge_base.json    # 知识库内容（核心）
```

**可选：**
- `4-faq.json` - 常见问题（如果觉得知识库检索不够，可以加）

---

## 📋 文件详细说明

### 1. `1-company_info.json` - 组织信息

**用途：** 存储组织基本信息、部门、联系方式

**简化内容：**
```json
{
  "organization_name": "公司名称",
  "departments": [
    {
      "id": "hr",
      "name": "人力资源部",
      "contact": "hr@company.com"
    }
  ],
  "contact_channels": {
    "email": "info@company.com",
    "phone": "02-1234-5678"
  }
}
```

**不需要：**
- ❌ 分店信息（对内不需要）
- ❌ 营业时间（对内不需要）
- ❌ 停车信息（对内不需要）

---

### 2. `2-ai_config.json` - AI 配置（简化版）

**用途：** 定义意图识别和实体提取

**简化内容：**
```json
{
  "intents": [
    {
      "id": "policy_inquiry",
      "keywords": ["政策", "规定", "制度"]
    },
    {
      "id": "procedure_inquiry",
      "keywords": ["流程", "步骤", "如何"]
    },
    {
      "id": "information_inquiry",
      "keywords": ["查询", "了解", "知道"]
    }
  ],
  "entity_patterns": {
    "department": [
      { "id": "hr", "keywords": ["HR", "人资"] }
    ],
    "category": [
      { "id": "leave", "keywords": ["请假", "年假"] }
    ]
  }
}
```

**简化：**
- ❌ 不需要复杂的优先级
- ❌ 不需要 `excludeKeywords`、`contextKeywords`
- ❌ 不需要客户画像实体
- ✅ 只需要基本的意图和部门/类别实体

---

### 3. `3-knowledge_base.json` - 知识库内容（核心）

**用途：** 存储所有知识内容，AI 从这里检索回答

**这是最重要的文件！**

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
      "steps": [
        {
          "step": 1,
          "title": "准备材料",
          "description": "准备身份证、学历证明等"
        }
      ],
      "tags": ["入职", "流程"]
    }
  ],
  "policies": [
    {
      "id": "policy_001",
      "title": "远程办公政策",
      "content": "远程办公政策内容...",
      "tags": ["远程办公", "政策"]
    }
  ]
}
```

**工作方式：**
1. 用户问："如何申请年假？"
2. 系统在 `3-knowledge_base.json` 中搜索
3. 找到 `article_001`
4. AI 基于内容生成回答

---

### 4. `4-faq.json` - 常见问题（可选）

**用途：** 快速回答常见问题

**简化版：**
```json
{
  "faqs": [
    {
      "id": "faq_001",
      "question": "年假可以累积吗？",
      "answer": "可以，最多累积 20 天",
      "tags": ["年假"]
    }
  ]
}
```

**注意：** 这个文件是可选的。如果知识库内容足够详细，可以不用 FAQ。

---

## 🔄 工作流程

### 用户提问 → AI 回答

1. **用户问：** "如何申请年假？"
2. **意图识别：** `procedure_inquiry`（流程查询）
3. **知识库检索：** 在 `3-knowledge_base.json` 中搜索"年假"、"申请"
4. **找到内容：** `article_001`（如何申请年假）
5. **AI 生成回答：** 基于检索到的内容生成自然语言回答

---

## 📊 对比：对外客服 vs 对内顾问

| 特性 | 对外客服（goldenyears） | 对内顾问（简化） |
|------|----------------------|----------------|
| **文件数量** | 6 个 | 3-4 个 |
| **服务列表** | ✅ 必需 | ❌ 不需要 |
| **客户画像** | ✅ 有用 | ❌ 不需要 |
| **回复模板** | ✅ 有用 | ❌ 不需要 |
| **FAQ** | ✅ 必需 | ⚠️ 可选 |
| **知识库** | ❌ 不需要 | ✅ 核心 |
| **复杂度** | ⭐⭐⭐ | ⭐⭐ |

---

## 🎯 实施建议

### 方案：创建新的项目目录

**结构：**
```
projects/internal-advisor/
├── config.json
└── knowledge/
    ├── 1-company_info.json
    ├── 2-ai_config.json
    └── 3-knowledge_base.json
```

**优点：**
- ✅ 结构清晰，不混淆
- ✅ 可以独立优化
- ✅ 不影响现有的对外客服架构

---

## 💡 关键点

### 对内解惑顾问的核心

**只需要一个核心文件：`3-knowledge_base.json`**

- 所有知识内容都在这里
- AI 从这里检索并生成回答
- 不需要预定义 QA，只需要添加知识内容

**工作方式：**
- 用户提问
- 系统检索知识库
- AI 基于检索到的内容生成回答

**简单、直接、易维护！**

---

## 📝 总结

**对内解惑顾问的简化架构：**

```
knowledge/
├── 1-company_info.json      # 组织信息
├── 2-ai_config.json         # AI 配置（简化）
└── 3-knowledge_base.json    # 知识库（核心）
```

**总共 3 个文件，简单明了！**

**核心思想：**
- 所有知识内容放在 `3-knowledge_base.json`
- AI 从这里检索并生成回答
- 不需要预定义 QA，只需要添加知识内容
