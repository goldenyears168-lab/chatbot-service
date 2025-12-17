# Next.js → Vite + React Router（含 Cloudflare Pages Functions）遷移紀錄與測試

> 注意：本檔描述「我實際做了哪些步驟」與「你應該如何測試驗證」。
> 你已先做過備份 commit：`git commit -am "Backup before migration to Vite"`，若任何步驟失敗可回滾。

## 目標與邊界

- **目標**：原地把前端從 Next.js App Router 改為 **Vite + React**，路由改為 **react-router-dom**，並把原本 `app/api/**/route.ts` 改為 **Cloudflare Pages Functions**（保留既有功能、CORS、錯誤處理、rate limit、timeout）。
- **邊界**：
  - 不改 Supabase Project（僅調整 env var 命名）。
  - 不改 repo URL / Cloudflare 專案（僅調整 build 設定與 Functions 結構）。
  - 盡量最小 diff：不做無目的重構。

## 你應該知道的差異（遷移原因）

- **啟動**：Next 依賴 `.next`；Vite 依賴 `index.html` + `/src/main.tsx`。
- **路由**：Next `app/**/page.tsx` 檔案路由；Vite 需要 `react-router-dom` 明確宣告路由。
- **環境變數**：Next 客戶端用 `NEXT_PUBLIC_*`；Vite 用 `VITE_*`，讀取方式 `import.meta.env.VITE_*`。
- **API**：Next 的 `app/api/*` 是 Next Runtime；Vite 沒有 serverless API，因此改為 **Cloudflare Pages Functions** 承接 `/api/*`。

## 本次遷移的 UI 路由對照（全量）

原 Next.js `app/**/page.tsx`（4 條）：

- `/` → `app/page.tsx`
- `/demo/:company` → `app/demo/[company]/page.tsx`
- `/knowledge/:company` → `app/knowledge/[company]/page.tsx`
- `/widget/chat?company=...` → `app/widget/chat/page.tsx`

遷移後（Vite + React Router）將對齊同一路徑。

## 實作步驟摘要（會對應到 git diff）

### Step A — 依賴與 scripts

- 修改 `package.json`
  - 移除 `next`、`eslint-config-next`、`@cloudflare/next-on-pages`
  - 新增 `vite`、`@vitejs/plugin-react`、`react-router-dom`
  - scripts：
    - `dev`: `vite`
    - `build`: `tsc && vite build`
    - `preview`: `vite preview`

### Step B — 設定檔置換

- 移除 `next.config.ts`
- 新增 `vite.config.ts`（含 React plugin 與 `@` alias → `./src`）
- 更新 `tsconfig.json`：移除 Next plugin、調整 include/paths 以支援 `src` 與 `functions`

### Step C — Vite 入口

- 新增根目錄 `index.html`，掛載點 `#root`，並引入 `/src/main.tsx`
- 新增 `src/main.tsx`：`createRoot` + 引入全域 CSS
- 新增 `src/App.tsx`：Router 與路由宣告

### Step D — UI 轉為 Client Side Data Fetching

因 Next 的 `app/page.tsx`、`app/**/page.tsx` 原本是 server component（async + 直接呼叫 `lib/config`），Vite 必須改成：

- `useEffect` / loader pattern 透過 `fetch('/api/...')` 取得資料
- `next/link` → `react-router-dom` 的 `Link`
- `next/navigation` 的 `useSearchParams` → `react-router-dom` 的 `useSearchParams`
- `process.env.NEXT_PUBLIC_*` → `import.meta.env.VITE_*`

### Step E — API：Next route → Cloudflare Pages Functions

將下列 Next API routes 改寫為 Functions（路徑保持不變）：

- `/api/:company/chat`
- `/api/:company/config`
- `/api/:company/faq-menu`
- `/api/:company/ui-config`
- `/api/knowledge/:company`

並新增一個小端點供首頁取 company registry：

- `/api/registry`

### Step F — Cloudflare / wrangler

- `wrangler.toml` 的 `pages_build_output_dir` 改為 `dist`
- Cloudflare Pages（Dashboard）需人工調整：
  - Build command：`npm run build`
  - Output directory：`dist`
  - Retry deployment

## 測試計畫（必做）

### 1) 本地乾淨重裝（避免舊 Next 依賴殘留）

```bash
rm -rf node_modules package-lock.json
npm install
```

### 2) 自動化測試

```bash
npm test
npm run build
```

### 3) 手動 UI Smoke Test

```bash
npm run dev
```

逐一開啟（確認路徑對齊原 Next）：

- `/`
- `/knowledge/company-b`（換成你確定存在的 company id）
- `/demo/company-b`
- `/widget/chat?company=company-b`

### 4) 手動 API Smoke Test（本地 dev）

> 依 Functions 實作方式，若你用 `wrangler pages dev`，請用對應的本地端口。

```bash
curl -i http://localhost:5173/api/registry
curl -i http://localhost:5173/api/company-b/config
curl -i http://localhost:5173/api/knowledge/company-b
curl -i http://localhost:5173/api/company-b/faq-menu
curl -i http://localhost:5173/api/company-b/ui-config
```

（chat 為 POST 且可能串流，請用既有 `scripts/test-api.ts` 或 curl 發 JSON）：

```bash
curl -i -X POST http://localhost:5173/api/company-b/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```

## 環境變數改名（必做）

- 本地 `.env`：把所有 `NEXT_PUBLIC_*` 改成 `VITE_*`
  - 例如 `NEXT_PUBLIC_SUPABASE_URL` → `VITE_SUPABASE_URL`
- Cloudflare Pages Env Vars：同步改名（不要把 secrets 印到 log）

## 回滾

- 若遷移失敗：`git reset --hard <backup_commit_sha>`


