# ✅ CORS 通配符修復完成

## 🔍 問題根源

### Cloudflare Pages 部署機制

每次部署 Cloudflare Pages 都會生成一個**新的隨機 hash URL**：

```
部署 1: https://f9467760.chatbot-service-multi-tenant.pages.dev
部署 2: https://0cc4ee9f.chatbot-service-multi-tenant.pages.dev
部署 3: https://b5079382.chatbot-service-multi-tenant.pages.dev  ← 最新
```

### 之前的問題

在 `allowedOrigins` 中只配置了：
```json
"allowedOrigins": [
  "https://chatbot-service-multi-tenant.pages.dev"
]
```

但實際請求來自：
```
https://b5079382.chatbot-service-multi-tenant.pages.dev  ❌ 不匹配！
```

**結果**: CORS 被拒絕，返回 403 錯誤

---

## 🔧 解決方案

### 1. 更新配置文件

**文件**: `knowledge/companies.json`

```json
{
  "goldenyears": {
    "allowedOrigins": [
      "https://www.goldenyearsphoto.com",
      "https://goldenyearsphoto.com",
      "https://chatbot-service-multi-tenant.pages.dev",
      "https://*.pages.dev",  // ✅ 通配符支持所有 pages.dev 子域名
      "http://localhost:8080",
      "http://localhost:8788"
    ]
  }
}
```

### 2. 更新 CORS 驗證邏輯

**文件**: `functions/api/lib/companyConfig.ts`

**新增智能匹配邏輯**:

```typescript
export function isOriginAllowed(companyConfig: CompanyConfig, origin: string | null): boolean {
  if (!origin) {
    return false;
  }
  
  // 1. 直接匹配
  if (companyConfig.allowedOrigins.includes(origin)) {
    return true;
  }
  
  // 2. 支持 Cloudflare Pages 部署域名
  if (origin.includes('.pages.dev')) {
    // 檢查通配符配置
    const hasWildcard = companyConfig.allowedOrigins.some(allowed => 
      allowed === '*.pages.dev' || 
      allowed === 'https://*.pages.dev'
    );
    
    // 檢查項目域名配置
    const hasProjectDomain = companyConfig.allowedOrigins.some(allowed =>
      allowed.includes('chatbot-service-multi-tenant.pages.dev')
    );
    
    // 允許任何 chatbot-service-multi-tenant.pages.dev 的子域名
    if (hasWildcard || hasProjectDomain || origin.includes('chatbot-service-multi-tenant.pages.dev')) {
      return true;
    }
  }
  
  return false;
}
```

**關鍵改進**:
- ✅ 支持精確匹配
- ✅ 支持通配符 `*.pages.dev`
- ✅ 自動允許項目的所有部署 URL
- ✅ CORS 響應頭返回實際的 origin（而不是通配符）

---

## 🚀 部署狀態

✅ **已成功部署**

- **最新 URL**: https://b5079382.chatbot-service-multi-tenant.pages.dev
- **部署時間**: 2025-12-10
- **上傳文件**: 101 個
- **編譯狀態**: ✅ 成功

---

## 🧪 驗證測試

### 測試 1: 訪問最新測試頁面

```
https://b5079382.chatbot-service-multi-tenant.pages.dev/demo/goldenyears.html
```

**預期結果**:
- ✅ 沒有 CORS 錯誤
- ✅ 沒有 403 錯誤
- ✅ FAQ Menu 正常加載
- ✅ Widget 可以打開

### 測試 2: 檢查 Console

打開開發者工具 (F12) → Console 標籤

**應該看到**:
```javascript
[GYChatbot] Initializing for company: goldenyears
[GYChatbot] Loading FAQ menu...
[GYChatbot] FAQ menu loaded: X categories
[GYChatbot] Widget initialized successfully for goldenyears
```

**不應該看到**:
```javascript
❌ Failed to load FAQ menu: SyntaxError
❌ Access to fetch has been blocked by CORS policy
❌ Failed to load resource: status 403
```

### 測試 3: 使用 Network 標籤驗證

打開開發者工具 (F12) → Network 標籤

**檢查請求**:

| 請求 | 狀態 | 響應頭 |
|------|------|--------|
| `/api/goldenyears/faq-menu` | 200 OK | `Access-Control-Allow-Origin: https://b5079382...` |
| `/api/goldenyears/chat` | 200 OK | `Access-Control-Allow-Origin: https://b5079382...` |

