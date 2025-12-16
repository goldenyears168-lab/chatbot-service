# 部署问题修复总结

## 已完成的修复

### 1. 架构调整
- ✅ 页面组件现在通过 API route (`/api/knowledge/[company]`) 加载数据
- ✅ API route 可以从 `request.url` 获取可靠的 baseUrl
- ✅ 移除了页面组件中不可靠的 `headers()` 调用

### 2. 代码优化
- ✅ 简化了 baseUrl 获取逻辑
- ✅ 添加了明确的错误提示
- ✅ 修复了所有 TypeScript 错误

## 必须执行的步骤

### ⚠️ 关键：设置环境变量

**在 Cloudflare Dashboard 中设置 `NEXT_PUBLIC_BASE_URL`：**

1. 登录 Cloudflare Dashboard
2. 进入：Workers & Pages → chatbot-service-9qg → Settings → Environment variables
3. 添加变量：
   - **Variable name**: `NEXT_PUBLIC_BASE_URL`
   - **Value**: 你的实际域名（例如：`https://chatbot-service-9qg.pages.dev`）
   - **Environment**: 
     - ✅ Production（必须）
     - ✅ Preview（必须）

### 验证步骤

1. **重新部署**
   ```bash
   npm run deploy
   ```

2. **检查 API route**
   - 访问: `https://你的域名/api/knowledge/company-b`
   - 应该返回 JSON 数据（不是 404/500）

3. **检查管理页面**
   - 访问: `https://你的域名/knowledge/company-b`
   - 应该显示管理界面

## 如果仍然失败

### 可能的原因

1. **环境变量未设置或设置错误**
   - 检查 Cloudflare Dashboard 中的环境变量
   - 确保变量名完全匹配：`NEXT_PUBLIC_BASE_URL`
   - 确保值是正确的完整 URL（包含 `https://`）

2. **知识库文件未正确复制**
   - 运行: `npm run copy:knowledge`
   - 检查: `public/projects/*/knowledge/*.json` 文件是否存在

3. **构建输出问题**
   - 检查: `.vercel/output/static` 目录是否存在
   - 运行: `npm run pages:build` 查看构建输出

### 备选方案

如果问题持续（超过3小时调试），建议：

1. **切换到 Vercel**（推荐）
   - Vercel 对 Next.js 的原生支持更好
   - 不需要复杂的 Edge Runtime 配置
   - 文件系统访问更容易
   - 设置更简单

2. **使用静态站点生成**
   - 将管理页面改为构建时生成
   - 失去动态特性，但更稳定

## 当前代码流程

```
用户访问 /knowledge/company-b
  ↓
页面组件 (Edge Runtime)
  ↓ 需要 baseUrl（从环境变量或 headers 获取）
fetch(`${baseUrl}/api/knowledge/company-b`)
  ↓
API Route (Edge Runtime)
  ↓ 从 request.url 获取 baseUrl（可靠）
loadKnowledgeData(company, baseUrl)
  ↓
fetch(`${baseUrl}/projects/${company}/knowledge/*.json`)
  ↓
返回知识库数据
```

## 关键要点

- **环境变量是必需的**：`NEXT_PUBLIC_BASE_URL` 必须设置
- **API route 更可靠**：它可以从 `request.url` 获取 baseUrl
- **Edge Runtime 限制**：页面组件无法直接访问 `request` 对象

