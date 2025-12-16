# JSON Viewer 控制台升級計劃

## 📊 現況評估

### ✅ 已有基礎（約 40% 完成度）

#### 1. 架構基礎
- ✅ `ClientConsole` - 主容器已建立
- ✅ `AssetDetail` - 已有 Tabs（Overview/Schema/Examples/Raw）
- ✅ `AssetList` - 左側資產列表
- ✅ 基本組件結構完整

#### 2. 現有功能
- ✅ `AssetSchema` - 基本表格顯示
  - ❌ 缺少：搜尋過濾、Copy path、Example 列
- ✅ `AssetExamples` - 基本卡片顯示
  - ❌ 缺少：why it matters、open in raw、copy path
- ✅ `AssetRawJSON` - 基本 JSON 顯示
  - ❌ 缺少：行號、pretty/minify、highlight、wrap toggle
- ✅ `AssetSummary` - Overview 內容完整

### ❌ 缺失功能（需補齊 60%）

1. **AssetHeader** - 完全缺失
   - 版本、最後更新、checksum
   - Copy/Download/Validate 按鈕

2. **JsonSchemaTable** - 需增強
   - ❌ 搜尋過濾功能
   - ❌ Copy key path 功能
   - ❌ Example 列（取樣顯示）

3. **JsonExamples** - 需增強
   - ❌ "Why it matters" 說明
   - ❌ Open in Raw 並 highlight 功能
   - ❌ Copy path 功能

4. **JsonRawViewer** - 需增強
   - ❌ 行號顯示
   - ❌ Pretty/Minify 切換
   - ❌ Wrap/No-wrap 切換
   - ❌ 搜尋 highlight（目前只有過濾）

5. **JsonDiffViewer** - 完全缺失
   - 版本比較功能

6. **Validate 功能** - 完全缺失
   - JSON 驗證規則

7. **Console Design System** - 需建立
   - ❌ 統一的 Typography 系統
   - ❌ CodeBlock 可重用組件
   - ❌ 一致的 Spacing 規範

---

## 🎯 實現計劃（MVP 優先順序）

### Phase 1: 核心組件（2-3 天）

#### 1.1 建立 CodeBlock 組件（最高優先級）

**檔案位置：** `components/console/json-viewer/CodeBlock.tsx`

**功能需求：**
- 行號顯示（左側，select-none，muted）
- Copy 按鈕（右上角，icon only）
- Wrap toggle（Button variant="ghost"）
- Pretty/Minify 切換（DropdownMenu，僅 JSON）
- 搜尋 highlight（可選 highlightRanges）
- Scroll into view（自動滾動到 highlight 行）

**樣式規範：**
- Container: Card with `bg-muted/40` 或 `bg-secondary`
- Code: `text-xs md:text-sm font-mono leading-relaxed`
- Border + rounded-lg
- Max height with scroll

**Cursor 提示詞：**
```
Create a reusable CodeBlock component at components/console/json-viewer/CodeBlock.tsx.

Requirements:
- Accept: code (string), language (string, default "json"), highlightRanges (optional array), searchTerm (optional string)
- Features:
  * Line numbers on left (select-none, text-muted-foreground, fixed width)
  * Copy button (top-right, icon only, shows toast on copy)
  * Wrap toggle (Button variant="ghost", icon)
  * Pretty/Minify toggle (DropdownMenu, only for JSON)
  * Search highlight (if searchTerm provided, highlight matching lines)
  * Scroll into view for highlighted lines
- Styling:
  * Container: Card with bg-muted/40 or bg-secondary
  * Code: text-xs md:text-sm font-mono, leading-relaxed
  * Border + rounded-lg
  * Max height with scroll
- Use shadcn components: Button, DropdownMenu, Tooltip, Card
- Absolute imports only: @/components/ui/*
- Follow Stripe/Vercel docs style (calm, readable)
```

#### 1.2 增強 JsonRawViewer

**檔案位置：** `app/knowledge/[company]/components/AssetRawJSON.tsx`

**需要添加：**
- 整合 CodeBlock 組件
- Pretty/Minify 切換
- Wrap toggle
- 搜尋 highlight（不只是過濾）
- 行號顯示