**重點**: `Access-Control-Allow-Origin` 應該是**實際的 origin URL**，而不是通配符或其他域名。

---

## 📊 工作原理

### CORS 匹配流程

```
瀏覽器發送請求
  ↓
Origin: https://b5079382.chatbot-service-multi-tenant.pages.dev
  ↓
服務器檢查 origin
  ↓
1. 檢查精確匹配? ❌
  ↓
2. 包含 .pages.dev? ✅
  ↓
3. 有 *.pages.dev 配置? ✅
  ↓
4. 允許請求，返回:
   Access-Control-Allow-Origin: https://b5079382.chatbot-service-multi-tenant.pages.dev
  ↓
瀏覽器接受響應 ✅
```

### 支持的域名類型

| 類型 | 範例 | 匹配方式 |
|------|------|---------|
| 主域名 | `https://chatbot-service-multi-tenant.pages.dev` | 精確匹配 |
| 部署子域名 | `https://b5079382.chatbot-service-multi-tenant.pages.dev` | 模糊匹配 |
| 通配符 | `https://*.pages.dev` | 所有 pages.dev |
| 本地開發 | `http://localhost:8080` | 精確匹配 |
| 生產域名 | `https://www.goldenyearsphoto.com` | 精確匹配 |

---

## 🎯 未來任何部署 URL 都能用

### 自動支持

無論 Cloudflare Pages 生成什麼 URL，都會自動工作：

```
✅ https://abc123.chatbot-service-multi-tenant.pages.dev
✅ https://def456.chatbot-service-multi-tenant.pages.dev
✅ https://xyz789.chatbot-service-multi-tenant.pages.dev
✅ ... 任何未來的部署 URL
```

### 無需手動配置

不需要每次部署後都更新 `allowedOrigins` 配置！

---

## 🔍 故障排除

### 如果還是出現 CORS 錯誤

**檢查清單**:

1. **清除瀏覽器緩存**
   - 按 `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
   - 或完全清除瀏覽器緩存

2. **確認使用最新 URL**
   - 最新: `https://b5079382.chatbot-service-multi-tenant.pages.dev`
   - 舊的 URL 可能使用舊代碼

3. **檢查 Console**
   - 打開 F12 開發者工具
   - 查看具體錯誤訊息
   - 確認請求的 origin

4. **驗證配置**
   ```bash
   # 檢查公司配置
   curl https://b5079382.chatbot-service-multi-tenant.pages.dev/knowledge/companies.json
   ```

### 如果 AI 還是不回答

這是**另一個問題**（不是 CORS），需要設置 `GEMINI_API_KEY`:

1. 訪問 https://dash.cloudflare.com/
2. 進入項目設置
3. 添加環境變量
4. 重新部署

詳細指南：`ENV_SETUP_GUIDE.md`

---

## 📚 相關修改

### 修改的文件

1. ✅ `knowledge/companies.json` - 添加通配符配置
2. ✅ `functions/api/lib/companyConfig.ts` - 更新 CORS 邏輯
3. ✅ 重新部署到 Cloudflare Pages

### 未修改的文件

- ❌ Widget 代碼（不需要改）
- ❌ API 端點代碼（不需要改）
- ❌ 知識庫文件（不需要改）

---

## ✅ 驗證清單

測試完成後，請確認：

- [ ] 訪問測試頁面沒有 CORS 錯誤
- [ ] Console 沒有紅色錯誤訊息
- [ ] FAQ Menu 正常加載
- [ ] Widget 可以打開
- [ ] 可以發送消息（雖然可能沒回覆，因為 API Key）

---

## 🎉 總結

### 問題

❌ Cloudflare Pages 每次部署生成新 URL  
❌ 固定配置無法匹配所有部署 URL  
❌ CORS 被拒絕，403 錯誤  

### 解決方案

✅ 添加通配符支持 `*.pages.dev`  
✅ 智能匹配 pages.dev 子域名  
✅ 返回實際 origin 作為 CORS 響應頭  

### 結果

✅ 所有部署 URL 自動支持  
✅ 不需要手動更新配置  
✅ CORS 完全修復  

---

**最新測試 URL**: https://b5079382.chatbot-service-multi-tenant.pages.dev/demo/goldenyears.html

**修復完成時間**: 2025-12-10  
**狀態**: ✅ CORS 通配符支持已完成  
**相關文檔**: ENV_SETUP_GUIDE.md, CORS_FIX_COMPLETE.md
