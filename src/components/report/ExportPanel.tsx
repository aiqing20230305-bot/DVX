import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Download, BookOpen, CheckCircle2, FileText, Eye, Presentation, FileDown, Share2, Copy, X } from 'lucide-react'
import { Button } from '../shared/Button.js'
import { Modal } from '../shared/Modal.js'
import { toast } from '../../store/toast.store.js'
import { exportReportToPDF } from '../../utils/pdf-export.js'
import { chartToImage, createHiddenChartContainer, cleanupChartContainer } from '../../utils/chart-to-image.js'
import { getInsightDistribution, getTopicPriorityDistribution, getTimelineActivity } from '../../utils/chart-data.js'
import { InsightDistributionChart, TopicPriorityChart, TimelineActivityChart } from './ReportCharts.js'

interface ExportPanelProps {
  projectId: string
  reportHtml: string
  onSaveToKB?: () => void
}

export function ExportPanel({ projectId, reportHtml, onSaveToKB }: ExportPanelProps) {
  const [downloadingHtml, setDownloadingHtml] = useState(false)
  const [downloadingPPT, setDownloadingPPT] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [savedToKB, setSavedToKB] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('default')
  const [showQRModal, setShowQRModal] = useState(false)

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
      toast.success('导出成功', 'HTML报告已下载')
    } catch (error) {
      console.error('导出HTML失败:', error)
      toast.error('导出失败', '请重试')
    } finally {
      setDownloadingHtml(false)
    }
  }

  const generateChartImages = async (): Promise<{ insightChart?: string; topicChart?: string; timelineChart?: string }> => {
    const charts: { insightChart?: string; topicChart?: string; timelineChart?: string } = {}

    try {
      // 1. 获取数据
      const [insightsRes, topicsRes] = await Promise.all([
        fetch(`/api/insight/project/${projectId}`),
        fetch(`/api/topic/project/${projectId}`)
      ])

      const insights = await insightsRes.json()
      const topics = await topicsRes.json()
      const timelineData = await getTimelineActivity(projectId)

      // 2. 生成图表图片（如果有数据）
      // 优化分辨率：容器尺寸放大 + 3x scale = 高清图表
      if (insights.length > 0) {
        const insightData = getInsightDistribution(insights)
        const container = createHiddenChartContainer(900, 600) // 从400x300提升到900x600
        const root = ReactDOM.createRoot(container)
        root.render(<InsightDistributionChart data={insightData} />)

        // 等待渲染完成
        await new Promise(resolve => setTimeout(resolve, 500))

        charts.insightChart = await chartToImage(container, 3) // 3x scale = 2700x1800px
        root.unmount()
        cleanupChartContainer(container)
      }

      if (topics.length > 0) {
        const topicData = getTopicPriorityDistribution(topics)
        const container = createHiddenChartContainer(900, 600) // 从400x300提升到900x600
        const root = ReactDOM.createRoot(container)
        root.render(<TopicPriorityChart data={topicData} />)

        await new Promise(resolve => setTimeout(resolve, 500))

        charts.topicChart = await chartToImage(container, 3) // 3x scale
        root.unmount()
        cleanupChartContainer(container)
      }

      if (timelineData.length > 0) {
        const container = createHiddenChartContainer(1200, 600) // 从600x300提升到1200x600
        const root = ReactDOM.createRoot(container)
        root.render(<TimelineActivityChart data={timelineData} />)

        await new Promise(resolve => setTimeout(resolve, 500))

        charts.timelineChart = await chartToImage(container, 3) // 3x scale = 3600x1800px
        root.unmount()
        cleanupChartContainer(container)
      }
    } catch (error) {
      console.error('生成图表失败:', error)
      // 不阻塞PPT生成，继续执行
    }

    return charts
  }

  const handleExportPPT = async () => {
    setDownloadingPPT(true)
    try {
      // 生成图表图片
      const charts = await generateChartImages()

      const response = await fetch(`/api/report/${projectId}/export-ppt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          charts
        })
      })
      if (!response.ok) {
        throw new Error('PPT导出失败')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `超级洞察_战略报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pptx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('导出成功', 'PPT报告已下载')
    } catch (error) {
      console.error('导出PPT失败:', error)
      toast.error('导出失败', error instanceof Error ? error.message : '请重试')
    } finally {
      setDownloadingPPT(false)
    }
  }

  const handleExportPDF = async () => {
    setDownloadingPDF(true)
    try {
      const filename = `超级洞察_战略报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`
      await exportReportToPDF(reportHtml, filename)
      toast.success('导出成功', 'PDF报告已下载')
    } catch (error) {
      console.error('导出PDF失败:', error)
      toast.error('导出失败', error instanceof Error ? error.message : '请重试')
    } finally {
      setDownloadingPDF(false)
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

  const getShareUrl = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/report/${projectId}`
  }

  const handleShareReport = () => {
    if (!reportHtml) {
      toast.error('无法分享', '请先生成报告')
      return
    }
    setShowQRModal(true)
  }

  const handleCopyShareLink = async () => {
    const shareUrl = getShareUrl()
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('已复制', '分享链接已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      toast.error('复制失败', '请手动复制链接')
    }
  }

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: 'var(--color-bg-elevated-1)', borderColor: 'var(--color-border)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>导出与分享</h3>

      {/* Export Format Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* PDF Card */}
        <div
          onClick={() => !(!reportHtml) && handlePrintToPDF()}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            !reportHtml ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--color-primary)] hover:shadow-md'
          }`}
          style={{
            backgroundColor: 'var(--color-bg-elevated-2)',
            borderColor: 'var(--color-border)'
          }}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
              <FileText size={24} style={{ color: '#DC2626' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>PDF 格式</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>通用格式 · 约2-5MB</div>
            </div>
          </div>
        </div>

        {/* PPT Card */}
        <div
          onClick={() => !(!reportHtml || downloadingPPT) && handleExportPPT()}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            !reportHtml || downloadingPPT ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--color-primary)] hover:shadow-md'
          }`}
          style={{
            backgroundColor: 'var(--color-bg-elevated-2)',
            borderColor: 'var(--color-border)'
          }}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)' }}>
              <Presentation size={24} style={{ color: '#EA580C' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>PPT 格式</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>演示文稿 · 约5-10MB</div>
            </div>
          </div>
        </div>

        {/* HTML Card */}
        <div
          onClick={() => !(!reportHtml || downloadingHtml) && handleExportHTML()}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            !reportHtml || downloadingHtml ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--color-primary)] hover:shadow-md'
          }`}
          style={{
            backgroundColor: 'var(--color-bg-elevated-2)',
            borderColor: 'var(--color-border)'
          }}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(94, 106, 210, 0.1)' }}>
              <Download size={24} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>HTML 格式</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>网页文件 · 约1-2MB</div>
            </div>
          </div>
        </div>

        {/* Share QR Card */}
        <div
          onClick={() => !(!reportHtml) && handleShareReport()}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            !reportHtml ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--color-primary)] hover:shadow-md'
          }`}
          style={{
            backgroundColor: 'var(--color-bg-elevated-2)',
            borderColor: 'var(--color-border)'
          }}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <Share2 size={24} style={{ color: '#10B981' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>分享二维码</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>生成链接 · 移动扫码</div>
            </div>
          </div>
        </div>
      </div>

      {/* PPT Template Selector */}
      <div className="space-y-2 mb-3">
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>PPT模板</label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent"
          style={{
            backgroundColor: 'var(--color-bg-elevated-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
          disabled={!reportHtml}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 91, 255, 0.2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <option value="default">默认深色模板（紫蓝）</option>
          <option value="fmcg">快消品模板（活力红）</option>
          <option value="beauty">美妆模板（优雅粉）</option>
          <option value="food">食品模板（温暖橙）</option>
        </select>
      </div>

      {/* Additional Options */}
      <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
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

      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          HTML 报告可直接在浏览器中打开，支持打印为 PDF
        </p>
      </div>

      {/* QR Code Modal */}
      <Modal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="分享报告"
      >
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              扫描二维码或复制链接分享报告
            </p>

            {/* QR Code Image */}
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-lg border" style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--color-border)' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getShareUrl())}`}
                  alt="报告分享二维码"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>
            </div>

            {/* Share URL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-elevated-2)', borderColor: 'var(--color-border)' }}>
                <input
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                <button
                  onClick={handleCopyShareLink}
                  aria-label="复制分享链接"
                  className="p-2 rounded hover:bg-opacity-80 transition-colors"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#FFFFFF' }}
                  title="复制链接"
                >
                  <Copy size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button
              variant="secondary"
              onClick={() => setShowQRModal(false)}
            >
              关闭
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
