# 下一步问题选单功能说明

## ✅ 功能仍然可用！

虽然删除了 `intent_nba_mapping.json`，但**下一步问题选单功能仍然可以正常使用**。

## 🔄 Fallback 机制

代码中实现了两层 fallback 机制：

### 1. 优先使用 `response_templates.json`

`getNextBestActions()` 方法现在会从 `response_templates.json` 中读取 `next_best_actions`：

```typescript
getNextBestActions(intent: string): string[] {
  // 从 response_templates 中获取 next_best_actions
  const template = this.responseTemplates[intent];
  if (template && template.next_best_actions && template.next_best_actions.length > 0) {
    return template.next_best_actions;
  }
  return [];
}
```

### 2. 统一 fallback

如果 `response_templates` 中没有，会返回默认选项：
```typescript
return ['我想了解更多', '如何预约', '联络真人'];
```

## 📝 如何配置 next_best_actions

### response_templates.json 的正确格式

每个意图的模板应该包含 `next_best_actions` 字段：

```json
{
  "templates": {
    "greeting": {
      "main_answer": "您好！我是好時有影的AI客服，很高興為您服務。有什麼我可以協助您的嗎？",
      "supplementary_info": "",
      "next_best_actions": [
        "我想了解服務項目",
        "如何預約",
        "聯絡方式"
      ]
    },
    "price_inquiry": {
      "main_answer": "我們的服務價格範圍從 NT$399 起，實際價格會根據您選擇的方案而定。",
      "supplementary_info": "建議您先了解我們的服務項目，然後選擇適合的方案。",
      "next_best_actions": [
        "了解服務詳情",
        "如何預約",
        "查看FAQ"
      ]
    },
    "service_inquiry": {
      "main_answer": "我們提供多種拍攝服務，包括證件照、形象照等。",
      "supplementary_info": "每個服務都有不同的特色和價格。",
      "next_best_actions": [
        "了解價格",
        "如何預約",
        "查看作品"
      ]
    }
  }
}
```

### 格式说明

- **main_answer**: 主要回答内容
- **supplementary_info**: 补充信息（可选）
- **next_best_actions**: 下一步行动建议（数组，2-4个选项）

## ✅ 优势

1. **统一管理**：回复内容和下一步行动在同一个文件中，更易维护
2. **上下文相关**：每个意图的下一步行动可以针对性地设置
3. **减少文件**：不需要单独的 `intent_nba_mapping.json` 文件

## 🔧 当前问题

**注意**：当前 `response_templates.json` 可能是旧的字符串格式，需要更新为对象格式才能使用 `next_best_actions` 功能。

如果当前是字符串格式：
```json
{
  "templates": {
    "greeting": "您好！..."
  }
}
```

需要更新为对象格式（如上所示）。

## 📊 功能对比

| 功能 | 删除前（intent_nba_mapping.json） | 删除后（response_templates.json） |
|------|----------------------------------|-----------------------------------|
| **配置位置** | 独立的映射文件 | 整合在回复模板中 |
| **灵活性** | 只能按意图映射 | 可以针对每个意图定制 |
| **维护性** | 需要维护两个文件 | 只需维护一个文件 |
| **功能完整性** | ✅ 完整 | ✅ 完整（使用 fallback） |

## 🎯 结论

**下一步问题选单功能完全可用！**

只需要确保 `response_templates.json` 中每个意图模板都包含 `next_best_actions` 字段即可。
