# 🎯 公司專屬測試頁面指南

每個公司都可以擁有獨立的測試頁面，用於在部署到主網站之前測試和展示 Chatbot 功能。

---

## ✅ 已完成的配置

### 1. 好時有影測試頁面 ✅

**測試 URL**: https://chatbot-service-multi-tenant.pages.dev/demo/goldenyears.html

**功能特色**:
- 📸 公司品牌展示
- 🎯 服務範圍介紹
- 💡 AI 客服功能說明
- 📍 服務據點資訊
- 🧪 即時測試按鈕
- 🔗 嵌入代碼範例

**快速測試**:
- 點擊「開啟 Chatbot」
- 或使用快速測試按鈕：
  - 測試：詢問價格
  - 測試：詢問方案
  - 測試：詢問預約

### 2. goldenyearsphoto 主網站配置 ✅

**配置位置**: `src/_includes/base-layout.njk` (第 163-187 行)

**當前設置**:
```html
<script 
  src="https://chatbot-service-multi-tenant.pages.dev/widget/loader.js" 
  data-company="goldenyears"
  data-api-endpoint="https://chatbot-service-multi-tenant.pages.dev/api/goldenyears/chat"
  data-api-base-url="https://chatbot-service-multi-tenant.pages.dev"
  data-page-type="{{ pageType | default('other') }}"
  data-auto-open="{{ 'true' if pageType == 'home' else 'false' }}"
  defer
></script>
```

**Widget 顯示位置**:
- ✅ 全站顯示（所有頁面）
- ✅ 右下角浮動按鈕
- ✅ 首頁自動打開
- ✅ 其他頁面需手動點擊

---

## 🚀 測試流程

### 階段 1: 獨立測試（測試頁面）

```
1. 訪問測試頁面
   ↓
2. 測試 Chatbot 功能
   ↓
3. 根據反饋調整知識庫
   ↓
4. 重新部署
   ↓
5. 再次驗證
```

**測試頁面 URL**:
https://chatbot-service-multi-tenant.pages.dev/demo/goldenyears.html

### 階段 2: 主網站整合

```
1. 在測試頁面完全驗證
   ↓
2. 已配置在 base-layout.njk ✅
   ↓
3. 部署 goldenyearsphoto 網站
   ↓
4. 驗證生產環境
```

---

## 📋 goldenyearsphoto 網站部署步驟

### 1. 檢查配置（已完成）✅

文件已更新：`src/_includes/base-layout.njk`

### 2. 構建和部署

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto

# 構建網站
npm run build

# 提交更改
git add src/_includes/base-layout.njk
git commit -m "feat: integrate multi-tenant chatbot widget

- Update widget to use chatbot-service-multi-tenant.pages.dev
- Configure company ID as 'goldenyears'
- Enable auto-open on homepage
- Add support for dynamic page types"

# 推送並觸發自動部署
git push
```

### 3. 驗證部署

部署完成後（約 2-3 分鐘），訪問您的網站：

**檢查項目**:
- [ ] 右下角顯示聊天按鈕
- [ ] 點擊按鈕打開對話窗
- [ ] 首頁自動打開 Widget
- [ ] 發送消息並收到回覆
- [ ] FAQ 菜單正常顯示
- [ ] 移動端顯示正常

---

## 🎨 為新公司創建測試頁面

### 快速開始

```bash
cd /Users/jackm4/Documents/GitHub/chatbot-service/demo

# 1. 複製模板
cp template.html company2.html

# 2. 編輯 company2.html
# - 替換 [公司名稱] 為實際名稱
# - 替換 [公司ID] 為實際 ID（例如：company2）

