#!/bin/bash

echo "🚀 启动超级洞察（团队共享模式）"
echo "======================================"
echo ""

# 检查是否已启动
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "⚠️  端口 3001 已被占用"
    read -p "是否停止旧进程？(y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3001 | xargs kill -9
        echo "✅ 已停止旧进程"
    else
        echo "❌ 取消启动"
        exit 1
    fi
fi

# 启动服务
echo "📦 启动本地服务..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务是否启动成功
if ! curl -s http://localhost:5177 > /dev/null; then
    echo "❌ 服务启动失败"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ 本地服务已启动"
echo "   前端: http://localhost:5177"
echo "   后端: http://localhost:3001"
echo ""

# 提供内网穿透选项
echo "📡 选择访问方式："
echo "  1) 仅局域网访问（同事需要在同一网络）"
echo "  2) 公网访问 - 使用 ngrok（需要安装）"
echo "  3) 公网访问 - 使用 cloudflared（需要安装）"
echo ""
read -p "请选择 (1-3): " choice

case $choice in
    1)
        # 获取本机 IP
        if command -v ipconfig &> /dev/null; then
            # macOS
            LOCAL_IP=$(ipconfig getifaddr en0)
        else
            # Linux
            LOCAL_IP=$(hostname -I | awk '{print $1}')
        fi

        echo ""
        echo "✅ 服务已启动！"
        echo ""
        echo "📱 分享给团队成员："
        echo "   访问地址: http://${LOCAL_IP}:5177"
        echo ""
        echo "⚠️  注意："
        echo "  - 团队成员需要在同一局域网内"
        echo "  - 不要关闭此终端窗口"
        echo ""
        echo "🛑 停止服务: 按 Ctrl+C"
        ;;
    2)
        if ! command -v ngrok &> /dev/null; then
            echo ""
            echo "⚠️  ngrok 未安装"
            echo ""
            echo "安装方法："
            echo "  brew install ngrok"
            echo ""
            echo "安装后重新运行此脚本"
            kill $SERVER_PID 2>/dev/null
            exit 1
        fi

        echo ""
        echo "🌐 启动 ngrok 内网穿透..."
        ngrok http 5177
        ;;
    3)
        if ! command -v cloudflared &> /dev/null; then
            echo ""
            echo "⚠️  cloudflared 未安装"
            echo ""
            echo "安装方法："
            echo "  brew install cloudflared"
            echo ""
            echo "安装后重新运行此脚本"
            kill $SERVER_PID 2>/dev/null
            exit 1
        fi

        echo ""
        echo "🌐 启动 Cloudflare Tunnel..."
        cloudflared tunnel --url http://localhost:5177
        ;;
    *)
        echo "❌ 无效选项"
        kill $SERVER_PID 2>/dev/null
        exit 1
        ;;
esac

# 清理
trap "kill $SERVER_PID 2>/dev/null" EXIT
wait
