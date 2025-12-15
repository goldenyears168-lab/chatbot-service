# 目录重命名：companies → projects

## 📋 变更说明

**日期：** 2025-12-15

**变更内容：** 将根目录的 `companies/` 重命名为 `projects/`，以支持更广泛的使用场景（不仅限于公司，也可以是其他需要问答机器人的场合）。

---

## 🔄 变更详情

### 1. 目录重命名

- ✅ `companies/` → `projects/`
- ✅ 所有子目录和文件保持不变

### 2. 代码更新

**更新的文件：**
- `functions/api/lib/knowledge.ts`
  - `companies/registry.json` → `projects/registry.json`
  - `companies/${path}/knowledge` → `projects/${path}/knowledge`
  
- `functions/api/lib/companyConfig.ts`
  - `companies/registry.json` → `projects/registry.json`
  - `companies/${path}/config.json` → `projects/${path}/config.json`

### 3. 配置文件更新

- ✅ `projects/registry.json` - 添加了 `internal-advisor` 项目

### 4. 新增项目

**对内顾问示例项目：**
- `projects/internal-advisor/`
  - `config.json` - 项目配置
  - `knowledge/`
    - `1-company_info.json` - 组织信息
    - `2-ai_config.json` - AI 配置（简化版）
    - `3-knowledge_base.json` - 知识库内容（核心）

---

## 📁 当前项目结构

```
projects/
├── registry.json              # 项目注册表
├── goldenyears/              # 对外客服示例（好時有影）
│   ├── config.json
│   └── knowledge/
│       ├── 1-services.json
│       ├── 2-company_info.json
│       ├── 3-ai_config.json
│       ├── 3-personas.json
│       ├── 4-response_templates.json
│       └── 5-faq_detailed.json
├── internal-advisor/         # 对内顾问示例
│   ├── config.json
│   └── knowledge/
│       ├── 1-company_info.json
│       ├── 2-ai_config.json
│       └── 3-knowledge_base.json
├── company-b/                # 其他项目示例
├── company-c/
└── company-d/
```

---

## 🎯 使用场景

### 对外客服机器人
- **示例：** `goldenyears`
- **API 路径：** `/api/goldenyears/chat`
- **文件结构：** 6 个文件（服务列表、客户画像、FAQ 等）

### 对内解惑顾问
- **示例：** `internal-advisor`
- **API 路径：** `/api/internal-advisor/chat`
- **文件结构：** 3 个文件（组织信息、AI 配置、知识库）

### 其他场景
- 教育机构的知识问答
- 政府部门的政策咨询
- 非营利组织的服务咨询
- 等等...

---

## 💡 优势

1. **更通用的命名：** `projects` 比 `companies` 更广泛，适用于各种场景
2. **清晰的分类：** 不同类型的项目可以有不同的知识库结构
3. **易于扩展：** 可以轻松添加新的项目类型和场景

---

## 📝 注意事项

1. **向后兼容：** 代码中保留了向后兼容逻辑，如果 `projects/registry.json` 加载失败，会尝试旧路径
2. **API 路径不变：** API 路径仍然是 `/api/{project-id}/chat`，`project-id` 可以是任何有效的项目标识符
3. **文档更新：** 部分文档可能仍引用 `companies/`，但核心代码和配置文件已更新

---

## 🔍 验证

**检查项目是否正常加载：**
```bash
# 检查注册表
curl http://localhost:8788/projects/registry.json

# 检查项目配置
curl http://localhost:8788/projects/goldenyears/config.json
curl http://localhost:8788/projects/internal-advisor/config.json

# 检查知识库
curl http://localhost:8788/projects/goldenyears/knowledge/1-services.json
curl http://localhost:8788/projects/internal-advisor/knowledge/3-knowledge_base.json
```

---

## ✅ 完成状态

- [x] 目录重命名
- [x] 代码路径更新
- [x] 配置文件更新
- [x] 创建对内顾问示例项目
- [x] 更新关键文档