**Cursor 提示詞：**
```
Enhance AssetRawJSON component to use the new CodeBlock component.

Replace the current <pre> implementation with CodeBlock.

Add features:
- Pretty/Minify toggle (integrate with CodeBlock)
- Wrap toggle (integrate with CodeBlock)
- Search with highlight (not just filter, but highlight matching lines)
- Line numbers (from CodeBlock)
- Keep existing Copy and Download buttons in header

Update the search to highlight instead of filter.
Use absolute imports only: @/components/ui/*
```

#### 1.3 建立 AssetHeader

**檔案位置：** `app/knowledge/[company]/components/AssetHeader.tsx`

**功能需求：**
- Asset name（text-2xl font-semibold）
- Version badge（如果可用）
- Last updated（text-xs muted-foreground）
- Checksum（可選，monospace）
- Action buttons（Copy, Download, Validate）在 header 右側

**Cursor 提示詞：**
```
Create AssetHeader component at app/knowledge/[company]/components/AssetHeader.tsx.

Props: { file: { name, filename, lastModified, size, data } }

Layout:
- Left: Asset name (text-2xl font-semibold tracking-tight)
- Right: Action buttons (Copy, Download, Validate)
- Below name: Meta info (filename, lastModified, size) in muted text-xs

Actions:
- Copy: Copy full JSON
- Download: Download as .json file
- Validate: Show validation results in Alert + Toast

Use shadcn: Badge, Button, DropdownMenu, Alert
Absolute imports only: @/components/ui/*
```

---

### Phase 2: Schema & Examples 增強（1-2 天）

#### 2.1 增強 JsonSchemaTable

**檔案位置：** `app/knowledge/[company]/components/AssetSchema.tsx`

**需要添加：**
1. 搜尋輸入框（Command + K 或 regular Input）
   - 過濾表格（搜尋 key, type, description）
   - 顯示結果數量

2. Copy path 按鈕（每行）
   - Icon button next to key
   - 複製 JSON path（例如："services[0].price"）
   - 顯示 toast on copy

3. Example 列
   - 從 data 中提取樣本值（使用 path）
   - 顯示截斷的 example（max 50 chars）
   - 點擊複製 example value

4. 更好的表格樣式
   - 使用 Console Design System typography
   - Hover effects
   - Better spacing

**Cursor 提示詞：**
```
Enhance AssetSchema component with:

1. Search input (Command + K or regular Input)
   - Filter table by keyword (searches in key, type, description)
   - Show result count

2. Copy path button for each row
   - Icon button next to key
   - Copies JSON path (e.g., "services[0].price")
   - Shows toast on copy

3. Example column
   - Extract sample value from data using the path
   - Show truncated example (max 50 chars)
   - Click to copy example value

4. Better table styling
   - Use Console Design System typography
   - Hover effects
   - Better spacing

Use shadcn: Input, Button, Tooltip, Table
Absolute imports only: @/components/ui/*
```

#### 2.2 增強 JsonExamples

**檔案位置：** `app/knowledge/[company]/components/AssetExamples.tsx`

**需要添加：**
1. "Why it matters" 欄位
   - 添加 1 行商務可讀說明
   - 使用 heuristic：從上下文推斷或允許覆蓋
   - 顯示在 title 下方

2. Copy path 按鈕
   - 添加按鈕複製 JSON path 到此 example
   - 顯示在 card header

3. "Open in Raw" 按鈕
   - 添加按鈕：
     * 切換到 Raw tab
     * 在 Raw viewer 中 highlight example 的 path
   - 使用 state management 協調 tabs

4. 更好的卡片設計
   - 使用 Console Design System
   - Better spacing and typography
   - Code snippet with line clamp（可展開）

**Cursor 提示詞：**
```
Enhance AssetExamples component with:

1. "Why it matters" field
   - Add 1-line business-readable explanation
   - Use heuristic: infer from context or allow override
   - Display below title

2. Copy path button
   - Add button to copy JSON path to this example
   - Show in card header

3. "Open in Raw" button
   - Add button that:
     * Switches to Raw tab
     * Highlights the example's path in Raw viewer
   - Use state management to coordinate between tabs

4. Better card design
   - Use Console Design System
   - Better spacing and typography
   - Code snippet with line clamp (expandable)

Use shadcn: Card, Button, Badge
Absolute imports only: @/components/ui/*
```

