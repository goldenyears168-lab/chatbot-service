# 部署檢查清單

使用此檢查清單確保部署過程完整且正確。

---

## 部署前檢查

### 環境準備
- [ ] Cloudflare 帳號已準備
- [ ] Google Gemini API Key 已取得
- [ ] Wrangler CLI 已安裝（`npm install` 完成）

### 檔案檢查
- [ ] `widget/loader.js` 存在且完整
- [ ] `widget/widget.js` 存在且完整
- [ ] `widget/widget.css` 已編譯（執行 `npm run build:css`）
- [ ] `functions/api/chat.ts` 存在
- [ ] `functions/api/faq-menu.ts` 存在
- [ ] `knowledge/*.json` 所有檔案存在
- [ ] `wrangler.toml` 配置正確

### 代碼檢查
- [ ] CORS 配置正確（`01-validate-request.ts`）
- [ ] API 端點路徑正確
- [ ] Widget 載入器配置正確

---

## Cloudflare Pages 設定

### 專案設定
- [ ] 專案名稱: `goldenyears-chatbot-service`
- [ ] 建置命令: （留空或 `npm run build:css`）
- [ ] 輸出目錄: `.`
- [ ] 根目錄: `/`

### 環境變數（Production）
- [ ] `GEMINI_API_KEY` 已設定
- [ ] `CHATBOT_ALLOWED_ORIGINS` 已設定（可選，建議設定）

### 環境變數（Preview，可選）
- [ ] `GEMINI_API_KEY` 已設定
- [ ] `CHATBOT_ALLOWED_ORIGINS` 已設定（可選）

### 自訂域名（可選）
- [ ] API 域名: `chatbot-api.goldenyearsphoto.com`
- [ ] 域名已連接並驗證

---

## 部署執行

### 使用 Wrangler CLI
- [ ] 執行 `npm run build:css` 編譯 CSS
- [ ] 執行 `npm run dev` 本地測試通過
- [ ] 執行 `npm run deploy` 部署到 Production
- [ ] 確認部署成功

### 使用 Git 整合
- [ ] Git 儲存庫已連接
- [ ] 建置配置已設定
- [ ] 環境變數已設定
- [ ] 推送到 `main` 分支觸發部署
- [ ] 確認部署成功

---

## 部署後驗證

### API 端點測試
- [ ] `/api/chat` POST 請求成功
- [ ] `/api/faq-menu` GET 請求成功
- [ ] CORS headers 正確
- [ ] OPTIONS 預檢請求正確處理

### Widget 檔案測試
- [ ] `/widget/v1/loader.js` 可訪問
- [ ] `/widget/v1/widget.js` 可訪問
- [ ] `/widget/v1/widget.css` 可訪問
- [ ] 檔案內容正確（無 404 或錯誤）

### 知識庫測試
- [ ] `/knowledge/services.json` 可訪問
- [ ] 其他知識庫檔案可訪問
- [ ] JSON 格式正確

### 整合測試
- [ ] Widget 可在主網站載入
- [ ] Widget 可與 API 通訊
- [ ] 聊天功能正常
- [ ] FAQ 菜單正常顯示

---

## 主網站整合

### 修改 base-layout.njk
- [ ] 取消註解新的 Widget 載入器腳本
- [ ] API 端點 URL 正確
- [ ] 配置參數正確（pageType, autoOpen 等）

### 重新部署主網站
- [ ] `goldenyearsphoto` 專案重新建置
- [ ] 部署到 Cloudflare Pages
- [ ] 確認 Widget 顯示

---

## 監控和維護

### 日誌檢查
- [ ] Cloudflare Pages 日誌正常
- [ ] 無錯誤訊息
- [ ] API 響應時間正常

### 性能檢查
- [ ] Widget 載入時間 < 2 秒
- [ ] API 響應時間 < 3 秒
- [ ] 無記憶體洩漏

### 功能檢查
- [ ] 聊天功能正常
- [ ] FAQ 功能正常
- [ ] 錯誤處理正常
- [ ] 多個來源可以訪問（CORS 測試）

---

## 問題記錄

如果發現問題，記錄在此：

```
問題描述：
發現時間：
影響範圍：
解決方案：
狀態：□ 已解決 □ 進行中 □ 待處理
```

---

## 簽核

- [ ] 技術檢查完成
- [ ] 功能測試通過
- [ ] 性能測試通過
- [ ] 部署簽核: _________________
- [ ] 日期: _________________

---

**部署完成！** ✅


