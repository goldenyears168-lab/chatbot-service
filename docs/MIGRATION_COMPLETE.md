# 理想架构迁移完成

## ✅ 迁移状态

已成功从旧架构迁移到新架构（理想架构）。

## 📁 新架构结构

```
companies/
├── registry.json              # 轻量级注册表（<10KB）
├── active/                    # 活跃公司
│   ├── goldenyears/
│   │   ├── knowledge/        # 知识库文件（12个JSON文件）
│   │   └── config.json       # 公司配置
│   ├── company-b/
│   ├── company-c/
│   └── company-d/
├── archived/                  # 归档公司（未来使用）
└── templates/                 # 新公司模板（未来使用）
```

## 🔄 代码更新

### 1. `functions/api/lib/companyConfig.ts`
- ✅ 更新为从 `companies/registry.json` 加载注册表
- ✅ 按需加载公司的详细配置 `companies/{path}/config.json`
- ✅ 添加缓存机制，提升性能

### 2. `functions/api/lib/knowledge.ts`
- ✅ 更新路径从 `/knowledge/{companyId}/` 到 `/companies/{path}/knowledge/`
- ✅ 从 registry.json 获取公司路径
- ✅ 保持向后兼容（如果注册表加载失败，使用旧路径）

## 📊 性能改进

### 旧架构
- 加载 `companies.json`: ~200KB（100家公司时）
- 所有公司配置常驻内存

### 新架构
- 加载 `registry.json`: ~10KB（轻量级索引）
- 按需加载公司配置: ~2KB/公司
- 只缓存活跃公司的配置

## 🔍 验证方法

### 测试 API 端点

```bash
# 测试 goldenyears
curl -X POST http://localhost:8788/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "sessionId": "test-123"}'

# 测试 company-b
curl -X POST http://localhost:8788/api/company-b/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你们提供什么服务？", "sessionId": "test-123"}'
```

### 验证文件访问

```bash
# 检查注册表
curl http://localhost:8788/companies/registry.json

# 检查公司配置
curl http://localhost:8788/companies/active/goldenyears/config.json

# 检查知识库
curl http://localhost:8788/companies/active/goldenyears/knowledge/services.json
```

## 📝 添加新公司步骤

### 步骤 1: 创建公司目录
```bash
mkdir -p companies/active/new-company/knowledge
```

### 步骤 2: 复制模板文件
```bash
cp companies/active/goldenyears/knowledge/*.json \
   companies/active/new-company/knowledge/
```

### 步骤 3: 创建公司配置
```bash
cat > companies/active/new-company/config.json << EOF
{
  "id": "new-company",
  "name": "新公司",
  "name_en": "New Company",
  "allowedOrigins": [...],
  "widgetConfig": {...},
  "apiConfig": {...}
}
EOF
```

### 步骤 4: 更新注册表
编辑 `companies/registry.json`，添加新公司条目：
```json
{
  "companies": {
    "new-company": {
      "id": "new-company",
      "name": "新公司",
      "name_en": "New Company",
      "path": "active/new-company",
      "group": null,
      "active": true,
      "deployment": "shared"
    }
  }
}
```

### 步骤 5: 修改知识库内容
编辑 `companies/active/new-company/knowledge/` 下的 JSON 文件，根据新公司的需求定制。

## 🔄 向后兼容

代码已实现向后兼容：
- 如果 `companies/registry.json` 加载失败，会自动回退到旧路径 `/knowledge/{companyId}/`
- 旧的 `knowledge/` 文件夹仍然保留（可以稍后删除）

## 🗑️ 清理旧文件（可选）

迁移验证完成后，可以删除旧的 `knowledge/` 文件夹：

```bash
# ⚠️ 请先确认新架构工作正常后再执行
# mv knowledge knowledge.old
```

## 📚 相关文档

- [IDEAL_ARCHITECTURE_100_COMPANIES.md](./IDEAL_ARCHITECTURE_100_COMPANIES.md) - 详细架构设计文档
- `companies/registry.json` - 注册表结构说明
