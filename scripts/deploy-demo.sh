#!/bin/bash

# CallKit Demo 部署脚本
# 使用方法: ./scripts/deploy-demo.sh [target]
# target 可以是: github-pages, netlify, vercel, local

set -e

echo "🚀 开始构建 CallKit Demo..."

# 构建项目
npm run build:demo

echo "✅ 构建完成！"

# 检查构建结果
if [ ! -d "dist-demo" ]; then
    echo "❌ 构建失败：dist-demo 目录不存在"
    exit 1
fi

echo "📁 构建文件："
ls -la dist-demo/

# 根据目标进行部署
case "${1:-local}" in
    "github-pages")
        echo "📦 准备部署到 GitHub Pages..."
        # 重命名目录为 docs（GitHub Pages 要求）
        if [ -d "docs" ]; then
            rm -rf docs
        fi
        mv dist-demo docs
        echo "✅ 已重命名 dist-demo 为 docs"
        echo "📝 请执行以下命令推送到 GitHub："
        echo "   git add docs/"
        echo "   git commit -m 'Deploy CallKit demo to GitHub Pages'"
        echo "   git push origin main"
        echo ""
        echo "🔗 然后在 GitHub 仓库设置中启用 GitHub Pages，选择 docs 分支"
        ;;
    "netlify")
        echo "📦 准备部署到 Netlify..."
        echo "📝 请将 dist-demo 目录拖拽到 Netlify 部署界面"
        echo "🔗 或连接 GitHub 仓库，设置构建命令为：npm run build:demo"
        echo "🔗 发布目录设置为：dist-demo"
        ;;
    "vercel")
        echo "📦 准备部署到 Vercel..."
        echo "📝 请连接 GitHub 仓库，设置构建命令为：npm run build:demo"
        echo "🔗 输出目录设置为：dist-demo"
        ;;
    "local"|*)
        echo "📦 本地部署..."
        echo "🚀 启动预览服务器..."
        npm run preview:demo &
        PREVIEW_PID=$!
        
        echo "✅ 预览服务器已启动！"
        echo "🔗 访问地址：http://localhost:4173/demo/callkit/real-call-demo.html"
        echo ""
        echo "📝 要停止预览服务器，请按 Ctrl+C"
        
        # 等待用户中断
        trap "echo '🛑 停止预览服务器...'; kill $PREVIEW_PID 2>/dev/null || true; exit 0" INT
        wait $PREVIEW_PID
        ;;
esac

echo ""
echo "🎉 部署完成！" 