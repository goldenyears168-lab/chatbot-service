# 公司文件夹结构说明

## 📁 当前必需结构

每个公司文件夹**最少**需要包含以下内容：

```
companies/{company-id}/
├── config.json          # 必需：公司配置
└── knowledge/           # 必需：知识库文件夹（精简后8个文件，带编号）
    ├── 1-services.json              # 核心：服务列表、价格
    ├── 2-contact_info.json          # 核心：联系方式
    ├── 3-personas.json              # 核心：AI人格
    ├── 4-policies.json              # 核心：公司政策
    ├── 5-intent_config.json         # 增强：意图识别配置
    ├── 6-entity_patterns.json       # 增强：实体提取模式
    ├── 7-response_templates.json    # 增强：回复模板
    └── 8-faq_detailed.json          # 增强：FAQ详细内容
```

## 📄 文件说明

### 1. config.json（必需）

公司配置信息，包含：

```json
{
  "id": "company-id",
  "name": "公司名称",
  "name_en": "Company Name",
  "allowedOrigins": [
    "https://www.company.com"
  ],
  "widgetConfig": {
    "theme": "light",
    "locale": "zh-TW"
  },
  "apiConfig": {
    "useSharedApiKey": true,
    "apiKeyEnv": "GEMINI_API_KEY"
  }
}
```

**用途：**
- 验证 CORS 来源
- 配置 Widget 主题和语言
- 配置 API Key 环境变量

**加载方式：** 通过 `functions/api/lib/companyConfig.ts` 加载

### 2. knowledge/（必需）

知识库文件夹，包含 12 个 JSON 文件：

| 编号 | 文件名 | 用途 | 类别 |
|------|--------|------|------|
| 1 | `1-services.json` | 服务项目列表、价格、描述 | 核心必需 |
| 2 | `2-contact_info.json` | 公司联系方式、营业时间 | 核心必需 |
| 3 | `3-personas.json` | AI 人格设定、语调风格 | 核心必需 |
| 4 | `4-policies.json` | 公司政策、条款 | 核心必需 |
| 5 | `5-intent_config.json` | 意图识别配置、关键词 | 增强功能 |
| 6 | `6-entity_patterns.json` | 实体识别模式 | 增强功能 |
| 7 | `7-response_templates.json` | 回复模板 | 增强功能 |
| 8 | `8-faq_detailed.json` | FAQ 问答库 | 增强功能 |

**已移除（精简）：**
- ~~`service_summaries.json`~~ → 使用 `services.json` 生成摘要
- ~~`emotion_templates.json`~~ → LLM 自行处理情绪场景
- ~~`state_transitions.json`~~ → 使用默认状态管理
- ~~`intent_nba_mapping.json`~~ → 使用 `response_templates` 中的 `next_best_actions`

**加载方式：** 通过 `functions/api/lib/knowledge.ts` 加载

## 🔍 代码引用

### config.json 加载

```typescript
// functions/api/lib/companyConfig.ts
const configUrl = `${baseUrl}/companies/${companyInfo.path}/config.json`;
const config = await fetch(configUrl).then(r => r.json());
```

### knowledge/ 加载

```typescript
// functions/api/lib/knowledge.ts
const knowledgePath = `/companies/${companyInfo.path}/knowledge/`;
const servicesUrl = `${knowledgePath}/services.json`;
const services = await fetch(servicesUrl).then(r => r.json());
```

## 🎯 总结

**每个公司文件夹最少需要：**
- ✅ `config.json` - 公司配置（1个文件）
- ✅ `knowledge/` - 知识库（8个JSON文件，已精简）

**总共：9个文件（config.json + 8个知识库文件）**

**精简说明：** 已从原来的12个知识库文件精简到8个，删除了4个优化功能文件，功能通过 fallback 机制实现。

除了这两个，其他都是**可选的**。代码目前只引用这两个资源。

## 🔮 未来可能的扩展

如果未来需要支持公司特定的资源，可以考虑添加：

```
companies/{company-id}/
├── config.json
├── knowledge/
├── assets/              # 可选：公司特定的静态资源
│   ├── logo.png
│   └── images/
├── custom/              # 可选：公司特定的自定义代码
│   └── hooks/
└── styles/              # 可选：公司特定的样式
    └── custom.css
```

但这些**目前都不需要**，代码也没有引用它们。

## ✅ 最佳实践

1. **最小化结构**：只保留必需的 `config.json` 和 `knowledge/`
2. **统一格式**：所有公司的知识库文件结构应该一致
3. **独立配置**：每个公司的配置完全独立，互不影响
