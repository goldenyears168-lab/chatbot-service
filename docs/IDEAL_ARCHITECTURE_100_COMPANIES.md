# 100家公司规模的理想架构设计

## 🎯 设计目标

当系统扩展到100家公司时，需要考虑：
1. **可扩展性** - 易于添加新公司
2. **可维护性** - 易于查找和管理公司资源
3. **性能** - 避免加载所有公司的配置和文件
4. **部署效率** - 支持选择性部署
5. **代码复用** - 共享代码 vs 公司特定代码

## 📐 理想架构方案

### 方案A：按公司组织（推荐）

```
chatbot-service/
├── companies/                          # 所有公司资源
│   ├── registry.json                   # 公司注册表（轻量级，快速加载）
│   │                                   # 只包含基本信息和路径引用
│   ├── groups/                         # 可选：按行业/类型分组
│   │   ├── ecommerce/
│   │   │   ├── company-a/
│   │   │   └── company-b/
│   │   ├── healthcare/
│   │   └── education/
│   │
│   └── individual/                     # 独立公司（不分组）
│       ├── goldenyears/
│       │   ├── knowledge/              # 知识库
│       │   │   ├── services.json
│       │   │   ├── contact_info.json
│       │   │   └── ...
│       │   ├── config.json             # 公司特定配置
│       │   │   {
│       │   │     "id": "goldenyears",
│       │   │     "name": "好時有影",
│       │   │     "allowedOrigins": [...],
│       │   │     "widgetConfig": {...},
│       │   │     "apiConfig": {...}
│       │   │   }
│       │   └── custom/                 # 可选：公司特定的自定义代码
│       │       └── hooks/
│       │
│       ├── company-b/
│       │   ├── knowledge/
│       │   └── config.json
│       │
│       └── company-c/
│           ├── knowledge/
│           └── config.json
│
├── functions/                          # 共享代码
│   └── api/
│       ├── [company]/
│       │   ├── chat.ts                 # 动态路由
│       │   └── faq-menu.ts
│       └── lib/
│           ├── knowledge.ts            # 修改路径：/companies/{group}/{company}/knowledge/
│           ├── companyConfig.ts        # 修改：加载 companies/registry.json
│           └── ...
│
├── shared/                             # 共享资源
│   ├── knowledge/                      # 共享知识库模板
│   └── templates/
│
└── widget/                             # 共享 Widget
```

### 关键改进点

#### 1. **轻量级注册表** (`companies/registry.json`)

```json
{
  "companies": {
    "goldenyears": {
      "id": "goldenyears",
      "name": "好時有影",
      "path": "individual/goldenyears",  // 相对路径
      "group": null,                      // 可选：分组
      "active": true,                     // 是否启用
      "deployment": "shared"              // shared | independent
    },
    "company-b": {
      "id": "company-b",
      "name": "B公司",
      "path": "individual/company-b",
      "group": "ecommerce",
      "active": true,
      "deployment": "shared"
    }
  },
  "groups": {
    "ecommerce": {
      "name": "电子商务",
      "description": "电商相关公司"
    }
  }
}
```

#### 2. **分散配置**

每个公司有自己的 `config.json`，而不是集中在 `companies.json`：
- 降低加载时间（只加载需要的公司配置）
- 易于管理（每个公司独立维护）
- 支持版本控制（可以单独提交）

#### 3. **按需加载**

```typescript
// functions/api/lib/knowledge.ts
async load(companyId: string, baseUrl: string) {
  // 1. 从 registry.json 获取公司路径
  const registry = await loadRegistry();
  const companyInfo = registry.companies[companyId];
  if (!companyInfo) throw new Error('Company not found');
  
  // 2. 构建知识库路径
  const knowledgePath = `/companies/${companyInfo.path}/knowledge/`;
  
  // 3. 按需加载
  await this.loadFromPath(knowledgePath, baseUrl);
}
```

