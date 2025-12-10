# 部署指南

本文檔說明如何部署 Golden Years Chatbot Service 到 Cloudflare Pages。

---

## 前置需求

1. **Cloudflare 帳號** - 用於部署 Pages 專案
2. **Google Gemini API Key** - 從 [Google AI Studio](https://makersuite.google.com/app/apikey) 取得
3. **Wrangler CLI** - Cloudflare 命令行工具（已包含在 `package.json` 中）

---

## 步驟 1: 準備環境變數

### 在 Cloudflare Dashboard 設定環境變數

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 選擇你的帳號
3. 進入 **Pages** → 選擇或創建專案 `goldenyears-chatbot-service`
4. 進入 **Settings** → **Environment variables**

### 設定以下環境變數：

#### Production 環境

| 變數名稱 | 值 | 說明 |
|---------|-----|------|
| `GEMINI_API_KEY` | `your_api_key` | Google Gemini API Key（必需） |
| `CHATBOT_ALLOWED_ORIGINS` | `https://www.goldenyearsphoto.com,https://goldenyearsphoto.com` | 允許的 CORS 來源（可選） |

#### Preview 環境（可選）

設定相同的環境變數，或使用不同的 API Key 用於測試。

---

## 步驟 2: 配置專案結構

### Cloudflare Pages 專案結構

Cloudflare Pages 需要以下結構：

```
goldenyears-chatbot-service/
├── functions/          # Cloudflare Pages Functions
│   └── api/           # API 端點
├── knowledge/         # 知識庫檔案（靜態檔案）
├── widget/            # Widget 檔案（靜態檔案）
│   ├── loader.js
│   ├── widget.js
│   └── widget.css
└── wrangler.toml      # Wrangler 配置
```

**注意**: `knowledge/` 和 `widget/` 目錄中的檔案會被作為靜態檔案部署。

---

## 步驟 3: 部署方式

### 方式 A: 使用 Wrangler CLI（推薦）

#### 安裝依賴
```bash
cd /Users/jackm4/Documents/GitHub/goldenyears-chatbot-service
npm install
```

#### 編譯 CSS（如需要）
```bash
npm run build:css
```

#### 部署到 Production
```bash
npm run deploy
# 或
npx wrangler pages deploy . --project-name=goldenyears-chatbot-service
```

#### 本地測試
```bash
npm run dev
# 或
npx wrangler pages dev
```

### 方式 B: 使用 Git 整合（推薦用於 CI/CD）

1. **連接 Git 儲存庫**
   - 在 Cloudflare Dashboard 中選擇專案
   - 進入 **Settings** → **Builds & deployments**
   - 連接你的 Git 儲存庫（GitHub/GitLab/Bitbucket）

2. **設定建置配置**
   - **Build command**: （留空，或 `npm run build:css` 如果需要在建置時編譯 CSS）
   - **Build output directory**: `.` （根目錄）
   - **Root directory**: `/` （根目錄）

3. **設定環境變數**
   - 在 Cloudflare Dashboard 中設定環境變數（見步驟 1）

4. **自動部署**
   - 推送到 `main` 分支 → 自動部署到 Production
   - 推送到其他分支 → 自動部署到 Preview

---

## 步驟 4: 配置自訂域名（可選）

### API 域名
- 建議: `chatbot-api.goldenyearsphoto.com`
- 在 Cloudflare Dashboard 中設定自訂域名

### Widget CDN 域名
- 建議: `chatbot-cdn.goldenyearsphoto.com`
- 或者在 Pages 專案中創建另一個路由規則

**注意**: Widget 檔案可以從同一個 Pages 專案提供，使用路徑：
- `https://chatbot-api.goldenyearsphoto.com/widget/v1/loader.js`
- `https://chatbot-api.goldenyearsphoto.com/widget/v1/widget.js`
- `https://chatbot-api.goldenyearsphoto.com/widget/v1/widget.css`

---

## 步驟 5: 驗證部署

### 1. 檢查 API 端點

```bash
# 測試 Chat API
curl -X POST https://chatbot-api.goldenyearsphoto.com/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.goldenyearsphoto.com" \
  -d '{"message": "你好", "sessionId": "test-123"}'

# 測試 FAQ Menu API
curl https://chatbot-api.goldenyearsphoto.com/api/faq-menu \
  -H "Origin: https://www.goldenyearsphoto.com"
```

### 2. 檢查 Widget 檔案

```bash
# 檢查 Loader
curl https://chatbot-api.goldenyearsphoto.com/widget/v1/loader.js

# 檢查 Widget JS
curl https://chatbot-api.goldenyearsphoto.com/widget/v1/widget.js

# 檢查 Widget CSS
curl https://chatbot-api.goldenyearsphoto.com/widget/v1/widget.css
```

### 3. 檢查知識庫檔案

```bash
# 檢查知識庫檔案
curl https://chatbot-api.goldenyearsphoto.com/knowledge/services.json
```

---

## 步驟 6: 在主網站中啟用 Widget

### 修改 base-layout.njk

在 `goldenyearsphoto` 專案的 `src/_includes/base-layout.njk` 中，取消註解新的 Widget 載入器：

```njk
{# AI 客服 Widget - 外部載入 #}
<script 
  src="https://chatbot-api.goldenyearsphoto.com/widget/v1/loader.js" 
  data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/chat"
  data-api-base-url="https://chatbot-api.goldenyearsphoto.com"
  data-page-type="{{ pageType | default('other') }}"
  data-auto-open="{{ 'true' if pageType == 'home' else 'false' }}"
  defer
></script>
```

### 重新部署主網站

```bash
cd /Users/jackm4/Documents/GitHub/goldenyearsphoto
npm run build
# 然後部署到 Cloudflare Pages
```

---

## 故障排除

### API 返回 CORS 錯誤

1. 檢查 `CHATBOT_ALLOWED_ORIGINS` 環境變數是否包含請求來源
2. 檢查 `functions/api/nodes/01-validate-request.ts` 中的 CORS 邏輯
3. 確認 OPTIONS 請求正確處理

### Widget 無法載入

1. 檢查 Widget 檔案 URL 是否正確
2. 檢查瀏覽器 Console 錯誤訊息
3. 確認檔案路徑在 Cloudflare Pages 中可訪問

### API 返回 500 錯誤

1. 檢查 Cloudflare Pages 日誌
2. 確認 `GEMINI_API_KEY` 環境變數已設定
3. 檢查 API 請求格式是否正確

### 知識庫檔案無法訪問

1. 確認 `knowledge/` 目錄已部署
2. 檢查檔案路徑是否正確
3. 確認檔案權限

---

## 監控和日誌

### Cloudflare Pages 日誌

在 Cloudflare Dashboard 中：
- **Pages** → 選擇專案 → **Deployments** → 選擇部署 → **Functions** 標籤

### 本地測試日誌

```bash
# 使用 Wrangler 本地測試時查看日誌
npm run dev
```

---

## 回滾部署

如果部署後發現問題：

1. 在 Cloudflare Dashboard 中進入 **Pages** → 選擇專案 → **Deployments**
2. 找到之前的部署版本
3. 點擊 **...** → **Retry deployment** 或 **Promote to production**

---

## 下一步

- ✅ 部署完成後，測試 Widget 在主網站中的功能
- ✅ 監控 API 性能和錯誤率
- ✅ 根據使用情況調整 CORS 配置

---

**部署完成！** 🎉


