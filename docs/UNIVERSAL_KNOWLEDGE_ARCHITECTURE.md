# 通用知识库架构设计

## 🎯 设计目标

设计一个**适用于各行各业、对内对外通用**的知识库架构，支持：
- ✅ 对外客服机器人（如：好時有影）
- ✅ 对内解惑顾问（如：企业内部知识库）
- ✅ 混合场景（既有客服又有知识库）
- ✅ 不同行业（电商、SaaS、医疗、教育等）

---

## 📊 当前架构分析

### 当前架构（对外客服导向）

```
knowledge/
├── 1-services.json              # 服务列表（对外客服专用）
├── 2-company_info.json         # 公司信息（通用）
├── 3-ai_config.json            # AI 配置（通用）
├── 3-personas.json             # 客户画像（对外客服专用）
├── 4-response_templates.json   # 回复模板（对外客服专用）
└── 5-faq_detailed.json         # FAQ（对外客服专用）
```

### 问题分析

| 组件 | 对外客服 | 对内顾问 | 通用性 |
|------|---------|---------|--------|
| `services.json` | ✅ 必需 | ❌ 不需要 | ⭐ 低 |
| `personas.json` | ✅ 有用 | ❌ 不需要 | ⭐ 低 |
| `response_templates.json` | ✅ 有用 | ⚠️ 可选 | ⭐⭐ 中 |
| `faq_detailed.json` | ✅ 必需 | ⚠️ 可选 | ⭐⭐ 中 |
| `company_info.json` | ✅ 必需 | ✅ 必需 | ⭐⭐⭐⭐⭐ 高 |
| `ai_config.json` | ✅ 必需 | ✅ 必需 | ⭐⭐⭐⭐⭐ 高 |

---

## 🏗️ 通用架构设计

### 核心设计理念

1. **模块化**：每个组件都是可选的
2. **分层设计**：核心层 + 扩展层
3. **灵活配置**：通过配置文件控制使用哪些组件
4. **支持多种知识源**：结构化数据 + 非结构化文档

---

## 📁 新的通用文件结构

```
knowledge/
├── 0-config.json                # 知识库配置（定义使用哪些模块）
├── 1-core/                      # 核心模块（必需）
│   ├── company_info.json       # 公司/组织信息
│   └── ai_config.json          # AI 配置（意图、实体）
│
├── 2-customer-service/          # 对外客服模块（可选）
│   ├── services.json           # 服务/产品列表
│   ├── personas.json           # 客户画像
│   ├── response_templates.json # 回复模板
│   └── faq_detailed.json       # FAQ
│
├── 3-knowledge-base/            # 知识库模块（可选）
│   ├── documents.json          # 文档索引（指向实际文档）
│   ├── articles.json           # 文章/知识条目
│   ├── procedures.json         # 流程/步骤
│   └── policies.json           # 政策/规范
│
└── 4-custom/                    # 自定义模块（可选）
    └── [自定义文件]
```

---

## 🔧 方案 A：保持当前结构 + 配置驱动（推荐）

**优点：** 最小改动，向后兼容

### 文件结构（保持当前）

```
knowledge/
├── 1-services.json              # 可选：服务/产品列表
├── 2-company_info.json         # 必需：公司信息
├── 3-ai_config.json            # 必需：AI 配置
├── 3-personas.json             # 可选：客户画像
├── 4-response_templates.json   # 可选：回复模板
├── 5-faq_detailed.json         # 可选：FAQ
└── 6-knowledge_base.json       # 新增：知识库内容（文档、文章、流程）
```

### 配置文件：`0-config.json`

```json
{
  "_file_description": "知识库配置文件：定义使用哪些模块，适配不同场景",
  "version": "1.0.0",
  "mode": "customer_service",
  "_mode_description": {
    "customer_service": "对外客服模式：使用服务列表、客户画像、FAQ等",
    "internal_advisor": "对内顾问模式：使用知识库、文档、流程等",
    "hybrid": "混合模式：同时支持客服和知识库"
  },
  "enabled_modules": {
    "services": true,
    "personas": true,
    "response_templates": true,
    "faq": true,
    "knowledge_base": false
  },
  "_module_description": {
    "services": "服务/产品列表（对外客服必需）",
    "personas": "客户画像（对外客服有用）",
    "response_templates": "回复模板（对外客服有用）",
    "faq": "FAQ（对外客服或对内顾问都可用）",
    "knowledge_base": "知识库（对内顾问必需，对外客服可选）"
  }
}
```

---

## 🔧 方案 B：新增知识库模块（推荐用于对内顾问）

