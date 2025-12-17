# 🔧 環境變量設置指南

## ⚠️ 為什麼 Chatbot 不會回答？

如果您的 Chatbot 顯示但不回答問題，**最常見的原因是沒有設置 `GEMINI_API_KEY` 環境變量**。

---

## 📋 必需的環境變量

### GEMINI_API_KEY

**用途**: Google Gemini AI API 密鑰，用於生成 AI 回覆

**如何獲取**:
1. 訪問 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 登入您的 Google 帳號
3. 點擊 "Get API Key" 或 "Create API Key"
4. 複製生成的 API Key

---

## 🚀 在 Cloudflare Pages 設置環境變量

### 步驟 1: 登入 Cloudflare Dashboard

訪問: https://dash.cloudflare.com/

### 步驟 2: 找到您的項目

1. 點擊左側選單的 **Workers & Pages**
2. 找到並點擊 **chatbot-service-multi-tenant** 項目

### 步驟 3: 進入設置

1. 點擊頂部的 **Settings** 標籤
2. 在左側選單中選擇 **Environment variables**

### 步驟 4: 添加環境變量

1. 找到 **Production** 區塊
2. 點擊 **Add variable** 或 **Edit variables**
3. 填寫：
   - **Variable name**: `GEMINI_API_KEY`
   - **Value**: 您的 Gemini API Key（從上面獲取）
4. 點擊 **Save** 保存

### 步驟 5: 重新部署

環境變量設置後，需要重新部署才能生效：

**方式 A: 在 Dashboard 中重新部署**
1. 點擊 **Deployments** 標籤
2. 找到最新的部署
3. 點擊右側的三個點 (⋯)
4. 選擇 **Retry deployment**

**方式 B: 通過命令行重新部署**
```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
npm run deploy -- --commit-dirty=true
```

### 步驟 6: 等待部署完成

通常需要 1-2 分鐘。部署完成後，您的 Chatbot 就可以正常回答問題了！

---

## ✅ 驗證環境變量是否生效

### 測試 1: 訪問測試頁面

1. 訪問: https://chatbot-service-multi-tenant.pages.dev/demo/goldenyears.html
2. 點擊右下角的聊天按鈕
3. 發送消息："你好"
4. 應該收到 AI 的回覆

### 測試 2: 使用 curl 測試 API

```bash
curl -X POST https://chatbot-service-multi-tenant.pages.dev/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"message": "你好", "sessionId": "test-123"}'
```

**成功的回應**應該包含：
```json
{
  "reply": "AI 生成的回覆",
  "intent": "greeting",
  "conversationId": "conv_...",
  ...
}
```

**失敗的回應**（沒有設置環境變量）：
```json
{
  "error": "Internal Server Error",
  "message": "API key not configured"
}
```

---

## 🔍 故障排除

### 問題 1: Chatbot 不顯示

**可能原因**:
- Widget 代碼沒有正確嵌入
- JavaScript 加載失敗
- CORS 配置錯誤

**解決方法**:
1. 檢查瀏覽器開發者工具（F12）的 Console 標籤
2. 確認 `loader.js` 正確加載
3. 檢查 `knowledge/companies.json` 中的 `allowedOrigins`

### 問題 2: Chatbot 顯示但不回答

**可能原因**:
- `GEMINI_API_KEY` 未設置（最常見）
- API Key 無效或過期
- API 配額用完

**解決方法**:
1. 按照上面的步驟設置 `GEMINI_API_KEY`
2. 驗證 API Key 是否有效
3. 檢查 Google AI Studio 的配額

### 問題 3: 回答很慢或超時

**可能原因**:
- Gemini API 響應慢
- 網絡問題
- 知識庫文件過大

**解決方法**:
1. 檢查網絡連接
2. 優化知識庫文件大小
3. 考慮添加緩存機制

### 問題 4: CORS 錯誤

**錯誤訊息**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**解決方法**:
1. 編輯 `knowledge/companies.json`
2. 在對應公司的 `allowedOrigins` 中添加您的域名：
   ```json
   {
     "goldenyears": {
       "allowedOrigins": [
         "https://www.goldenyearsphoto.com",
         "https://goldenyearsphoto.com",
         "http://localhost:8080",
         "您的新域名"
       ]
     }
   }
   ```
3. 重新部署

---

## 📊 環境變量配置檢查清單

- [ ] 已獲取 Gemini API Key
- [ ] 已在 Cloudflare Dashboard 設置 `GEMINI_API_KEY`
- [ ] 已保存環境變量
- [ ] 已重新部署項目
- [ ] 已等待部署完成（1-2 分鐘）
- [ ] 已測試 Chatbot 功能
- [ ] Chatbot 正常回答問題

---

## 🎯 快速測試腳本

### Bash 測試腳本

```bash
#!/bin/bash

echo "🧪 測試 Chatbot API..."

RESPONSE=$(curl -s -X POST https://chatbot-service-multi-tenant.pages.dev/api/goldenyears/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"message": "你好", "sessionId": "test-123"}')

echo "📥 API 回應:"
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.reply' > /dev/null 2>&1; then
  echo "✅ 測試成功！Chatbot 正常運作"
else
  echo "❌ 測試失敗！請檢查環境變量設置"
fi
```

保存為 `test-chatbot.sh`，然後執行：
```bash
chmod +x test-chatbot.sh
./test-chatbot.sh
```

---

## 💡 最佳實踐

### 1. 安全性

- ✅ **不要**在代碼中硬編碼 API Key
- ✅ **使用**環境變量
- ✅ **定期**更換 API Key
- ✅ **監控** API 使用量

### 2. 環境管理

為不同環境使用不同的配置：

- **Production**: 生產環境 API Key
- **Preview**: 測試環境 API Key（可選）

在 Cloudflare Dashboard 中可以分別為 Production 和 Preview 設置不同的環境變量。

### 3. 監控

定期檢查：
- API 使用量
- 錯誤日誌
- 響應時間

可以在 Cloudflare Dashboard 的 **Analytics** 標籤查看。

---

## 📚 相關資源

- **Google AI Studio**: https://aistudio.google.com/
- **Cloudflare Pages 文檔**: https://developers.cloudflare.com/pages/
- **環境變量文檔**: https://developers.cloudflare.com/pages/configuration/build-configuration/

---

## 🆘 需要幫助？

如果按照本指南操作後仍然無法正常工作，請檢查：

1. **Cloudflare Dashboard Logs**:
   - 進入項目 → Deployments → 點擊最新部署 → View build log

2. **瀏覽器開發者工具**:
   - 按 F12 → Console 標籤
   - 查看是否有錯誤訊息

3. **測試 API 直接調用**:
   - 使用上面的 curl 命令
   - 查看詳細的錯誤訊息

---

**最後更新**: 2025-12-10  
**相關文檔**: DEPLOYMENT_SUCCESS.md, COMPANY_DEMO_PAGES.md
