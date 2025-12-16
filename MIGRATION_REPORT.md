# 知识库迁移报告

## 迁移时间
2025-12-16 21:05

## 迁移概览

### 源项目
- `chatbot-service/projects/`

### 目标项目
- `1chatbot-service/projects/`
- `1chatbot-service/public/projects/` (静态网站访问)

## 迁移结果

### 专案统计

| 专案 | 知识库文件数 | 状态 |
|------|------------|------|
| goldenyears | 7 (含 _manifest.json) | ✅ 成功 |
| company-b | 6 (含 _manifest.json) | ✅ 成功 |
| company-c | 6 (含 _manifest.json) | ✅ 成功 |
| company-d | 6 (含 _manifest.json) | ✅ 成功 |
| bonus-advisor | 4 (含 _manifest.json) | ✅ 成功 |

### 文件统计
- **总文件数**: 24 个知识库文件 + 5 个 manifest 文件 = 29 个文件
- **projects 目录**: 38 个 JSON 文件（包含所有专案）
- **public 目录**: 32 个 JSON 文件（静态网站访问）

### 验证结果
- ✅ 所有 JSON 文件格式验证通过
- ✅ 所有文件已同步到 `projects/` 和 `public/` 目录
- ✅ 已创建 `_manifest.json` 文件用于文件清单

## 备份信息

备份位置: `projects_backup/knowledge_backup_20251216_210516/`

包含 33 个 JSON 文件的完整备份。

## 知识库文件结构

每个专案的知识库包含以下文件（根据专案类型）：

### 标准专案 (company-b, company-c, company-d)
- `1-services.json` - 服务列表
- `2-company_info.json` - 公司信息
- `3-ai_config.json` - AI 配置
- `4-response_templates.json` - 回复模板
- `5-faq_detailed.json` - 详细 FAQ
- `_manifest.json` - 文件清单

### goldenyears 专案
- `1-services.json` - 服务列表
- `2-company_info.json` - 公司信息
- `3-ai_config.json` - AI 配置
- `3-personas.json` - 客户角色
- `4-response_templates.json` - 回复模板
- `5-faq_detailed.json` - 详细 FAQ
- `_manifest.json` - 文件清单

### bonus-advisor 专案
- `1-company_info.json` - 公司信息
- `2-ai_config.json` - AI 配置
- `3-knowledge_base.json` - 知识库
- `_manifest.json` - 文件清单

## 下一步

1. ✅ 知识库内容已同步
2. ⚠️  如需更新代码以使用新的知识库路径，请检查：
   - `functions/api/lib/knowledge.ts` - 知识库加载逻辑
   - `functions/api/lib/companyConfig.ts` - 公司配置加载
3. 📝 建议测试：
   - 验证 API 端点能正确加载知识库
   - 确认静态文件可通过 HTTP 访问
   - 测试聊天功能是否正常

## 迁移脚本

迁移脚本位置: `scripts/migrate_knowledge_base.py`

可以随时重新运行此脚本以同步最新的知识库内容。

