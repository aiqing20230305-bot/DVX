import React, { useState } from 'react'
import { Download, BookOpen, CheckCircle2, FileText, Eye } from 'lucide-react'
import { Button } from '../shared/Button.js'
import { toast } from '../../store/toast.store.js'

interface ExportPanelProps {
  projectId: string
  reportHtml: string
  onSaveToKB?: () => void
}

export function ExportPanel({ projectId, reportHtml, onSaveToKB }: ExportPanelProps) {
  const [downloadingHtml, setDownloadingHtml] = useState(false)
  const [savedToKB, setSavedToKB] = useState(false)

  const handleExportHTML = async () => {
    setDownloadingHtml(true)
    try {
      const response = await fetch(`/api/report/${projectId}/export`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `超级洞察_战略报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.html`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingHtml(false)
    }
  }

  const handleSaveToKB = async () => {
    onSaveToKB?.()
    setSavedToKB(true)
    setTimeout(() => setSavedToKB(false), 3000)
  }

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(reportHtml)
    toast.success('已复制', 'HTML源码已复制到剪贴板')
  }

  const handlePrintToPDF = () => {
    if (!reportHtml) {
      toast.error('无法打印', '请先生成报告')
      return
    }

    // Open print dialog
    window.print()

    // Show helpful toast
    toast.info('打印提示', '在打印对话框中选择"另存为PDF"即可保存')
  }

  const handlePrintPreview = () => {
    if (!reportHtml) {
      toast.error('无法预览', '请先生成报告')
      return
    }

    // Open preview window
    const previewWindow = window.open('', '_blank', 'width=1200,height=900')

    if (!previewWindow) {
      toast.error('预览失败', '请允许弹出窗口')
      return
    }

    // Create preview HTML with A4 paper simulation
    const previewHTML = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>打印预览 - 战略报告</title>
        <style>
          /* Reset */
          * { margin: 0; padding: 0; box-sizing: border-box; }

          /* Page layout - simulate A4 paper */
          body {
            background: #e5e7eb;
            padding: 2rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .preview-container {
            max-width: 21cm;
            min-height: 29.7cm;
            margin: 0 auto;
            padding: 2cm;
            background: white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }

          /* Print button toolbar */
          .preview-toolbar {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1000;
          }

          .print-btn {
            padding: 0.75rem 1.5rem;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
            transition: background 150ms;
          }

          .print-btn:hover {
            background: #4338ca;
          }

          /* Hide toolbar when printing */
          @media print {
            body { background: white; padding: 0; }
            .preview-toolbar { display: none; }
            .preview-container {
              box-shadow: none;
              padding: 0;
              max-width: 100%;
              min-height: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="preview-toolbar">
          <button class="print-btn" onclick="window.print()">🖨️ 打印</button>
        </div>
        <div class="preview-container">
          ${reportHtml}
        </div>
      </body>
      </html>
    `

    previewWindow.document.write(previewHTML)
    previewWindow.document.close()

    toast.success('预览已打开', '可在新窗口中查看打印效果')
  }

  return (
    <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[#1F2329] mb-4">导出选项</h3>
      <div className="space-y-3">
        <Button
          variant="primary"
          icon={<FileText size={15} />}
          onClick={handlePrintToPDF}
          disabled={!reportHtml}
          className="w-full justify-center"
        >
          打印为 PDF
        </Button>

        <Button
          variant="secondary"
          icon={<Eye size={15} />}
          onClick={handlePrintPreview}
          disabled={!reportHtml}
          className="w-full justify-center"
        >
          打印预览
        </Button>

        <Button
          variant="secondary"
          icon={<Download size={15} />}
          onClick={handleExportHTML}
          loading={downloadingHtml}
          disabled={!reportHtml}
          className="w-full justify-center"
        >
          下载 HTML 报告
        </Button>

        <Button
          variant="secondary"
          icon={savedToKB ? <CheckCircle2 size={15} className="text-emerald-400" /> : <BookOpen size={15} />}
          onClick={handleSaveToKB}
          disabled={!reportHtml || savedToKB}
          className="w-full justify-center"
        >
          {savedToKB ? '已保存到知识库' : '保存到知识库'}
        </Button>

        <Button
          variant="ghost"
          onClick={handleCopyHtml}
          disabled={!reportHtml}
          className="w-full justify-center"
        >
          复制 HTML 源码
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-[#DEE0E3]">
        <p className="text-xs text-[#C9CDD4] text-center">
          HTML 报告可直接在浏览器中打开，支持打印为 PDF
        </p>
      </div>
    </div>
  )
}
