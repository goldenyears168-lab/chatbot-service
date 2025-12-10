#!/bin/bash

# Chatbot Service 部署脚本
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署 Chatbot Service..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 chatbot-service/goldenyears 目录下运行此脚本"
    exit 1
fi

# 步骤 1: 安装依赖
echo "📦 步骤 1: 安装依赖..."
npm install

# 步骤 2: 编译 CSS
echo "🎨 步骤 2: 编译 CSS..."
npm run build:css

# 步骤 3: 本地测试（可选）
read -p "是否先进行本地测试？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧪 启动本地测试服务器..."
    echo "   访问 http://localhost:8788 进行测试"
    echo "   按 Ctrl+C 停止服务器后继续部署"
    npm run dev
fi

# 步骤 4: 部署到 Cloudflare Pages
echo "☁️  步骤 4: 部署到 Cloudflare Pages..."
read -p "确认部署到 Production？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run deploy
    echo "✅ 部署完成！"
    echo ""
    echo "📋 后续步骤:"
    echo "1. 在 Cloudflare Dashboard 中验证部署状态"
    echo "2. 测试 API 端点: https://chatbot-api.goldenyearsphoto.com/api/chat"
    echo "3. 测试 Widget: https://chatbot-api.goldenyearsphoto.com/widget/loader.js"
    echo "4. 更新 goldenyearsphoto 网站代码"
else
    echo "❌ 部署已取消"
    exit 1
fi