---

### Phase 3: Diff & Validate（1-2 天）

#### 3.1 建立 JsonDiffViewer

**檔案位置：** `app/knowledge/[company]/components/AssetDiff.tsx`

**功能需求：**
1. 版本選擇器
   - 兩個 DropdownMenus（Version A, Version B）
   - 目前使用 mock versions 或 file history

2. Diff summary
   - Card 顯示：Added (count), Removed (count), Changed (count)
   - 使用 Badges with colors

3. Structured diff list
   - Table 或 Card list 顯示：
     * Path（json path, monospace）
     * Change type（Badge: added/removed/changed）
     * Before value（code chip, muted if removed）
     * After value（code chip, muted if added）
   - 簡單的 array comparison（如果不相等則視為 changed）

4. 簡單的 diff 演算法
   - 遞迴 object key comparison
   - Array: 按 index 比較或視為 changed
   - 先專注於 top-level changes

**Cursor 提示詞：**
```
Create AssetDiff component at app/knowledge/[company]/components/AssetDiff.tsx.

Features:
1. Version selector
   - Two DropdownMenus (Version A, Version B)
   - For now, use mock versions or file history

2. Diff summary
   - Card showing: Added (count), Removed (count), Changed (count)
   - Use Badges with colors

3. Structured diff list
   - Table or Card list showing:
     * Path (json path, monospace)
     * Change type (Badge: added/removed/changed)
     * Before value (code chip, muted if removed)
     * After value (code chip, muted if added)
   - Simple array comparison (treat as changed if not equal)

4. Simple diff algorithm
   - Recursive object key comparison
   - Array: compare by index or treat as changed
   - Focus on top-level changes first

Use shadcn: Card, Table, Badge, DropdownMenu
Absolute imports only: @/components/ui/*
```

#### 3.2 建立 Validate 功能

**檔案位置：** `lib/console/json-utils.ts`

**功能需求：**
1. `validateJSON(data: unknown, assetType: string)`
   - JSON parse check
   - Required keys check（per asset type）
   - Schema shape validation
   - Return: `{errors: string[], warnings: string[], passed: boolean}`

2. Asset type rules:
   - `services`: must have "services" array, each with "id", "name", "price"
   - `company_info`: must have "contact_channels" or "branches"
   - `faq_detailed`: must have "categories" object
   - `ai_config`: must have "intents" array
   - Make rules extendable

3. Integration:
   - Add Validate button in AssetHeader
   - Show results in Alert（errors/warnings）
   - Show Toast on validation complete

**Cursor 提示詞：**
```
Create validation utilities at lib/console/json-utils.ts.

Functions:
1. validateJSON(data: unknown, assetType: string)
   - JSON parse check
   - Required keys check (per asset type)
   - Schema shape validation
   - Return: {errors: string[], warnings: string[], passed: boolean}

2. Asset type rules:
   - services: must have "services" array, each with "id", "name", "price"
   - company_info: must have "contact_channels" or "branches"
   - faq_detailed: must have "categories" object
   - ai_config: must have "intents" array
   - Make rules extendable

3. Integration:
   - Add Validate button in AssetHeader
   - Show results in Alert (errors/warnings)
   - Show Toast on validation complete
   - Use shadcn: Alert, Toast
```

---

### Phase 4: Design System（1 天）

#### 4.1 Typography 系統

**檔案位置：** `components/console/typography.tsx`

**需要建立：**
- `ConsoleH1`: `text-2xl md:text-3xl font-semibold tracking-tight`
- `ConsoleH2`: `text-lg md:text-xl font-semibold`
- `ConsoleBody`: `text-sm md:text-[15px] text-muted-foreground`
- `ConsoleMeta`: `text-xs text-muted-foreground`
- `ConsoleTableHeader`: `text-xs uppercase tracking-wide text-muted-foreground`
- `ConsoleCodeInline`: `font-mono bg-muted px-1 rounded`

