# Golden Years Chatbot Service

獨立 Chatbot 微服務 - 可嵌入任何網站的 SaaS-ready 架構。

## 專案概述

這是從 `goldenyearsphoto` 主專案中分離出來的獨立 Chatbot 微服務，包含：

- **前端 Widget**: 可嵌入任何網站的行動式聊天機器人
- **後端 API**: 基於 Cloudflare Pages Functions 的 API 服務
- **知識庫**: 結構化的 FAQ 和服務資訊

## 專案結構

```
goldenyears-chatbot-service/
├── widget/              # 前端 Widget（CDN 部署）
│   ├── loader.js       # 載入器
│   ├── widget.js       # 核心邏輯
│   ├── widget.css      # 樣式（編譯後）
│   └── src/
│       └── widget.scss # SCSS 原始檔
├── functions/          # Cloudflare Pages Functions
│   └── api/
│       ├── chat.ts     # 主 API 端點
│       ├── chat-pipeline.ts # Pipeline 版本 API
│       ├── faq-menu.ts # FAQ 菜單 API
│       ├── lib/        # 核心庫
│       └── nodes/      # Pipeline 節點
├── knowledge/          # 知識庫 JSON 檔案
├── wrangler.toml       # Cloudflare Pages 配置
├── package.json
└── README.md
```

## 快速開始

### 安裝依賴

```bash
npm install
```

### 本地開發

```bash
# 啟動本地開發伺服器
npm run dev

# 伺服器將在 http://localhost:8788 啟動
```

### 編譯 CSS

```bash
npm run build:css
```

## 部署

### 使用 Wrangler CLI

```bash
# 部署到 Production
npm run deploy

# 部署到 Preview 環境
npm run deploy:preview
```

### 使用 Git 整合

1. 連接 Git 儲存庫到 Cloudflare Pages
2. 設定建置配置（見 `DEPLOYMENT.md`）
3. 推送到 `main` 分支自動部署

詳細部署指南請參考 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。

## 環境變數

在 Cloudflare Pages Dashboard 設定以下環境變數：

### Production 環境（必需）

- `GEMINI_API_KEY`: Google Gemini API Key（必需）
  - 從 [Google AI Studio](https://makersuite.google.com/app/apikey) 取得

### 可選環境變數

- `CHATBOT_ALLOWED_ORIGINS`: 允許的 CORS 來源（可選，用逗號分隔）
  - 預設包含: `https://www.goldenyearsphoto.com`, `https://goldenyearsphoto.com`, `localhost`

範例環境變數檔案見 [`.env.example`](./.env.example)。

## 嵌入 Widget

### 基本嵌入

在目標網站加入以下代碼：

```html
<script 
  src="https://chatbot-api.goldenyearsphoto.com/widget/v1/loader.js" 
  data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/chat"
  data-api-base-url="https://chatbot-api.goldenyearsphoto.com"
  defer
></script>
```

### 首頁自動打開

```html
<script 
  src="https://chatbot-api.goldenyearsphoto.com/widget/v1/loader.js" 
  data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/chat"
  data-api-base-url="https://chatbot-api.goldenyearsphoto.com"
  data-page-type="home"
  data-auto-open="true"
  defer
></script>
```

### 自訂配置

```html
<script 
  src="https://chatbot-api.goldenyearsphoto.com/widget/v1/loader.js" 
  data-api-endpoint="https://chatbot-api.goldenyearsphoto.com/api/chat"
  data-api-base-url="https://chatbot-api.goldenyearsphoto.com"
  data-page-type="embed"
  data-theme="light"
  data-locale="zh-TW"
  data-auto-open="false"
  defer
></script>
```

## API 端點

### Chat API

```
POST /api/chat
Content-Type: application/json

{
  "message": "用戶訊息",
  "sessionId": "session-id"
}
```

### FAQ Menu API

```
GET /api/faq-menu
```

## 文檔

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - 完整部署指南
- [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) - 部署檢查清單
- [`.env.example`](./.env.example) - 環境變數範例

詳細的分離計劃和實施細節請參考原專案的 `CHATBOT_SEPARATION_PLAN.md` 文件。

## 故障排除

### API 返回 CORS 錯誤

檢查 `CHATBOT_ALLOWED_ORIGINS` 環境變數是否包含請求來源。

### Widget 無法載入

1. 檢查 Widget 檔案 URL 是否正確
2. 檢查瀏覽器 Console 錯誤訊息
3. 確認檔案路徑在 Cloudflare Pages 中可訪問

### API 返回 500 錯誤

1. 檢查 Cloudflare Pages 日誌
2. 確認 `GEMINI_API_KEY` 環境變數已設定
3. 檢查 API 請求格式是否正確

更多故障排除資訊請參考 [`DEPLOYMENT.md`](./DEPLOYMENT.md#故障排除)。

## 授權

ISC

