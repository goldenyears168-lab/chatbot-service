# CORS 重複標頭修復報告

**日期**: 2025-12-10  
**問題**: Widget 在 goldenyearsphoto.com 上失敗，出現 CORS 錯誤  
**狀態**: ✅ 已修復

---

## 問題診斷

### 錯誤訊息
```
Access to fetch at 'https://chatbot-service-9gq.pages.dev/api/goldenyears/chat'
from origin 'https://www.goldenyearsphoto.com' has been blocked by CORS policy:
The 'Access-Control-Allow-Origin' header contains multiple values
'https://www.goldenyearsphoto.com, https://www.goldenyearsphoto.com',
but only one is allowed.
```

### 根本原因

**CORS 標頭被重複添加了兩次**：

1. **Pipeline Node** (`01-validate-request.ts`) → 設定 `ctx.corsHeaders`
2. **chatHelpers.ts** → `buildResponse()` 使用 `corsHeaders` 構建 Response
3. **chat.ts** → **又再次添加** CORS 標頭 ❌

這導致同一個標頭在 HTTP Response 中出現兩次。

---

## 修復方案

### 1. 移除重複的 CORS 標頭設置

**文件**: `functions/api/[company]/chat.ts`

**修改前**:
```typescript
const response = await pipeline.execute(pipelineContext);

// 9. 添加 CORS 头
const allowedOrigin = getAllowedOrigin(companyConfig, origin);
const responseWithCors = new Response(response.body, {
  status: response.status,
  statusText: response.statusText,
  headers: {
    ...Object.fromEntries(response.headers.entries()),
    'Access-Control-Allow-Origin': allowedOrigin,  // ❌ 重複！
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
});

return responseWithCors;
```

**修改後**:
```typescript
const response = await pipeline.execute(pipelineContext);

// 9. Pipeline 已經處理 CORS 標頭，直接返回
// ⚠️ 注意：不要在這裡再添加 CORS 標頭，會導致重複！
const responseTime = Date.now() - startTime;
console.log(`[Chat-${companyId}] Request completed in ${responseTime}ms`);

return response;  // ✅ 直接返回，不再添加標頭
```

---

### 2. 使用公司配置而非硬編碼 Origins

#### 2.1 更新 PipelineContext 介面

**文件**: `functions/api/lib/pipeline.ts`

**新增欄位**:
```typescript
export interface PipelineContext {
  // ...
  companyId?: string;       // ✅ 新增
  companyConfig?: any;      // ✅ 新增：用於 CORS 配置
  // ...
}
```

#### 2.2 在 chat.ts 中傳遞公司配置

**文件**: `functions/api/[company]/chat.ts`

```typescript
const pipelineContext: PipelineContext = {
  request,
  env,
  companyId,
  companyConfig,        // ✅ 傳遞公司配置
  knowledgeBase,
  llmService,
  contextManager,
  body: null,
  corsHeaders: {},      // ✅ 初始化為空
  // ...
};
```

#### 2.3 更新 Validate Node 使用公司配置

**文件**: `functions/api/nodes/01-validate-request.ts`

**修改前** (硬編碼):
```typescript
function buildCorsHeaders(request: Request, env?: any): Record<string, string> {
  const defaults = [
    'https://www.goldenyearsphoto.com',
    'https://goldenyearsphoto.com',
    // ... 硬編碼域名
  ];
  // ...
}
```

**修改後** (使用公司配置):
```typescript
function buildCorsHeaders(request: Request, companyConfig?: any): Record<string, string> {
  const origin = request.headers.get('Origin');
  
  // 使用公司配置的 allowedOrigins
  const allowedOrigins = companyConfig.allowedOrigins;
  
  // 檢查 origin 是否在允許列表中
  let allowedOrigin = null;
  if (origin) {
    // 直接匹配
    if (allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    }
    // 支持通配符匹配（例如 *.pages.dev）
    else if (origin.includes('.pages.dev') && 
             (allowedOrigins.includes('*.pages.dev') || 
              allowedOrigins.includes('https://*.pages.dev'))) {
      allowedOrigin = origin;
    }
  }
  
  // Fallback
  if (!allowedOrigin) {
    allowedOrigin = allowedOrigins[0];
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
```

---

## 驗證配置

**文件**: `knowledge/companies.json`

```json
{
  "goldenyears": {
    "id": "goldenyears",
    "name": "好時有影",
    "name_en": "Golden Years Photo",
    "allowedOrigins": [
      "https://www.goldenyearsphoto.com",  ✅
      "https://goldenyearsphoto.com",      ✅
      "https://chatbot-service-9qg.pages.dev",
      "https://*.pages.dev",
      "http://localhost:8080",
      "http://localhost:8788"
    ],
    // ...
  }
}
```

---

## 測試步驟

### 1. 部署到 Cloudflare Pages

```bash
cd chatbot-service
npm run deploy
# 或
wrangler pages deploy
```

### 2. 在 goldenyearsphoto.com 上測試

1. 打開 https://www.goldenyearsphoto.com
2. 打開瀏覽器開發者工具（Console + Network）
3. 點擊 AI 客服 Widget 按鈕
4. 發送測試訊息

**預期結果**:
- ✅ 沒有 CORS 錯誤
- ✅ Network 標籤中 `Access-Control-Allow-Origin` 只出現一次
- ✅ Widget 正常運作

### 3. 檢查 Response Headers

在 Network 標籤中，檢查 `/api/goldenyears/chat` 的 Response Headers:

**修復前** ❌:
```
Access-Control-Allow-Origin: https://www.goldenyearsphoto.com, https://www.goldenyearsphoto.com
```

**修復後** ✅:
```
Access-Control-Allow-Origin: https://www.goldenyearsphoto.com
```

---

## 相關文件

### 已修改
- ✅ `functions/api/[company]/chat.ts` - 移除重複 CORS 標頭
- ✅ `functions/api/lib/pipeline.ts` - 新增 companyConfig 欄位
- ✅ `functions/api/nodes/01-validate-request.ts` - 使用公司配置

### 檢查無誤
- ✅ `functions/api/[company]/faq-menu.ts` - 沒有重複標頭問題
- ✅ `knowledge/companies.json` - 配置正確

---

## 預防措施

### 原則：單一責任

**CORS 標頭設置規則**：
1. ✅ **Pipeline Nodes** 負責設置 CORS 標頭
2. ✅ **chatHelpers.buildResponse()** 使用 `corsHeaders` 參數
3. ❌ **chat.ts** 不應該再添加 CORS 標頭

### Code Review Checklist

在添加新的 API 端點時：
- [ ] 確認 CORS 標頭只在一個地方設置
- [ ] 使用公司配置的 `allowedOrigins`
- [ ] 測試在生產環境的實際域名
- [ ] 檢查 Network 標籤確認標頭沒有重複

---

## 總結

**問題**: CORS 標頭重複導致 Widget 無法載入  
**原因**: Pipeline 和 chat.ts 都在添加 CORS 標頭  
**解決**: 移除 chat.ts 中的重複設置，並改用公司配置  
**狀態**: ✅ 已修復，待部署測試