**Cursor 提示詞：**
```
Create typography system at components/console/typography.tsx.

Components:
- ConsoleH1: text-2xl md:text-3xl font-semibold tracking-tight
- ConsoleH2: text-lg md:text-xl font-semibold
- ConsoleBody: text-sm md:text-[15px] text-muted-foreground
- ConsoleMeta: text-xs text-muted-foreground
- ConsoleTableHeader: text-xs uppercase tracking-wide text-muted-foreground
- ConsoleCodeInline: font-mono bg-muted px-1 rounded

Make them reusable React components with proper TypeScript types.
Use forwardRef where appropriate.
```

#### 4.2 Layout 系統

**檔案位置：** `components/console/layout.tsx`

**需要建立：**
- `ConsoleShell`: `max-w-6xl container, py-8 md:py-10`
- `ConsoleSection`: `space-y-6`
- `ConsoleCard`: `p-4 md:p-6`（標準）、`p-3 md:p-4`（code）
- `ConsoleGrid`: `grid md:grid-cols-3 gap-4`（overview）

**Cursor 提示詞：**
```
Create layout system at components/console/layout.tsx.

Components:
- ConsoleShell: max-w-6xl container, py-8 md:py-10
- ConsoleSection: space-y-6
- ConsoleCard: p-4 md:p-6 (standard), p-3 md:p-4 (code)
- ConsoleGrid: grid md:grid-cols-3 gap-4 (overview)

Make them reusable wrapper components.
Use proper TypeScript types and forwardRef.
```

---

## 🎨 設計規範

### Typography 階層

| 用途 | 樣式 | 範例 |
|------|------|------|
| Page title | `text-2xl md:text-3xl font-semibold tracking-tight` | 知識資產控制台 |
| Section title | `text-lg md:text-xl font-semibold` | 總覽 |
| Body | `text-sm md:text-[15px] text-muted-foreground` | 描述文字 |
| Meta | `text-xs text-muted-foreground` | 最後更新時間 |
| Table header | `text-xs uppercase tracking-wide text-muted-foreground` | FIELD NAME |

### Spacing 規範

| 用途 | 樣式 |
|------|------|
| Page padding | `py-8 md:py-10` |
| Section gap | `space-y-6` 或 `space-y-8` |
| Card padding（標準） | `p-4 md:p-6` |
| Card padding（code） | `p-3 md:p-4` |
| Grid gap | `gap-4`（overview）或 `gap-6`（detail） |

### Badge 類型

| 類型 | 用途 | Variant |
|------|------|---------|
| Status | Success/Warning/Destructive | `default` / `destructive` / `secondary` |
| Type | string/number/object/array | `outline`（淡色） |
| Scope | Used in FAQ/Widget/Routing | `secondary` |

### 色彩策略

- **減少邊框**：多用背景層級，少用 border
- **卡片邊框**：`border-border/60`（淡）
- **區塊分隔**：使用 Separator，不要用多個 Card
- **CTA 位置**：固定在 Header 右側

### Code Block 規範

- **Container**：Card 內嵌
- **工具列**：Copy button（icon）、Wrap toggle、Pretty/Minify
- **Code 本體**：
  - `text-xs md:text-sm font-mono`
  - `leading-relaxed`
  - `bg-muted/40` 或 `bg-secondary`
  - `border + rounded-lg`
- **行號**：左側 `select-none text-muted-foreground`
- **Highlight**：
  - 搜尋命中：背景淡 highlight
  - 被點到的 path：更強 highlight（scroll into view）

---

## 📋 MVP 實施檢查清單

### Day 1: CodeBlock + Raw 增強
- [ ] 建立 `components/console/json-viewer/CodeBlock.tsx`
- [ ] 整合 CodeBlock 到 `AssetRawJSON.tsx`
- [ ] 添加 Pretty/Minify/Wrap 功能
- [ ] 實現搜尋 highlight（不只是過濾）
- [ ] 添加行號顯示

### Day 2: Header + Schema 增強
- [ ] 建立 `AssetHeader.tsx`
- [ ] 整合 Header 到 `AssetDetail.tsx`
- [ ] 增強 `AssetSchema.tsx`：
  - [ ] 添加搜尋輸入框
  - [ ] 添加 Copy path 按鈕（每行）
  - [ ] 添加 Example 列
  - [ ] 改善表格樣式

### Day 3: Examples + Diff
- [ ] 增強 `AssetExamples.tsx`：
  - [ ] 添加 "Why it matters" 說明
  - [ ] 添加 Copy path 按鈕
  - [ ] 添加 "Open in Raw" 按鈕
  - [ ] 改善卡片設計
