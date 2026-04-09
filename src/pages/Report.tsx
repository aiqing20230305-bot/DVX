import React, { useState, useEffect } from 'react'
import { Zap, BookOpen } from 'lucide-react'
import { useProjectStore } from '../store/project.store.js'
import { Button } from '../components/shared/Button.js'
import { ReportPreview } from '../components/report/ReportPreview.js'
import { ExportPanel } from '../components/report/ExportPanel.js'
import { api } from '../api/client.js'
import { kbApi } from '../api/kb.api.js'

export function Report() {
  const { activeProjectId, projects } = useProjectStore()
  const [reportHtml, setReportHtml] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeProject = projects.find(p => p.id === activeProjectId)

  // Load existing report on mount
  useEffect(() => {
    if (!activeProjectId) {
      setLoading(false)
      return
    }

    setLoading(true)
    api.get<{ html: string | null }>(`/report/${activeProjectId}`)
      .then(({ html }) => {
        if (html) {
          setReportHtml(html)
        }
      })
      .catch((err) => {
        console.error('Failed to load report:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [activeProjectId])

  const handleGenerate = async () => {
    if (!activeProjectId) return
    setGenerating(true)
    setError(null)
    try {
      const { html } = await api.post<{ html: string }>('/report/generate', { projectId: activeProjectId })
      setReportHtml(html)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveToKB = async () => {
    if (!activeProjectId || !reportHtml) return
    await kbApi.create({
      type: 'report',
      title: `${activeProject?.name ?? '未命名'} · 战略报告`,
      content: reportHtml,
      tags: ['报告', '战略'],
      projectId: activeProjectId
    })
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="report-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl border flex items-center justify-center" style={{
            backgroundColor: 'rgba(99, 91, 255, 0.2)',
            borderColor: 'rgba(99, 91, 255, 0.3)'
          }}>
            <Zap size={18} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>战略报告</h1>
        </div>
        <p className="text-sm ml-12" style={{ color: 'var(--color-text-tertiary)' }}>汇总洞察、选题、脚本，生成完整的电商内容战略报告</p>
      </div>

      {/* Controls */}
      <div className="report-controls flex flex-wrap items-center justify-between gap-3 mb-6">
        <Button
          size="lg"
          loading={generating}
          disabled={!activeProjectId}
          onClick={handleGenerate}
          icon={<Zap size={16} />}
        >
          {generating ? '生成中...' : reportHtml ? '重新生成' : '生成报告'}
        </Button>

        {reportHtml && (
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            报告已生成 · 可在下方预览和导出
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="report-error mb-4 p-3 bg-red-900/20 border border-red-700/40 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Main content: preview + export */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="report-preview-container xl:col-span-3">
          <ReportPreview html={reportHtml} loading={loading || generating} />
        </div>
        <div>
          {activeProjectId && (
            <div className="export-panel">
              <ExportPanel
                projectId={activeProjectId}
                reportHtml={reportHtml}
                onSaveToKB={handleSaveToKB}
              />
            </div>
          )}

          {/* Tips */}
          <div className="tips-panel mt-4 border rounded-xl p-4" style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)'
          }}>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} style={{ color: 'var(--color-primary-light)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>使用提示</span>
            </div>
            <ul className="space-y-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <li>• 报告涵盖所有洞察和选题</li>
              <li>• HTML 文件可直接在浏览器打开</li>
              <li>• 浏览器打印可导出为 PDF</li>
              <li>• 保存到知识库便于后续参考</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
