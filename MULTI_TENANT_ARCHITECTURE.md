# 多租户架构设计方案

## 📋 方案概述

**目标**: 单一部署，多个公司共享同一个 chatbot-service，通过路由/配置区分不同公司。

---

## ✅ 可行性分析

### 优势

1. **部署简单**: 只需部署一次，所有公司共享
2. **维护成本低**: 代码更新只需一次
3. **资源共享**: 共享 LLM API、基础设施
4. **统一管理**: 集中监控和日志

### 挑战与解决方案

| 挑战 | 解决方案 |
|------|----------|
| 路由区分 | 使用路径参数 `/api/{company}/chat` |
| 知识库隔离 | 每个公司独立 `knowledge/{company}/` 目录 |
| 配置管理 | 环境变量前缀或配置文件 |
| 上下文隔离 | 每个公司独立的 Context Manager |
| Widget 区分 | Widget 通过 `data-company` 参数传递 |

---

## 🏗️ 架构设计

### 目录结构

```
chatbot-service/
├── functions/
│   └── api/
│       ├── [company]/          # 动态路由（Cloudflare Pages Functions）
│       │   ├── chat.ts
│       │   └── faq-menu.ts
│       └── lib/                # 共享库
│           ├── knowledge.ts    # 支持多租户
│           ├── contextManager.ts
│           └── ...
├── knowledge/                  # 知识库（按公司隔离）
│   ├── goldenyears/
│   │   ├── services.json
│   │   ├── faq_detailed.json
│   │   └── ...
│   ├── company2/
│   │   ├── services.json
│   │   └── ...
│   └── shared/                 # 共享知识库（可选）
│       └── ...
├── widget/                     # Widget 文件（共享）
│   ├── loader.js
│   ├── widget.js
│   └── widget.css
└── wrangler.toml
```

### 路由设计

#### 方案 A: 路径参数（推荐）

```
/api/goldenyears/chat          → 好時有影
/api/company2/chat             → 公司 2
/api/company3/chat             → 公司 3
/api/goldenyears/faq-menu      → 好時有影 FAQ
```

**优点**:    
- 清晰明确
- 易于路由
- 支持 Cloudflare Pages Functions 动态路由

**实现**:
- 使用 Cloudflare Pages Functions 的 `[company]` 动态路由
- 文件结构: `functions/api/[company]/chat.ts`

#### 方案 B: 查询参数

```
/api/chat?company=goldenyears
/api/faq-menu?company=goldenyears
```

**优点**:
- 简单
- 不需要改变文件结构

**缺点**:
- 不够直观
- 需要验证参数

#### 方案 C: 请求头

```
X-Company-Id: goldenyears
```

**优点**:
- 不影响 URL
- 可以基于域名自动识别

**缺点**:
- 需要额外处理
- 可能被 CORS 限制

### 推荐方案: 路径参数 + 请求头（双重验证）

结合方案 A 和 C，提供最大灵活性。

---

## 🔧 实现方案

### 1. 路由结构

#### Cloudflare Pages Functions 动态路由

```
functions/
└── api/
    └── [company]/
        ├── chat.ts
        └── faq-menu.ts
```

#### chat.ts 示例

```typescript
// functions/api/[company]/chat.ts

export async function onRequestPost(context: {
  request: Request;
  env: any;
  params: { company: string };  // 从路径获取公司 ID
}): Promise<Response> {
  const { request, env, params } = context;
  const companyId = params.company;  // 例如: "goldenyears"
  
  // 验证公司 ID
  if (!isValidCompany(companyId)) {
    return new Response(JSON.stringify({ error: 'Invalid company' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 加载该公司的知识库
  const knowledgeBase = await loadCompanyKnowledgeBase(companyId, request);
  
  // 使用公司特定的配置
  const config = getCompanyConfig(companyId, env);
  
  // 处理请求...
}
```

### 2. 知识库隔离

#### 知识库加载器修改

```typescript
// functions/api/lib/knowledge.ts

export class KnowledgeBase {
  private companyId: string;
  private baseUrl: string;
  
  constructor(companyId: string, baseUrl?: string) {
    this.companyId = companyId;
    this.baseUrl = baseUrl;
  }
  
  async load(baseUrl?: string): Promise<void> {
    if (baseUrl) this.baseUrl = baseUrl;
    
    // 加载公司特定的知识库
    const knowledgePath = `/knowledge/${this.companyId}/`;
    
    // 加载 services.json
    const servicesUrl = `${this.baseUrl}${knowledgePath}services.json`;
    const servicesResponse = await fetch(servicesUrl);
    this.services = await servicesResponse.json();
    
    // 加载其他知识库文件...
  }
}

// 工厂函数
export async function loadCompanyKnowledgeBase(
  companyId: string, 
  request: Request
): Promise<KnowledgeBase> {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const kb = new KnowledgeBase(companyId, baseUrl);
  await kb.load();
  return kb;
}
```

### 3. 配置管理

#### 环境变量设计

**方案 A: 前缀方式**

```
GEMINI_API_KEY=shared_key                    # 共享 API Key
CHATBOT_ALLOWED_ORIGINS_GOLDENYEARS=https://www.goldenyearsphoto.com
CHATBOT_ALLOWED_ORIGINS_COMPANY2=https://www.company2.com
```

**方案 B: JSON 配置**