### 新增文件：`6-knowledge_base.json`

```json
{
  "_file_description": "知识库文件：包含文档、文章、流程、政策等非结构化知识内容。用于 RAG（检索增强生成），AI 可以从这些内容中检索相关信息回答用户问题。",
  "version": "1.0.0",
  "last_updated": "2025-01-20",
  "data_source": "knowledge/knowledge_base.json",
  "_section_documents": "文档索引：指向实际文档文件（如 PDF、Markdown、Word 等）",
  "documents": [
    {
      "id": "doc_001",
      "title": "员工手册",
      "type": "handbook",
      "file_path": "documents/employee-handbook.pdf",
      "summary": "公司员工手册，包含入职流程、福利政策、行为规范等",
      "tags": ["入职", "福利", "规范"],
      "last_updated": "2025-01-01"
    }
  ],
  "_section_articles": "文章/知识条目：结构化的知识内容",
  "articles": [
    {
      "id": "article_001",
      "title": "如何申请年假",
      "category": "hr",
      "content": "申请年假的流程如下：\n1. 登录 HR 系统\n2. 选择「请假申请」\n3. 填写请假日期和原因\n4. 提交给直属主管审批\n5. 审批通过后系统会自动记录",
      "tags": ["年假", "请假", "HR"],
      "related_articles": ["article_002"],
      "last_updated": "2025-01-15"
    }
  ],
  "_section_procedures": "流程/步骤：标准操作流程",
  "procedures": [
    {
      "id": "proc_001",
      "title": "新员工入职流程",
      "category": "onboarding",
      "steps": [
        {
          "step": 1,
          "title": "准备入职材料",
          "description": "准备身份证、学历证明、体检报告等",
          "responsible": "HR",
          "duration": "1天"
        },
        {
          "step": 2,
          "title": "填写入职表格",
          "description": "在线填写个人信息、紧急联系人等",
          "responsible": "新员工",
          "duration": "30分钟"
        }
      ],
      "tags": ["入职", "流程"],
      "last_updated": "2025-01-10"
    }
  ],
  "_section_policies": "政策/规范：公司政策、规定等",
  "policies": [
    {
      "id": "policy_001",
      "title": "远程办公政策",
      "category": "workplace",
      "content": "公司支持远程办公，具体要求如下：\n1. 每周至少到办公室 2 天\n2. 远程办公需要提前申请\n3. 必须保证工作时间和效率\n4. 需要定期参加团队会议",
      "tags": ["远程办公", "政策"],
      "effective_date": "2025-01-01",
      "last_updated": "2025-01-01"
    }
  ]
}
```

---

## 🎯 使用场景适配

### 场景 1：对外客服机器人（如：好時有影）

**配置文件：**
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

**使用的文件：**
- ✅ `1-services.json`
- ✅ `2-company_info.json`
- ✅ `3-ai_config.json`
- ✅ `3-personas.json`
- ✅ `4-response_templates.json`
- ✅ `5-faq_detailed.json`
- ❌ `6-knowledge_base.json`（不使用）

---

### 场景 2：对内解惑顾问（如：企业内部知识库）

**配置文件：**
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

**使用的文件：**
- ❌ `1-services.json`（不使用）
- ✅ `2-company_info.json`（改为组织信息）
- ✅ `3-ai_config.json`
- ❌ `3-personas.json`（不使用）
- ❌ `4-response_templates.json`（不使用）
- ✅ `5-faq_detailed.json`（可选，常见问题）
- ✅ `6-knowledge_base.json`（主要知识源）

---

### 场景 3：混合模式（既有客服又有知识库）

**配置文件：**
```json
{
  "mode": "hybrid",
  "enabled_modules": {
    "services": true,
    "personas": true,
    "response_templates": true,
    "faq": true,
    "knowledge_base": true
  }
}
```

**使用的文件：**
- ✅ 所有文件都使用

---

## 🔄 代码适配方案

### 方案 1：配置驱动加载（推荐）

