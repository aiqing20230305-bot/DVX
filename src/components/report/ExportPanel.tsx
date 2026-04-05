import React, { useState } from 'react'
import { Download, BookOpen, CheckCircle2 } from 'lucide-react'
import { Button } from '../shared/Button.js'

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
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">导出选项</h3>
      <div className="space-y-3">
        <Button
          variant="primary"
          icon={<Download size={15} />}
          onClick={handleExportHTML}
          loading={downloadingHtml}
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

      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-600 text-center">
          HTML 报告可直接在浏览器中打开，支持打印为 PDF
        </p>
      </div>
    </div>
  )
}
