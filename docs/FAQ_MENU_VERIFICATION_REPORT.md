# FAQ 菜单对应关系验证报告

## 问题发现

从用户截图发现，初始菜单显示的建议问题无法匹配到 FAQ 答案：
- "如何線上預約？" ❌ 找不到对应问题
- "可以改期嗎？" ❌ 找不到对应问题

## 根本原因

**API 从 `public/projects/` 目录加载数据，但该目录下的文件未同步更新**

1. **源文件** (`projects/goldenyears/knowledge/5-faq_detailed.json`) 已更新：
   - "怎麼線上預約？" ✅
   - "當天突然不舒服、不能拍了，可以改期嗎？" ✅

2. **公共文件** (`public/projects/goldenyears/knowledge/5-faq_detailed.json`) 未更新：
   - "如何線上預約？" ❌
   - "可以改期嗎？" ❌

3. **API 数据来源**：
   - `lib/knowledge.ts` 从 `${baseUrl}/projects/${companyId}/knowledge` 加载
   - 这对应 `public/projects/` 目录
   - 所以 API 使用的是旧数据

## 解决方案

已同步更新 `public/projects/goldenyears/knowledge/5-faq_detailed.json` 文件。

## 验证结果

### ✅ 源文件 (projects/)
- 总问题数: 142
- 总 next_best_actions 数量: 426
- 精确匹配: 426
- 找不到对应问题: 0

### ✅ 公共文件 (public/)
- 总问题数: 142
- 总 next_best_actions 数量: 426
- 精确匹配: 426
- 找不到对应问题: 0

### ✅ 文件一致性
- booking_001 的 next_best_actions 在两个文件中一致

## 修正的问题

### booking_001 的 next_best_actions

**修正前（public/）**：
- "如何線上預約？" ❌
- "預約後多久會收到確認信？" ✅
- "可以改期嗎？" ❌

**修正后（已同步）**：
- "怎麼線上預約？" ✅
- "預約後多久會收到確認信？" ✅
- "當天突然不舒服、不能拍了，可以改期嗎？" ✅

## 预防措施

### 建议的同步机制

1. **手动同步**（当前方案）：
   ```bash
   cp projects/goldenyears/knowledge/5-faq_detailed.json public/projects/goldenyears/knowledge/5-faq_detailed.json
   ```

2. **自动化同步**（建议）：
   - 在构建脚本中添加同步步骤
   - 或在部署前自动同步

3. **单一数据源**（最佳实践）：
   - 考虑只使用一个数据源（projects/ 或 public/）
   - 或使用符号链接

## 检查清单

- [x] 检查源文件 (projects/) 的所有 next_best_actions
- [x] 检查公共文件 (public/) 的所有 next_best_actions
- [x] 验证两个文件的一致性
- [x] 同步更新公共文件
- [x] 验证同步后的文件

## 结论

✅ **所有问题已修正**

- 源文件和公共文件都已更新
- 所有 next_best_actions 都能找到对应的问题
- 两个文件已同步一致

现在初始菜单显示的建议问题应该能够正确匹配到 FAQ 答案了。

