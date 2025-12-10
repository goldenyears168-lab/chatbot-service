# 公司專屬測試頁面

這個目錄包含每個公司的獨立測試頁面，用於在部署到主網站之前測試 Chatbot 功能。

---

## 📋 現有測試頁面

### 1. 好時有影 (goldenyears)

**測試 URL**: https://chatbot-service-multi-tenant.pages.dev/demo/goldenyears.html

**功能**:
- ✅ 完整的 Chatbot Widget 測試
- ✅ 快速測試按鈕（價格、方案、預約）
- ✅ 嵌入代碼範例
- ✅ 公司資訊展示

**使用方式**:
1. 訪問測試頁面
2. 點擊右下角聊天圖標
3. 或使用快速測試按鈕

---

## 🎯 為新公司創建測試頁面

### 步驟 1: 複製模板

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/demo
cp template.html company2.html
```

### 步驟 2: 編輯 company2.html

替換以下內容：

1. **公司名稱**: 將 `[公司名稱]` 替換為實際公司名稱
2. **公司 ID**: 將 `[公司ID]` 替換為實際的公司 ID（例如：`company2`）
3. **公司資訊**: 自定義服務內容、聯絡方式等

關鍵代碼：

```html
<!-- Widget 嵌入代碼 -->
<script 
  src="https://chatbot-service-multi-tenant.pages.dev/widget/loader.js" 
  data-company="company2"
  data-api-endpoint="https://chatbot-service-multi-tenant.pages.dev/api/company2/chat"
  data-api-base-url="https://chatbot-service-multi-tenant.pages.dev"
  defer
></script>
```

### 步驟 3: 配置知識庫

在部署前，確保已為新公司配置：

1. **知識庫文件**: `knowledge/company2/*.json`
2. **公司配置**: `knowledge/companies.json` 中添加 `company2`

### 步驟 4: 部署

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service
npm run deploy -- --commit-dirty=true
```

### 步驟 5: 測試

訪問: https://chatbot-service-multi-tenant.pages.dev/demo/company2.html

---

## 🔧 測試頁面功能說明

### 基本功能

- **開啟 Chatbot**: 手動打開對話窗口
- **快速測試**: 預設問題測試（可自定義）
- **嵌入代碼**: 複製粘貼到主網站使用

### 自定義測試按鈕

在 `<script>` 區塊中添加：

```javascript
function testCustomQuery() {
  openChatbot();
  setTimeout(() => {
    if (window.GYChatbot && window.GYChatbot.sendMessage) {
      window.GYChatbot.sendMessage('你的測試問題');
    }
  }, 1000);
}
```

然後在 HTML 中添加按鈕：

```html
<button class="btn btn-secondary" onclick="testCustomQuery()">測試：自定義問題</button>
```

---

## 📊 測試流程

### 1. 獨立測試（在測試頁面）

```
測試頁面 → 驗證功能 → 調整知識庫 → 重新部署 → 再次測試
```

### 2. 整合測試（在主網站）

當測試頁面驗證通過後：

1. 複製嵌入代碼
2. 添加到主網站的 `base-layout` 或特定頁面
3. 部署主網站
4. 驗證生產環境功能

---

## 🌐 嵌入到主網站

### 全站嵌入（推薦）

在 `base-layout.njk` 或 `_layout.html` 的 `</body>` 前添加：

```html
<script 
  src="https://chatbot-service-multi-tenant.pages.dev/widget/loader.js" 
  data-company="goldenyears"
  data-api-endpoint="https://chatbot-service-multi-tenant.pages.dev/api/goldenyears/chat"
  data-api-base-url="https://chatbot-service-multi-tenant.pages.dev"
  data-page-type="home"
  data-auto-open="true"
  defer
></script>
```

### 特定頁面嵌入

在需要 Chatbot 的頁面中添加相同代碼，調整：
- `data-page-type`: 頁面類型（`home`, `service`, `contact`, 等）
- `data-auto-open`: 是否自動打開（`true` / `false`）

---

## ⚙️ Widget 配置選項

| 參數 | 說明 | 範例值 |
|------|------|--------|
| `data-company` | 公司 ID（必需） | `goldenyears` |
| `data-api-endpoint` | Chat API 端點（必需） | `https://.../api/goldenyears/chat` |
| `data-api-base-url` | API 基礎 URL（必需） | `https://chatbot-service-multi-tenant.pages.dev` |
| `data-page-type` | 頁面類型 | `home`, `service`, `contact`, `other` |
| `data-auto-open` | 自動打開 | `true` / `false` |
| `data-locale` | 語言 | `zh-TW`, `en-US` |
| `data-theme` | 主題 | `light`, `dark` |

---

## 📝 goldenyearsphoto 網站配置

### 當前配置狀態

✅ 已在 `src/_includes/base-layout.njk` 配置
✅ Widget 將顯示在所有頁面
✅ 首頁自動打開，其他頁面需手動點擊

### 配置位置

文件：`/Users/jackm4/Documents/GitHub/goldenyearsphoto/src/_includes/base-layout.njk`

行數：163-171

### 部署步驟

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto

# 構建網站
npm run build

# 提交更改
git add src/_includes/base-layout.njk
git commit -m "Update chatbot widget to use multi-tenant service"

# 推送到遠端（觸發自動部署）
git push
```

---

## 🎯 測試檢查清單

### 測試頁面驗證

- [ ] 頁面正常加載
- [ ] Widget 圖標顯示
- [ ] 點擊圖標打開對話窗
- [ ] 發送消息並收到回覆
- [ ] FAQ 菜單正常顯示
- [ ] 快速回覆按鈕正常工作
- [ ] 真人轉接功能正常

### 主網站驗證

- [ ] Widget 在所有頁面顯示
- [ ] 首頁自動打開功能正常
- [ ] 跨頁面會話保持
- [ ] 移動端響應式正常
- [ ] 不影響原有網站功能
- [ ] 加載性能正常

---

## 🚀 最佳實踐

### 1. 測試優先

在測試頁面完全驗證功能後，再部署到主網站。

### 2. 環境分離

- **測試頁面**: 使用 `data-page-type="demo"`
- **生產環境**: 使用實際頁面類型

### 3. 漸進式部署

1. 先在測試頁面驗證
2. 部署到主網站的單一頁面
3. 確認無誤後擴展到全站

### 4. 監控和反饋

- 觀察用戶使用情況
- 收集反饋
- 持續優化知識庫

---

## 📚 相關文檔

- `../DEPLOYMENT_SUCCESS.md` - 部署成功指南
- `../PROJECT_COMPLETE.md` - 項目完成總結
- `../knowledge/companies.json` - 公司配置文件

---

## 🔗 快速鏈接

- **主服務**: https://chatbot-service-multi-tenant.pages.dev
- **goldenyears 測試頁**: https://chatbot-service-multi-tenant.pages.dev/demo/goldenyears.html
- **Cloudflare Dashboard**: https://dash.cloudflare.com/

---

**最後更新**: 2025-12-10  
**維護者**: Multi-Tenant Chatbot Team