- [ ] 建立 `AssetDiff.tsx` 組件
- [ ] 添加 Diff tab 到 `AssetDetail.tsx`

### Day 4: Validate + Design System
- [ ] 建立 `lib/console/json-utils.ts`（驗證功能）
- [ ] 整合 Validate 到 `AssetHeader.tsx`
- [ ] 建立 `components/console/typography.tsx`
- [ ] 建立 `components/console/layout.tsx`
- [ ] 統一所有組件樣式（使用 Design System）

---

## 🔧 技術細節

### 檔案結構

```
components/
  console/
    json-viewer/
      CodeBlock.tsx          # 可重用 CodeBlock 組件
    typography.tsx            # Typography 系統
    layout.tsx                # Layout 系統

app/knowledge/[company]/
  components/
    AssetHeader.tsx           # Asset header（新增）
    AssetDetail.tsx           # 主組件（需更新）
    AssetSchema.tsx           # Schema 表格（需增強）
    AssetExamples.tsx         # Examples 卡片（需增強）
    AssetRawJSON.tsx          # Raw JSON（需增強）
    AssetDiff.tsx             # Diff viewer（新增）

lib/console/
  json-utils.ts               # 驗證工具（新增）
```

### 依賴需求

**現有 shadcn 組件（已安裝）：**
- ✅ Button
- ✅ Card
- ✅ Table
- ✅ Input
- ✅ Badge
- ✅ Tabs

**可能需要新增：**
- ⚠️ DropdownMenu（用於 Pretty/Minify）
- ⚠️ Tooltip（用於 Copy 按鈕提示）
- ⚠️ Alert（用於 Validate 結果）
- ⚠️ Toast（用於操作反饋）
- ⚠️ Separator（用於區塊分隔）

### 狀態管理

**AssetDetail 需要管理：**
- `activeTab` - 當前 tab
- `highlightPath` - 要 highlight 的 JSON path（用於 Examples → Raw 跳轉）
- `searchTerm` - 搜尋關鍵字（共享於 Schema/Raw）

**建議使用：**
- React `useState`（簡單狀態）
- Context API（如果需要跨組件共享）

---

## 🚀 快速開始

### Step 1: 安裝必要組件（如果需要）

```bash
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tooltip
npx shadcn@latest add alert
npx shadcn@latest add toast
npx shadcn@latest add separator
```

### Step 2: 建立 CodeBlock 組件

使用上面的 Cursor 提示詞建立 `CodeBlock.tsx`

### Step 3: 增強現有組件

按照 Phase 1-4 的順序逐步增強

---

## 📝 注意事項

1. **絕對路徑導入**：所有組件必須使用 `@/components/ui/*`，不使用相對路徑
2. **繁體中文**：所有 UI 文字使用繁體中文
3. **台灣用詞**：使用台灣慣用詞彙（例如：檔案、設定、元件）
4. **響應式設計**：確保 mobile/tablet/desktop 都能正常顯示
5. **無障礙性**：確保鍵盤導航和螢幕閱讀器支援
6. **效能優化**：大型 JSON 使用虛擬滾動或分頁

---

## 🎯 成功標準

完成後應該達到：
- ✅ 所有 JSON 資產都有完整的查看體驗
- ✅ Schema 表格可搜尋、可複製路徑
- ✅ Examples 有商務說明、可跳轉到 Raw
- ✅ Raw JSON 有完整的工具列（Pretty/Minify/Wrap/行號）
- ✅ Diff 功能可比較版本
- ✅ Validate 功能可檢查資料完整性
- ✅ 統一的設計系統，視覺一致
- ✅ 符合 Stripe/Vercel 風格的專業外觀

---

## 📚 參考資源

- [shadcn/ui 文檔](https://ui.shadcn.com/)
- [Stripe API 文檔](https://stripe.com/docs/api)（設計參考）
- [Vercel Dashboard](https://vercel.com/dashboard)（設計參考）
- [Next.js 文檔](https://nextjs.org/docs)

---

**最後更新：** 2025-01-20  
**狀態：** 計劃階段  
**負責人：** 待指派

