# 专案隔离架构更新报告

## 更新日期
2025-12-16

## 更新目标
将 `1chatbot-service` 的架构更新为与 `chatbot-service` 一致的专案隔离架构，确保每个专案的知识库和配置都独立存储在 `projects/` 目录下。

## 已完成的更新

### 1. 知识库路径更新 ✅

**更新前：**
- 知识库路径：`/knowledge/{companyId}/`
- 文件命名：`services.json`, `personas.json` 等（无编号前缀）

**更新后：**
- 知识库路径：`/projects/{companyId}/knowledge/`
- 文件命名：`1-services.json`, `2-company_info.json` 等（带编号前缀）

**更新的文件：**
- `lib/knowledge.ts` - 已使用 `/projects/${companyId}/knowledge` 路径
- `lib/knowledge/loader.ts` - 已使用 `/projects/${company}/knowledge` 路径

### 2. 配置加载逻辑更新 ✅

**更新前：**
- 配置硬编码在代码中
- 无法动态加载专案配置

**更新后：**
- 从 `projects/registry.json` 加载专案注册表
- 从 `projects/{companyId}/config.json` 加载每个专案的完整配置
- 支持 Node.js 环境从文件系统读取
- Edge Runtime 环境使用缓存的注册表

**更新的文件：**
- `lib/config/node.ts` - 已更新为从 `projects/` 目录加载配置

### 3. 知识库内容迁移 ✅

**迁移结果：**
- ✅ 5 个专案的知识库已从 `chatbot-service` 同步到 `1chatbot-service`
- ✅ 所有知识库文件已复制到 `projects/{companyId}/knowledge/`
- ✅ 所有知识库文件已复制到 `public/projects/{companyId}/knowledge/`（静态网站访问）
- ✅ 已创建 `_manifest.json` 文件清单

**专案列表：**
- `goldenyears` - 6 个知识库文件
- `company-b` - 5 个知识库文件
- `company-c` - 5 个知识库文件
- `company-d` - 5 个知识库文件
- `bonus-advisor` - 3 个知识库文件

## 专案隔离架构

### 目录结构

```
1chatbot-service/
├── projects/
│   ├── registry.json                    # 专案注册表
│   ├── goldenyears/
│   │   ├── config.json                  # 专案配置
│   │   ├── knowledge/                   # 专案知识库
│   │   │   ├── 1-services.json
│   │   │   ├── 2-company_info.json
│   │   │   ├── 3-ai_config.json
│   │   │   ├── 3-personas.json
│   │   │   ├── 4-response_templates.json
│   │   │   ├── 5-faq_detailed.json
│   │   │   └── _manifest.json
│   │   └── components/                  # 专案组件（可选）
│   ├── company-b/
│   │   ├── config.json
│   │   └── knowledge/
│   └── ...
└── public/
    └── projects/                        # 静态文件（用于 HTTP 访问）
        ├── goldenyears/
        │   └── knowledge/
        └── ...
```

### 配置加载流程

1. **Node.js 环境：**
   - 优先从 `projects/registry.json` 加载注册表
   - 优先从 `projects/{companyId}/config.json` 加载专案配置
   - 如果文件不存在，使用代码中缓存的注册表

2. **Edge Runtime 环境：**
   - 使用代码中缓存的注册表
   - 从 HTTP 加载知识库文件（`/projects/{companyId}/knowledge/`）

### 知识库加载流程

1. **HTTP 加载（Edge Runtime）：**
   - 从 `${baseUrl}/projects/${companyId}/knowledge/` 加载文件
   - 支持的文件列表：
     - `1-services.json`
     - `2-company_info.json`
     - `3-ai_config.json`
     - `3-personas.json`（可选）
     - `3-knowledge_base.json`（可选）
     - `4-response_templates.json`
     - `5-faq_detailed.json`

2. **文件系统加载（Node.js）：**
   - 从 `projects/{companyId}/knowledge/` 目录读取所有 JSON 文件
   - 自动处理文件命名（移除编号前缀）

## 专案隔离特性

### ✅ 已实现的隔离

1. **知识库隔离**
   - 每个专案有独立的知识库目录
   - 知识库文件不会相互影响

2. **配置隔离**
   - 每个专案有独立的 `config.json`
   - 包含专案特定的 CORS 设置、Widget 配置等

3. **注册表管理**
   - 统一的 `registry.json` 管理所有专案
   - 支持专案激活/停用控制

### 🔄 配置示例

**`projects/registry.json`：**
```json
{
  "version": "1.0.0",
  "last_updated": "2025-12-15",
  "companies": {
    "goldenyears": {
      "id": "goldenyears",
      "name": "好時有影",
      "name_en": "Golden Years Photo",
      "path": "goldenyears",
      "active": true,
      "deployment": "shared"
    }
  }
}
```

**`projects/goldenyears/config.json`：**
```json
{
  "id": "goldenyears",
  "name": "好時有影",
  "name_en": "Golden Years Photo",
  "allowedOrigins": [
    "https://www.goldenyearsphoto.com"
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

## 验证检查清单

### ✅ 已完成

- [x] 知识库路径已更新为 `/projects/{companyId}/knowledge/`
- [x] 配置加载逻辑已更新为从 `projects/` 目录加载
- [x] 所有专案的知识库已迁移
- [x] 所有专案的配置文件已存在
- [x] `registry.json` 已创建并包含所有专案

### 📝 建议测试

- [ ] 验证 API 端点能正确加载知识库
- [ ] 验证配置加载是否正常工作
- [ ] 测试不同专案的隔离性（确保不会相互影响）
- [ ] 验证静态文件可通过 HTTP 访问
- [ ] 测试聊天功能是否正常

## 迁移脚本

已创建迁移脚本：`scripts/migrate_knowledge_base.py`

可以随时重新运行此脚本以同步最新的知识库内容：

```bash
python3 scripts/migrate_knowledge_base.py
```

## 注意事项

1. **路径一致性**
   - 确保所有代码都使用 `/projects/{companyId}/knowledge/` 路径
   - 不要混用旧路径 `/knowledge/{companyId}/`

2. **文件命名规范**
   - 知识库文件必须使用编号前缀：`1-`, `2-`, `3-` 等
   - 这有助于文件加载顺序和识别

3. **静态文件部署**
   - 知识库文件需要同时存在于 `projects/` 和 `public/projects/` 目录
   - `public/` 目录用于 HTTP 访问（Edge Runtime）

4. **配置更新**
   - 更新 `projects/registry.json` 后，需要重启服务（Node.js 环境）
   - Edge Runtime 环境使用缓存的注册表，需要重新部署

## 相关文件

- `lib/knowledge.ts` - 知识库加载逻辑
- `lib/knowledge/loader.ts` - 知识库数据加载器
- `lib/config/node.ts` - 配置加载逻辑（Node.js）
- `lib/config/edge.ts` - 配置加载逻辑（Edge Runtime）
- `projects/registry.json` - 专案注册表
- `projects/{companyId}/config.json` - 专案配置
- `scripts/migrate_knowledge_base.py` - 知识库迁移脚本

