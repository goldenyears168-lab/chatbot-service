# Cloudflare Pages 部署问题排查指南

## 当前问题

管理页面 (`/knowledge/[company]`) 在 Cloudflare Pages 上无法访问，出现 404/500 错误。

## 根本原因分析

### 1. Edge Runtime 的限制
- Cloudflare Pages 要求使用 Edge Runtime
- Edge Runtime 的页面组件**无法直接访问 `request` 对象**
- `headers()` 函数在某些情况下**不可靠**

### 2. BaseUrl 获取问题
- API routes 可以通过 `new URL(request.url)` 获取 baseUrl ✅
- 页面组件只能通过 `headers()` 或环境变量获取 baseUrl ❌

## 解决方案

### 方案 1: 设置环境变量（推荐）

**必须设置 `NEXT_PUBLIC_BASE_URL` 环境变量**

1. 进入 Cloudflare Dashboard
2. Workers & Pages → chatbot-service → Settings → Environment variables
3. 添加变量：
   - **Variable name**: `NEXT_PUBLIC_BASE_URL`
   - **Value**: `https://你的域名.pages.dev` 或自定义域名
   - **Environment**: Production 和 Preview 都要设置

### 方案 2: 代码已优化

最新代码已经修改为：
- 页面组件通过 API route (`/api/knowledge/[company]`) 加载数据
- API route 可以从 `request.url` 获取可靠的 baseUrl
- 如果设置了 `NEXT_PUBLIC_BASE_URL`，优先使用环境变量

## 验证步骤

1. **检查环境变量是否设置**
   ```bash
   # 在 Cloudflare Dashboard 中检查
   # 或者在部署日志中查看
   ```

2. **检查 API route 是否工作**
   - 访问: `https://你的域名/api/knowledge/company-b`
   - 应该返回 JSON 数据

3. **检查管理页面**
   - 访问: `https://你的域名/knowledge/company-b`
   - 应该显示管理界面

## 如果仍然失败

### 诊断步骤

1. **检查部署日志**
   - Cloudflare Dashboard → Workers & Pages → chatbot-service → Deployments
   - 查看最新的部署日志，寻找错误信息

2. **检查运行时错误**
   - 打开浏览器开发者工具 → Console
   - 查看是否有错误信息

3. **检查网络请求**
   - 打开浏览器开发者工具 → Network
   - 查看 `/api/knowledge/[company]` 的请求状态

4. **检查知识库文件**
   - 确认 `public/projects/[company]/knowledge/*.json` 文件存在
   - 确认 `_manifest.json` 文件已生成

### 备选方案

如果问题持续，考虑：

1. **使用 Vercel**
   - Vercel 对 Next.js 的原生支持更好
   - 不需要 Edge Runtime 的复杂配置
   - 文件系统访问更容易

2. **使用静态站点生成 (SSG)**
   - 将管理页面改为静态生成
   - 但这会失去动态特性

3. **使用 Node.js Runtime（如果 Cloudflare 支持）**
   - 某些路由可以使用 Node.js Runtime
   - 但这可能不被 Cloudflare Pages 支持

## 当前代码架构

```
页面组件 (/knowledge/[company])
  ↓ (fetch)
API Route (/api/knowledge/[company])
  ↓ (使用 request.url 获取 baseUrl)
loadKnowledgeData (lib/knowledge/loader.ts)
  ↓ (fetch from public directory)
知识库文件 (public/projects/[company]/knowledge/*.json)
```

## 常见错误

### 错误 1: "Base URL is not available"
**原因**: `NEXT_PUBLIC_BASE_URL` 未设置  
**解决**: 在 Cloudflare Dashboard 中设置环境变量

### 错误 2: "Failed to load knowledge data: 404"
**原因**: API route 无法找到知识库文件  
**解决**: 检查知识库文件是否存在，检查 `_manifest.json` 是否生成

### 错误 3: "Failed to load knowledge data: 500"
**原因**: API route 内部错误  
**解决**: 查看服务器日志，检查 baseUrl 是否正确

## 联系支持

如果问题持续，请提供：
1. 部署日志（完整输出）
2. 浏览器 Console 错误信息
3. Network 标签中的请求详情
4. Cloudflare Dashboard 中的环境变量配置截图

