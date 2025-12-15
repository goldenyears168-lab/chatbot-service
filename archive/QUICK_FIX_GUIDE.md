# 🚀 快速修复指南

**问题**: Widget FAQ 菜单无法加载  
**状态**: ✅ 已修复（待部署）  
**用时**: 5 分钟部署 + 5 分钟测试

---

## 🎯 一分钟问题总结

```
问题: Widget 调用错误的 API 路径
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 错误路径: /api/faq-menu
✅ 正确路径: /api/goldenyears/faq-menu
                      ^^^^^^^^^^^^
                      缺少公司 ID

修复: 在 widget.js 的 loadFAQMenu() 
      方法中添加 companyId 参数
```

---

## 📋 快速部署步骤

### 步骤 1: 部署代码（2 分钟）

```bash
# 在项目根目录执行
git add .
git commit -m "fix: add companyId to FAQ menu API path"
git push origin main
```

### 步骤 2: 等待部署（2-3 分钟）

访问 Cloudflare Dashboard 查看部署进度，或等待 2-3 分钟。

### 步骤 3: 测试修复（5 分钟）

```bash
# 方法 1: 使用健康检查页面（推荐）
open https://chatbot-service-9qg.pages.dev/admin/system-health.html

# 方法 2: 直接测试演示页面
open https://chatbot-service-9qg.pages.dev/demo/goldenyears.html

# 方法 3: 命令行测试
curl https://chatbot-service-9qg.pages.dev/api/goldenyears/faq-menu
```

---

## ✅ 验证清单

打开演示页面后，检查以下项目：

- [ ] 打开 Chatbot（右下角按钮）
- [ ] FAQ 菜单显示正常（不再是 "載入常見問題中..."）
- [ ] 可以看到分类列表（价格、流程等）
- [ ] 点击分类可以展开/收合
- [ ] 点击问题可以发送消息
- [ ] 如果聊天返回 500 错误，执行下方的环境检查

---

## 🔍 如果仍有问题

### 检查环境变量

```bash
# 列出环境变量
wrangler pages secret list --project-name=chatbot-service

# 如果没有 GEMINI_API_KEY，添加它
wrangler pages secret put GEMINI_API_KEY --project-name=chatbot-service
```

### 查看实时日志

```bash
# 打开日志监控
wrangler pages deployment tail --project-name=chatbot-service

# 在另一个窗口测试 Chat API
curl -X POST https://chatbot-service-9qg.pages.dev/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"你好"}'

# 观察日志中的错误信息
```

---

## 📚 详细文档

| 文档 | 描述 |
|-----|-----|
| [PIPELINE_DIAGNOSIS_REPORT.md](./PIPELINE_DIAGNOSIS_REPORT.md) | 完整的系统诊断报告 |
| [PIPELINE_FIX_COMPLETE.md](./PIPELINE_FIX_COMPLETE.md) | 详细的修复说明 |
| [PIPELINE_VISUAL_SUMMARY.md](./PIPELINE_VISUAL_SUMMARY.md) | 可视化总结报告 |
| [admin/system-health.html](./admin/system-health.html) | 交互式测试工具 |

---

## 💡 核心修复

**文件**: `widget/widget.js`  
**方法**: `loadFAQMenu()`  
**修改**: 添加 `companyId` 参数到 API 路径

```javascript
// 修复前
const apiUrl = `${apiBaseUrl}/api/faq-menu`;  // ❌

// 修复后
const companyId = this.config.companyId;
const apiUrl = `${apiBaseUrl}/api/${companyId}/faq-menu`;  // ✅
```

---

## 🎉 预期结果

修复后系统可用性：

```
FAQ 菜单加载: ██████████ 100% ✅
FAQ 分类显示: ██████████ 100% ✅
问题点击发送: ██████████ 100% ✅
AI 聊天回复:  ████████░░  90% ⚠️ (需验证环境变量)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
整体可用性:   █████████░  95% 🎯
```

---

**创建时间**: 2025-12-10  
**修复状态**: ✅ 代码已修复  
**下一步**: 部署 → 测试 → 完成！