### 方案B：扁平化 + 索引（适合快速迭代）

如果100家公司都需要快速添加，可以考虑扁平化：

```
chatbot-service/
├── knowledge/
│   ├── registry.json                   # 轻量级索引
│   │   {
│   │     "companies": {
│   │       "goldenyears": { "path": "goldenyears" },
│   │       "company-b": { "path": "company-b" }
│   │     }
│   │   }
│   ├── goldenyears/
│   ├── company-b/
│   └── ... (98 more)
│
└── functions/
```

**缺点**：100个文件夹在同一层级，不易管理

## 🚀 推荐方案：混合架构

结合方案A和B的优点：

```
chatbot-service/
├── companies/
│   ├── registry.json                   # 主注册表（轻量级，<10KB）
│   │                                   # 只包含：id, name, path, active
│   │
│   ├── active/                         # 活跃公司（常用）
│   │   ├── goldenyears/
│   │   │   ├── knowledge/
│   │   │   └── config.json
│   │   └── company-b/
│   │
│   ├── archived/                       # 归档公司（保留但不用）
│   │   └── old-company-1/
│   │
│   └── templates/                      # 新公司模板
│       └── default/
│
├── functions/                          # 共享代码
│   └── api/
│       ├── [company]/
│       └── lib/
│           ├── knowledge.ts            # 路径：/companies/active/{company}/knowledge/
│           └── companyConfig.ts        # 从 registry.json + config.json 加载
│
└── shared/                             # 共享资源
```

## 📊 性能优化

### 1. **延迟加载配置**

```typescript
// 只加载 registry.json（小文件，快速）
const registry = await loadRegistry();  // ~10KB

// 需要时才加载公司详细配置
if (needDetails) {
  const config = await loadCompanyConfig(companyInfo.path);  // 单个公司 ~2KB
}
```

### 2. **缓存策略**

```typescript
// 缓存活跃公司的配置
const activeCompaniesCache = new Map<string, CompanyConfig>();

// 定期清理不活跃的缓存
setInterval(() => {
  // 清理30分钟未使用的配置
}, 30 * 60 * 1000);
```

### 3. **按需部署**

```bash
# 只部署活跃公司
npm run deploy -- --companies=goldenyears,company-b,company-c

# 部署所有活跃公司
npm run deploy -- --all-active
```

## 🔄 迁移路径

从当前架构迁移到理想架构：

### 步骤1：创建新结构

```bash
mkdir -p companies/active
mkdir -p companies/archived
mkdir -p companies/templates
```

### 步骤2：迁移现有公司

```bash
# 移动知识库
mv knowledge/goldenyears companies/active/goldenyears/knowledge

# 创建公司配置
cat > companies/active/goldenyears/config.json << EOF
{
  "id": "goldenyears",
  "name": "好時有影",
  ...
}
EOF
```

### 步骤3：创建注册表

```bash
# 从现有的 companies.json 生成 registry.json
node scripts/generate-registry.js
```

### 步骤4：更新代码

修改 `functions/api/lib/knowledge.ts` 和 `companyConfig.ts` 以使用新路径。

## 📝 总结

**理想架构的核心原则：**

1. ✅ **按公司组织** - 每个公司有自己的文件夹，包含 knowledge 和 config
2. ✅ **轻量级注册表** - registry.json 只包含基本信息，快速加载
3. ✅ **分散配置** - 每个公司维护自己的 config.json
4. ✅ **支持分组** - 可以按行业/类型组织（可选）
5. ✅ **按需加载** - 只加载需要的公司资源
6. ✅ **易于扩展** - 添加新公司只需创建文件夹和配置

这样设计的好处：
- 🚀 **性能好** - 不会因为100家公司而变慢
- 🔍 **易维护** - 每个公司资源清晰可见
- 📦 **易部署** - 可以选择性部署
- 🔄 **易扩展** - 添加新公司很简单
