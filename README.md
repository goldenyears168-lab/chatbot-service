# Chatbot Service - Next.js Version

多租户 AI 客服机器人服务，使用 Next.js + TypeScript + shadcn/ui + Supabase。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并填入你的配置：

```bash
cp .env.local.example .env.local
```

### 3. 开发模式

```bash
npm run dev
```

### 4. 构建

```bash
npm run build
npm run pages:build
```

### 5. 预览

```bash
npm run preview
```

### 6. 部署到 Cloudflare Pages

```bash
npm run deploy
```

## 📁 项目结构

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── widget/            # Widget 页面（Iframe 内）
│   └── demo/              # Demo 页面
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   └── chatbot/          # Chatbot 组件
├── lib/                  # 工具函数
│   └── supabase/         # Supabase 客户端
├── public/               # 静态资源
│   └── widget/           # Widget 加载器
└── middleware.ts         # Next.js 中间件（CORS）
```

## 🔧 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: shadcn/ui
- **数据库**: Supabase (PostgreSQL)
- **AI**: Vercel AI SDK + Google Gemini
- **部署**: Cloudflare Pages

## 📝 客户集成

客户只需在网站 `<body>` 标签结束前粘贴：

```html
<script>
  window.smartBotConfig = {
    companyId: "your-company-id",
    themeColor: "#667eea"
  };
</script>
<script src="https://your-domain.com/widget/widget.js" async></script>
```

## 📚 更多信息

查看 [docs](./docs/) 目录了解更多详细信息。