# 3. 配置知識庫
mkdir -p ../knowledge/company2
cp ../knowledge/goldenyears/*.json ../knowledge/company2/

# 4. 更新公司配置
# 編輯 ../knowledge/companies.json，添加 company2

# 5. 部署
cd ..
npm run deploy -- --commit-dirty=true
```

### 訪問新頁面

部署後訪問：
https://chatbot-service-multi-tenant.pages.dev/demo/company2.html

---

## 📊 測試頁面 vs 主網站

| 功能 | 測試頁面 | 主網站 |
|------|---------|--------|
| 目的 | 功能驗證 | 生產使用 |
| 訪問方式 | 直接 URL | 嵌入網站 |
| 測試按鈕 | ✅ 有 | ❌ 無 |
| 公司資訊展示 | ✅ 有 | 視網站而定 |
| 嵌入代碼範例 | ✅ 有 | ❌ 無 |
| 獨立測試 | ✅ 是 | ❌ 否 |
| 生產流量 | ❌ 無 | ✅ 有 |

---

## 💡 使用建議

### 1. 測試優先

在測試頁面完全驗證功能後，再部署到主網站。

### 2. 展示給客戶

使用測試頁面向客戶展示 Chatbot 功能：
- 發送測試 URL
- 客戶可以即時體驗
- 根據反饋調整

### 3. 知識庫調優

在測試頁面上：
- 測試各種問題
- 調整回覆內容
- 優化意圖識別
- 部署後再次測試

### 4. A/B 測試

創建多個測試頁面版本：
- 不同的 Widget 主題
- 不同的自動打開設置
- 不同的快速回覆選項

---

## 🔧 Widget 配置選項

### 基本配置（必需）

```html
<script 
  src="https://chatbot-service-multi-tenant.pages.dev/widget/loader.js" 
  data-company="goldenyears"              <!-- 公司 ID -->
  data-api-endpoint="https://.../api/goldenyears/chat"  <!-- API 端點 -->
  data-api-base-url="https://..."        <!-- API 基礎 URL -->
  defer
></script>
```

### 可選配置

```html
data-page-type="home"          <!-- 頁面類型 -->
data-auto-open="true"          <!-- 自動打開 -->
data-locale="zh-TW"            <!-- 語言 -->
data-theme="light"             <!-- 主題 -->
```

### 頁面類型說明

| 類型 | 說明 | 建議自動打開 |
|------|------|-------------|
| `home` | 首頁 | ✅ 是 |
| `service` | 服務頁面 | ❌ 否 |
| `contact` | 聯絡頁面 | ✅ 是 |
| `faq` | 常見問題 | ✅ 是 |
| `other` | 其他頁面 | ❌ 否 |
| `demo` | 測試頁面 | ❌ 否 |

---

## 📱 應該在哪些頁面嵌入 Widget？

### 推薦方案 A: 全站嵌入（已採用）✅

**優點**:
- 用戶在任何頁面都能獲得幫助
- 跨頁面保持會話
- 實施簡單（在 base-layout 中一次配置）

**配置位置**: `base-layout.njk`

**適用於**: goldenyearsphoto 等大多數網站

### 方案 B: 特定頁面嵌入

**適合的頁面**:
1. **首頁** - 第一印象，建議自動打開
2. **服務頁面** - 幫助選擇方案
3. **聯絡頁面** - 即時解答問題
4. **FAQ 頁面** - 補充常見問題
5. **預約頁面** - 協助預約流程

**不建議的頁面**:
- 關於我們（較少互動需求）
- 部落格文章（可能干擾閱讀）
- 作品展示（專注欣賞作品）

---

## 🎯 goldenyearsphoto 的最佳實踐

### 首頁 (pageType: 'home')
- ✅ 自動打開 Widget
- ✅ 歡迎訊息
- ✅ 展示服務範圍

### 服務頁面 (pageType: 'service')
- ❌ 不自動打開
- ✅ 提供方案諮詢
- ✅ 價格說明

### 聯絡/預約頁面 (pageType: 'contact')
- ✅ 考慮自動打開
- ✅ 協助預約
- ✅ 回答常見問題

### 其他頁面 (pageType: 'other')
- ❌ 不自動打開
- ✅ 隨時可用
- ✅ 保持會話

---

## 📚 相關資源

### 文檔
- `demo/README.md` - 詳細測試頁面指南
- `DEPLOYMENT_SUCCESS.md` - 部署成功指南
- `PROJECT_COMPLETE.md` - 項目完成總結

### 快速鏈接
- **測試頁面**: https://chatbot-service-multi-tenant.pages.dev/demo/goldenyears.html
- **主服務**: https://chatbot-service-multi-tenant.pages.dev
- **Dashboard**: https://dash.cloudflare.com/

---

## ✅ 檢查清單

### Chatbot Service
- [x] 測試頁面已創建
- [x] goldenyears 測試頁面已部署
- [x] 模板文件已創建
- [x] README 文檔已完成
- [ ] 環境變量已設置（GEMINI_API_KEY）⚠️

### goldenyearsphoto 網站
- [x] base-layout.njk 已更新
- [x] Widget 配置正確
- [ ] 代碼已提交
- [ ] 網站已部署
- [ ] 生產環境已驗證

---

## 🎉 下一步

### 1. 立即測試（5 分鐘）

訪問測試頁面：
https://chatbot-service-multi-tenant.pages.dev/demo/goldenyears.html

### 2. 設置環境變量（10 分鐘）

前往 Cloudflare Dashboard 設置 `GEMINI_API_KEY`

### 3. 部署主網站（15 分鐘）

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto
npm run build
git add .
git commit -m "feat: integrate multi-tenant chatbot widget"
git push
```

### 4. 驗證生產環境（5 分鐘）

訪問您的主網站，測試 Widget 功能

---

**總計時間**: 約 35 分鐘即可完成整個流程！

**最後更新**: 2025-12-10  
**部署 URL**: https://chatbot-service-multi-tenant.pages.dev
