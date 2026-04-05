#!/bin/bash

# 超级洞察 - 快速启动脚本
# 用于团队成员快速配置开发环境

set -e

echo "🚀 超级洞察 - 开发环境配置向导"
echo "=================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未安装 Node.js"
    echo "请先安装 Node.js 18 或更高版本"
    echo "访问：https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 错误：Node.js 版本过低（当前：$(node -v)）"
    echo "需要 Node.js 18 或更高版本"
    exit 1
fi

echo "✅ Node.js 版本检查通过：$(node -v)"
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi
echo ""

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚙️  配置环境变量..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo ""
    echo "⚠️  重要：请编辑 .env 文件，填入你的 Claude API Key"
    echo ""
    echo "获取 API Key："
    echo "1. 访问 https://console.anthropic.com/"
    echo "2. 登录账号"
    echo "3. 进入 API Keys 页面"
    echo "4. 创建新的 API Key"
    echo "5. 复制并粘贴到 .env 文件中"
    echo ""

    # 询问是否现在编辑
    read -p "是否现在编辑 .env 文件？(y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    else
        echo "请稍后手动编辑 .env 文件"
    fi
else
    echo "✅ .env 文件已存在"

    # 检查是否配置了 API Key
    if grep -q "your_key_here" .env || grep -q "your_actual_api_key" .env; then
        echo "⚠️  警告：.env 文件中的 API Key 似乎未配置"
        read -p "是否现在编辑 .env 文件？(y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        echo "✅ API Key 已配置"
    fi
fi
echo ""

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p uploads kb-data
echo "✅ 目录创建完成"
echo ""

# 检查端口占用
echo "🔍 检查端口占用..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  警告：端口 3001 已被占用"
    read -p "是否杀死占用端口的进程？(y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        echo "✅ 已释放端口 3001"
    fi
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  警告：端口 5173 已被占用"
    read -p "是否杀死占用端口的进程？(y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:5173 | xargs kill -9 2>/dev/null || true
        echo "✅ 已释放端口 5173"
    fi
fi
echo ""

# 完成
echo "=================================="
echo "🎉 配置完成！"
echo ""
echo "启动开发服务器："
echo "  npm run dev"
echo ""
echo "访问应用："
echo "  前端：http://localhost:5177"
echo "  后端：http://localhost:3001"
echo ""
echo "查看文档："
echo "  README.md      - 项目介绍和使用指南"
echo "  DEPLOYMENT.md  - 部署说明"
echo "  CHECKLIST.md   - 检查清单"
echo ""
