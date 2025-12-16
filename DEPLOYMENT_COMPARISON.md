# 部署平台对比：Cloudflare Pages vs Vercel

## 当前问题解决

✅ **已解决**：将 `/knowledge/[company]` 页面改为 Node.js Runtime，绕过 Vercel Edge Function 1MB 限制

## 平台对比

### Cloudflare Pages（免费计划）

**优势：**
- ✅ 完全免费，无 Edge Function 大小限制
- ✅ 全球 CDN 网络
- ✅ 更好的 DDoS 保护
- ✅ 无限带宽（免费计划）

**劣势：**
- ❌ 对 Next.js 支持需要 `@cloudflare/next-on-pages` 转换
- ❌ Edge Runtime 限制更多（无文件系统访问）
- ❌ baseUrl 获取较复杂（但已通过 API route 解决）
- ❌ 配置相对复杂

**现状：**
- ✅ 代码已支持 Cloudflare（使用 Edge Runtime + API route 方案）
- ✅ 之前的问题是 baseUrl 获取，现已解决

### Vercel（免费 Hobby 计划）

**优势：**
- ✅ Next.js 原生支持，配置简单
- ✅ 更好的开发体验
- ✅ 自动 HTTPS 和 CDN
- ✅ 环境变量管理更直观

**劣势：**
- ❌ Edge Function 大小限制：1MB（已解决，改用 Node.js Runtime）
- ❌ 带宽限制：100GB/月（免费计划）
- ❌ 构建时间限制：45分钟/月（免费计划）

## 建议

### 方案 1：继续使用 Vercel（推荐）

**理由：**
- ✅ 已解决大小限制问题（改用 Node.js Runtime）
- ✅ 配置更简单
- ✅ Next.js 原生支持
- ✅ 如果将来需要，可以升级到 Pro 计划（$20/月）

**需要设置：**
1. 环境变量：`NEXT_PUBLIC_BASE_URL`
2. 已改用 Node.js Runtime，无需担心大小限制

### 方案 2：切换回 Cloudflare Pages

**理由：**
- ✅ 完全免费，无大小限制
- ✅ 更适合高流量场景
- ✅ 代码已支持

**需要做的事情：**
1. 在 Cloudflare Dashboard 设置环境变量：`NEXT_PUBLIC_BASE_URL`
2. 将页面改回 Edge Runtime（如果需要）：
   ```typescript
   export const runtime = 'edge'
   ```
3. 但使用 Node.js Runtime 也可以，Cloudflare 支持

## 当前代码状态

### Vercel 配置（当前）
```typescript
// app/knowledge/[company]/page.tsx
export const runtime = 'nodejs'  // 避免 Edge Function 1MB 限制
```

### Cloudflare 配置（如果需要切换）
```typescript
// app/knowledge/[company]/page.tsx
export const runtime = 'edge'  // Cloudflare Pages 推荐使用 Edge Runtime
// 但 Node.js Runtime 也可以工作
```

## 最终建议

### 如果流量不大（< 100GB/月）
→ **使用 Vercel**（当前配置）

**原因：**
- 已解决大小限制问题
- 配置简单
- 开发体验好

### 如果流量很大或需要完全免费
→ **使用 Cloudflare Pages**

**原因：**
- 无大小限制
- 无限带宽
- 完全免费

**操作步骤：**
1. 代码已经支持，只需要：
   - 在 Cloudflare Dashboard 设置环境变量
   - 部署到 Cloudflare Pages
   - （可选）将 runtime 改回 'edge'

## 总结

**Cloudflare 并不是真的有困难**，只是：
1. 配置相对复杂
2. Edge Runtime 限制需要一些额外处理
3. 但这些问题都已经解决了

**现在两个平台都可以工作**，选择哪个主要看你的需求：
- 简单易用 → Vercel
- 完全免费 + 无限带宽 → Cloudflare

