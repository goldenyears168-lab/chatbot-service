#!/bin/bash
# 智能构建脚本：根据环境自动选择构建方式

# 如果是在 vercel build 环境中（由 @cloudflare/next-on-pages 调用），只执行 next build
if [ -n "$VERCEL" ]; then
  echo "🔍 检测到 VERCEL 环境，执行标准 Next.js 构建..."
  npm run copy:knowledge
  next build
  exit $?
fi

# 如果是在 Cloudflare Pages 环境中，执行 pages:build
if [ -n "$CF_PAGES" ] || [ -n "$CF_PAGES_BRANCH" ]; then
  echo "🔍 检测到 Cloudflare Pages 环境，执行 pages:build..."
  npm run copy:knowledge
  npm run build:next
  npx @cloudflare/next-on-pages
  exit $?
fi

# 默认情况下，只执行标准 Next.js 构建
echo "🔍 执行标准 Next.js 构建..."
npm run copy:knowledge
next build