```typescript
// functions/api/lib/knowledge.ts

interface KnowledgeBaseConfig {
  mode: 'customer_service' | 'internal_advisor' | 'hybrid';
  enabled_modules: {
    services: boolean;
    personas: boolean;
    response_templates: boolean;
    faq: boolean;
    knowledge_base: boolean;
  };
}

export class KnowledgeBase {
  private config: KnowledgeBaseConfig | null = null;
  
  async load(baseUrl?: string, assets?: any): Promise<void> {
    // 1. 先加载配置文件
    const configRes = await safeFetch('0-config.json', false);
    if (configRes) {
      this.config = await configRes.json();
    } else {
      // 向后兼容：如果没有配置文件，使用默认配置（对外客服模式）
      this.config = {
        mode: 'customer_service',
        enabled_modules: {
          services: true,
          personas: true,
          response_templates: true,
          faq: true,
          knowledge_base: false
        }
      };
    }
    
    // 2. 根据配置加载相应文件
    const filesToLoad = [];
    
    if (this.config.enabled_modules.services) {
      filesToLoad.push(safeFetch('1-services.json'));
    }
    
    filesToLoad.push(safeFetch('2-company_info.json')); // 必需
    filesToLoad.push(safeFetch('3-ai_config.json')); // 必需
    
    if (this.config.enabled_modules.personas) {
      filesToLoad.push(safeFetch('3-personas.json', false));
    }
    
    if (this.config.enabled_modules.response_templates) {
      filesToLoad.push(safeFetch('4-response_templates.json', false));
    }
    
    if (this.config.enabled_modules.faq) {
      filesToLoad.push(safeFetch('5-faq_detailed.json', false));
    }
    
    if (this.config.enabled_modules.knowledge_base) {
      filesToLoad.push(safeFetch('6-knowledge_base.json', false));
    }
    
    // 3. 并行加载
    const results = await Promise.all(filesToLoad);
    
    // 4. 解析并存储数据
    // ...
  }
}
```

---

## 📋 知识库内容格式（对内顾问）

### 方案 A：JSON 结构化（当前推荐）

**优点：**
- ✅ 易于维护
- ✅ 结构化数据，便于检索
- ✅ 支持版本控制

**缺点：**
- ⚠️ 大文档不适合直接放在 JSON 中

**适用场景：**
- 短文章、FAQ、流程步骤
- 政策、规范

---

### 方案 B：文档文件 + 索引（未来扩展）

**结构：**
```
knowledge/
├── 6-knowledge_base.json       # 文档索引
└── documents/                   # 实际文档
    ├── employee-handbook.md
    ├── onboarding-guide.pdf
    └── policies/
        └── remote-work-policy.md
```

**优点：**
- ✅ 支持大文档
- ✅ 支持 Markdown、PDF、Word 等格式
- ✅ 便于编辑和维护

**缺点：**
- ⚠️ 需要文档解析和向量化（RAG）
- ⚠️ 实现复杂度较高

---

## 🎯 推荐实施方案

### 阶段 1：当前架构 + 配置驱动（最小改动）

1. **保持当前文件结构**
2. **新增 `0-config.json`** 配置文件
3. **新增 `6-knowledge_base.json`**（可选）
4. **代码支持配置驱动加载**

**优点：**
- ✅ 向后兼容
- ✅ 最小改动
- ✅ 快速实施

---

### 阶段 2：完善知识库模块（未来）

1. **支持文档文件**
2. **实现 RAG 检索**
3. **支持向量化搜索**

---

## 📊 对比总结

| 特性 | 当前架构 | 通用架构（方案A） |
|------|---------|-----------------|
| **对外客服** | ✅ 完全支持 | ✅ 完全支持 |
| **对内顾问** | ⚠️ 部分支持（需修改） | ✅ 完全支持 |
| **混合模式** | ❌ 不支持 | ✅ 支持 |
| **配置灵活性** | ⭐ 低 | ⭐⭐⭐⭐⭐ 高 |
| **向后兼容** | - | ✅ 完全兼容 |
| **实施难度** | - | ⭐⭐ 低（最小改动） |

---

## 💡 实施建议

### 立即实施（推荐）

1. **创建 `0-config.json`** 配置文件
2. **创建 `6-knowledge_base.json`** 模板
3. **更新代码支持配置驱动加载**
4. **保持向后兼容**（没有配置文件时使用默认配置）

### 对内顾问使用示例

**文件结构：**
```
knowledge/
├── 0-config.json                # mode: "internal_advisor"
├── 2-company_info.json         # 组织信息
├── 3-ai_config.json           # AI 配置
├── 5-faq_detailed.json         # 常见问题（可选）
└── 6-knowledge_base.json       # 知识库内容
```

**不需要的文件：**
- ❌ `1-services.json`
- ❌ `3-personas.json`
- ❌ `4-response_templates.json`

---

## 🎯 结论

**当前架构已经具备通用性基础**，只需要：

1. ✅ **新增配置文件**（`0-config.json`）控制使用哪些模块
2. ✅ **新增知识库模块**（`6-knowledge_base.json`）支持对内顾问
3. ✅ **代码支持配置驱动**加载相应文件

**这样既保持了向后兼容，又实现了通用架构！**
