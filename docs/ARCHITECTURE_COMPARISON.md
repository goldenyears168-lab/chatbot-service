# 架构对比：旧架构 vs 新架构

## 📊 结构对比

### ❌ 旧架构（适合 <10 家公司）

```
knowledge/
├── companies.json          # 所有公司配置在一个文件
├── goldenyears/           # 知识库
├── company-b/             # 知识库
├── company-c/             # 知识库
└── company-d/             # 知识库
```

**问题：**
- `companies.json` 会变得很大（100家公司 = 200KB+）
- 加载配置时需要读取整个文件
- 所有公司混在一起，不易管理

### ✅ 新架构（适合 100+ 家公司）

```
companies/
├── registry.json          # 轻量级索引（<10KB）
├── active/
│   ├── goldenyears/
│   │   ├── knowledge/     # 知识库（12个JSON文件）
│   │   └── config.json    # 公司配置（分散，独立）
│   ├── company-b/
│   ├── company-c/
│   └── company-d/
├── archived/              # 归档公司
└── templates/             # 新公司模板
```

**优势：**
- `registry.json` 轻量级（只包含 id, name, path, active）
- 每个公司独立配置，易于维护
- 按需加载，只加载需要的公司
- 支持分组和组织

## 📈 性能对比

| 特性 | 旧架构 | 新架构 |
|------|--------|--------|
| **加载速度** | 需要加载所有公司配置 | 只加载需要的公司 |
| **文件大小** | companies.json 会很大 | registry.json 很小 |
| **内存占用** | 所有公司配置常驻内存 | 只缓存活跃公司 |
| **维护性** | 100个文件夹混在一起 | 按 active/archived 组织 |
| **扩展性** | 添加新公司需要修改大文件 | 只需添加文件夹和配置 |

## 🔄 代码变化

### companyConfig.ts

**旧代码：**
```typescript
// 加载所有公司配置
const configUrl = `${baseUrl}/knowledge/companies.json`;
const allCompanies = await fetch(configUrl).then(r => r.json());
const companyConfig = allCompanies[companyId];
```

**新代码：**
```typescript
// 1. 先加载轻量级注册表
const registry = await fetch(`${baseUrl}/companies/registry.json`)
  .then(r => r.json());
const companyInfo = registry.companies[companyId];

// 2. 按需加载公司详细配置
const config = await fetch(`${baseUrl}/companies/${companyInfo.path}/config.json`)
  .then(r => r.json());
```

### knowledge.ts

**旧路径：**
```typescript
const knowledgePath = `/knowledge/${companyId}/`;
```

**新路径：**
```typescript
// 从注册表获取路径
const companyInfo = registry.companies[companyId];
const knowledgePath = `/companies/${companyInfo.path}/knowledge/`;
```

## ✅ 向后兼容

新代码已实现向后兼容：
- 如果 `companies/registry.json` 加载失败，会自动回退到旧路径
- 旧的 `knowledge/` 文件夹仍然保留（可以稍后删除）

## 📝 迁移检查清单

- [x] 创建新目录结构
- [x] 迁移现有公司到新结构
- [x] 创建独立的 config.json 文件
- [x] 创建轻量级 registry.json
- [x] 更新 companyConfig.ts
- [x] 更新 knowledge.ts
- [x] 验证文件结构
- [ ] 测试 API 端点（需要运行服务）
- [ ] 验证知识库加载（需要运行服务）

