# Client-facing Console 重构计划

## 目标
将知识库管理页面从"工程文件展示"升级为"面向客户的可阅读文档系统 + 可验证 Demo"的 SaaS 级控制台。

## 信息架构（IA）

### 三层结构
1. **Overview（总览）**：非技术客户一眼看懂资产、场景、能力
2. **Asset Detail（资产详情）**：每份 JSON 变成"文件页"：说明、用途、字段、示例、版本、变更记录
3. **Live Demo（可验证）**：用同一份 JSON 驱动 FAQ 搜索 / Chat 测试 / Widget 设定预览

### 导航结构
- Knowledge Assets（知识资产）
- Personas & Policies（角色与策略）
- AI Routing（AI 路由）
- Delivery & Operations（交付与运营）
- Embed & Integrations（嵌入与集成）

## 组件需求

### 需要创建的 shadcn/ui 组件
- Tabs（资产详情页的四个 Tab）
- Accordion（折叠面板）
- Table（Schema 展示）
- Breadcrumb（导航路径）
- Command（搜索/命令面板）
- Dialog（详情弹窗）
- Toast（通知）

### 需要创建的业务组件
- AssetOverview（资产总览）
- AssetDetail（资产详情页）
- AssetSchema（Schema 表格）
- AssetExamples（示例展示）
- AssetRawJSON（JSON 查看器）
- LiveDemo（可验证 Demo）
- AssetSummary（非技术摘要）

## 实施步骤

### Phase 1: 基础组件和布局
1. 安装/创建缺失的 shadcn/ui 组件
2. 重构页面布局为三栏结构
3. 创建 Overview 组件

### Phase 2: 资产详情页
1. 创建 AssetDetail 组件（四个 Tab）
2. 实现 Schema 表格展示
3. 实现示例展示
4. 实现 JSON 查看器（可搜索、可折叠、可复制）

### Phase 3: 非技术摘要
1. 为每种 JSON 类型生成摘要
2. 显示用途、依赖关系、风险提示

### Phase 4: Live Demo
1. FAQ 搜索 Demo
2. Persona 模拟 Demo
3. Widget 设定预览 Demo

### Phase 5: SaaS 级细节
1. Breadcrumb 导航
2. 版本号和变更记录
3. 校验功能
4. Diff 功能

## 文件结构

```
app/knowledge/[company]/
  - page.tsx (主页面，Overview)
  - components/
    - AssetOverview.tsx
    - AssetDetail.tsx
    - AssetSchema.tsx
    - AssetExamples.tsx
    - AssetRawJSON.tsx
    - AssetSummary.tsx
    - LiveDemo.tsx
    - BreadcrumbNav.tsx
  - [asset]/
    - page.tsx (资产详情页)
```