```json
// knowledge/companies.json
{
  "goldenyears": {
    "name": "好時有影",
    "allowedOrigins": [
      "https://www.goldenyearsphoto.com",
      "https://goldenyearsphoto.com"
    ],
    "apiKey": "env:GEMINI_API_KEY",  // 引用环境变量
    "widgetConfig": {
      "theme": "light",
      "locale": "zh-TW"
    }
  },
  "company2": {
    "name": "公司 2",
    "allowedOrigins": ["https://www.company2.com"],
    "apiKey": "env:GEMINI_API_KEY",
    "widgetConfig": {
      "theme": "dark",
      "locale": "en-US"
    }
  }
}
```

**推荐**: 方案 B（JSON 配置），更灵活且易于管理。

### 4. Widget 配置

#### loader.js 修改

```javascript
// widget/loader.js

const config = {
  // 从 script tag 获取公司 ID
  companyId: script.dataset.company || 'goldenyears',  // 默认值
  
  // API 端点（包含公司 ID）
  apiEndpoint: script.dataset.apiEndpoint || 
    `https://chatbot-api.example.com/api/${companyId}/chat`,
  
  // 其他配置...
};
```

#### 使用方式

```html
<!-- 好時有影 -->
<script 
  src="https://chatbot-api.example.com/widget/loader.js" 
  data-company="goldenyears"
  data-api-endpoint="https://chatbot-api.example.com/api/goldenyears/chat"
  data-api-base-url="https://chatbot-api.example.com"
  defer
></script>

<!-- 公司 2 -->
<script 
  src="https://chatbot-api.example.com/widget/loader.js" 
  data-company="company2"
  data-api-endpoint="https://chatbot-api.example.com/api/company2/chat"
  data-api-base-url="https://chatbot-api.example.com"
  defer
></script>
```

### 5. 上下文隔离

#### Context Manager 修改

```typescript
// functions/api/lib/contextManager.ts

export class ContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private companyId: string;
  
  constructor(companyId: string) {
    this.companyId = companyId;
  }
  
  // 使用 companyId + conversationId 作为 key
  private getKey(conversationId: string): string {
    return `${this.companyId}:${conversationId}`;
  }
  
  createContext(conversationId?: string): ConversationContext {
    const id = conversationId || generateId();
    const key = this.getKey(id);
    // ...
  }
  
  getContext(conversationId: string): ConversationContext | null {
    const key = this.getKey(conversationId);
    return this.contexts.get(key) || null;
  }
}
```

---

## 📝 迁移步骤

### 步骤 1: 重构目录结构

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service

# 创建新的目录结构
mkdir -p knowledge/goldenyears
mkdir -p functions/api/\[company\]

# 移动现有知识库
mv goldenyears/knowledge/* knowledge/goldenyears/

# 创建动态路由文件
# (需要手动创建 functions/api/[company]/chat.ts)
```

### 步骤 2: 修改代码

1. **修改路由处理**: 支持 `[company]` 参数
2. **修改知识库加载**: 支持按公司加载
3. **修改配置管理**: 支持多公司配置
4. **修改 Widget**: 支持 `data-company` 参数

### 步骤 3: 创建公司配置

```json
// knowledge/companies.json
{
  "goldenyears": {
    "name": "好時有影",
    "allowedOrigins": [
      "https://www.goldenyearsphoto.com",
      "https://goldenyearsphoto.com"
    ]
  }
}
```

### 步骤 4: 更新 Widget 引用

更新 `goldenyearsphoto` 网站的 `base-layout.njk`:

```njk
<script 
  src="https://chatbot-api.example.com/widget/loader.js" 
  data-company="goldenyears"
  data-api-endpoint="https://chatbot-api.example.com/api/goldenyears/chat"
  data-api-base-url="https://chatbot-api.example.com"
  defer
></script>
```

---

## ⚠️ 注意事项

### 1. 安全性

- **公司 ID 验证**: 必须验证公司 ID 的有效性
- **CORS 配置**: 每个公司独立的 CORS 配置
- **API Key 隔离**: 如果使用不同的 API Key，需要隔离

### 2. 性能

- **知识库缓存**: 每个公司的知识库独立缓存
- **上下文管理**: 使用 `companyId:conversationId` 作为 key
- **并发处理**: 确保多租户不会相互影响

### 3. 扩展性

- **添加新公司**: 只需添加知识库目录和配置
- **共享知识库**: 可以创建 `knowledge/shared/` 用于共享内容
- **版本控制**: 每个公司的知识库可以独立版本控制

### 4. 监控和日志

- **日志标识**: 每条日志包含 `companyId`
- **监控指标**: 按公司分别统计
- **错误追踪**: 错误日志包含公司信息

---

## 🎯 实施建议

### 阶段 1: 准备（1-2 天）

1. 创建新的目录结构
2. 创建公司配置文件
3. 设计路由方案

### 阶段 2: 代码重构（3-5 天）

1. 修改路由处理
2. 修改知识库加载
3. 修改配置管理
4. 修改 Widget

### 阶段 3: 测试（2-3 天）

1. 单元测试
2. 集成测试
3. 多租户隔离测试

### 阶段 4: 部署（1 天）

1. 部署到 Cloudflare Pages
2. 更新 goldenyearsphoto 网站
3. 验证功能

---

## ✅ 结论

**这个方案是可行的**，具有以下优势：

1. ✅ **单一部署**: 只需部署一次
2. ✅ **易于扩展**: 添加新公司只需添加配置和知识库
3. ✅ **维护简单**: 代码更新只需一次
4. ✅ **资源高效**: 共享基础设施

**建议采用路径参数方案** (`/api/{company}/chat`)，因为：
- 清晰明确
- 易于实现
- 符合 RESTful 设计
- 支持 Cloudflare Pages Functions

---

**最后更新**: 2024-01-XX
