# Vercel 部署指南

## 当前状态

✅ 代码已切换到 Vercel  
✅ 构建脚本已支持 Vercel 环境检测  
✅ 所有路由使用 Edge Runtime（Vercel 支持）

## 必需的环境变量

在 Vercel Dashboard 中设置以下环境变量：

### 1. NEXT_PUBLIC_BASE_URL（必需）

**为什么需要：**
- 知识库管理页面需要知道应用的完整 URL
- 用于加载知识库文件和 API 调用

**设置步骤：**
1. 进入 Vercel Dashboard → 你的项目 → Settings → Environment Variables
2. 添加变量：
   - **Key**: `NEXT_PUBLIC_BASE_URL`
   - **Value**: `https://chatbot-git-main-smartbossai.vercel.app`（或你的自定义域名）
   - **Environment**: Production, Preview, Development（全部勾选）

### 2. GEMINI_API_KEY（可选，用于 AI 聊天功能）

如果使用 AI 聊天功能：
- **Key**: `GEMINI_API_KEY`
- **Value**: 你的 Google Gemini API Key
- **Environment**: Production, Preview（推荐）

### 3. 数据库相关环境变量（如果使用）

如果使用 Supabase 或其他数据库，需要设置相应的环境变量。

## 验证部署

### 1. 检查构建日志

在 Vercel Dashboard → Deployments → 最新部署 → Build Logs 中查看：
- ✅ "Compiled successfully"
- ✅ 没有错误信息

### 2. 测试 API Route

访问：`https://你的域名/api/knowledge/company-b`

应该返回 JSON 格式的知识库数据。

### 3. 测试管理页面

访问：`https://你的域名/knowledge/company-b`

应该显示知识库管理界面。

### 4. 测试首页

访问：`https://你的域名/`

应该显示项目列表。

## 常见问题

### 问题 1: 管理页面显示错误

**错误信息**: "Base URL is not available" 或 "Failed to load knowledge data"

**解决方法**:
1. 检查 `NEXT_PUBLIC_BASE_URL` 环境变量是否已设置
2. 确保值是正确的完整 URL（包含 `https://`）
3. 重新部署（环境变量更改后需要重新部署）

### 问题 2: 知识库文件加载失败

**错误信息**: 404 错误

**解决方法**:
1. 确认 `scripts/copy-knowledge.sh` 在构建时已执行
2. 检查 `public/projects/*/knowledge/*.json` 文件是否存在
3. 检查 `_manifest.json` 文件是否已生成

### 问题 3: 构建失败

**可能原因**:
1. TypeScript 错误
2. 依赖安装失败
3. 构建脚本错误

**解决方法**:
1. 查看构建日志中的具体错误信息
2. 本地运行 `npm run build` 测试
3. 检查 `package.json` 中的依赖是否正确

## Vercel vs Cloudflare Pages

### Vercel 优势 ✅
- 对 Next.js 的原生支持更好
- 更简单的配置
- 更好的开发体验
- 自动 HTTPS 和 CDN

### Cloudflare Pages 优势
- 更便宜（免费套餐更慷慨）
- 全球边缘网络
- 更好的 DDoS 保护

## 下一步

1. ✅ 在 Vercel Dashboard 中设置环境变量
2. ✅ 触发新的部署（如果环境变量已更改）
3. ✅ 测试所有功能
4. ✅ 配置自定义域名（可选）

## 部署命令

如果需要手动部署：

```bash
# 本地构建测试
npm run build

# Vercel CLI 部署（需要先安装 vercel CLI）
npm i -g vercel
vercel --prod
```

## 注意事项

- ⚠️ Edge Runtime 在 Vercel 上支持，但某些 Node.js API 不可用
- ⚠️ 文件系统访问只能通过 `public` 目录或 API routes
- ⚠️ 环境变量更改后需要重新部署才能生效

