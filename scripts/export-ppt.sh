#!/bin/bash

# PPT 导出脚本

echo "📊 超级洞察 - PPT 导出工具"
echo "=============================="
echo ""

# 检查 Marp CLI 是否安装
if ! command -v marp &> /dev/null; then
    echo "⚠️  Marp CLI 未安装"
    echo ""
    echo "安装方法："
    echo "  npm install -g @marp-team/marp-cli"
    echo ""
    read -p "是否现在安装？(y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g @marp-team/marp-cli
    else
        echo "跳过安装，退出"
        exit 1
    fi
fi

echo "✅ Marp CLI 已安装"
echo ""

# 导出选项
echo "请选择导出格式："
echo "  1) PDF（推荐）"
echo "  2) PowerPoint (PPTX)"
echo "  3) HTML"
echo "  4) 全部格式"
echo "  5) 实时预览"
echo ""
read -p "请选择 (1-5): " choice

case $choice in
    1)
        echo "📄 正在导出 PDF..."
        marp docs/presentation.md --pdf --allow-local-files -o docs/超级洞察-项目介绍.pdf
        echo "✅ PDF 导出完成：docs/超级洞察-项目介绍.pdf"
        ;;
    2)
        echo "📊 正在导出 PPTX..."
        marp docs/presentation.md --pptx --allow-local-files -o docs/超级洞察-项目介绍.pptx
        echo "✅ PPTX 导出完成：docs/超级洞察-项目介绍.pptx"
        ;;
    3)
        echo "🌐 正在导出 HTML..."
        marp docs/presentation.md --html --allow-local-files -o docs/超级洞察-项目介绍.html
        echo "✅ HTML 导出完成：docs/超级洞察-项目介绍.html"
        ;;
    4)
        echo "📦 正在导出所有格式..."
        marp docs/presentation.md --pdf --allow-local-files -o docs/超级洞察-项目介绍.pdf
        marp docs/presentation.md --pptx --allow-local-files -o docs/超级洞察-项目介绍.pptx
        marp docs/presentation.md --html --allow-local-files -o docs/超级洞察-项目介绍.html
        echo "✅ 所有格式导出完成！"
        echo "  - docs/超级洞察-项目介绍.pdf"
        echo "  - docs/超级洞察-项目介绍.pptx"
        echo "  - docs/超级洞察-项目介绍.html"
        ;;
    5)
        echo "👀 启动实时预览..."
        marp docs/presentation.md --preview
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "🎉 完成！"
