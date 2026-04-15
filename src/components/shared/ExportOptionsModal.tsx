/**
 * v2.32.0 Phase 4: 导出选项模态框
 * 替代window.prompt/confirm，提供更好的用户体验
 */

import React, { useState } from 'react'
import { X, FileSpreadsheet, FileText, Presentation, Download, Check } from 'lucide-react'
import { Button } from './Button.js'

/**
 * 导出格式选项
 */
export type ExportFormat = 'excel' | 'pdf' | 'word' | 'ppt'

/**
 * 导出选项接口
 */
export interface ExportOptions {
  title?: string
  theme?: 'light' | 'dark'
  aspectRatio?: '16:9' | '4:3'
  template?: 'default' | 'formal' | 'simple'
  includeTimestamp?: boolean
  author?: string
  showPageNumbers?: boolean
}

/**
 * ExportOptionsModal组件Props
 */
interface ExportOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (format: ExportFormat, options: ExportOptions) => Promise<void>
  itemCount: number
  itemType: string
}

/**
 * 格式卡片数据
 */
const FORMAT_CARDS: Array<{
  format: ExportFormat
  label: string
  icon: React.ReactNode
  description: string
  color: string
}> = [
  {
    format: 'excel',
    label: 'Excel',
    icon: <FileSpreadsheet size={24} />,
    description: '表格数据，支持筛选和排序',
    color: '#107C41'
  },
  {
    format: 'pdf',
    label: 'PDF',
    icon: <FileText size={24} />,
    description: '专业报告，适合打印和分享',
    color: '#DC3545'
  },
  {
    format: 'word',
    label: 'Word',
    icon: <FileText size={24} />,
    description: '可编辑文档，支持模板',
    color: '#2B579A'
  },
  {
    format: 'ppt',
    label: 'PPT',
    icon: <Presentation size={24} />,
    description: '演示文稿，适合汇报',
    color: '#D24726'
  }
]

/**
 * ExportOptionsModal组件
 */
export function ExportOptionsModal({
  isOpen,
  onClose,
  onExport,
  itemCount,
  itemType
}: ExportOptionsModalProps) {
  const [step, setStep] = useState(1) // 1: 格式选择, 2: 配置选项, 3: 确认导出
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null)
  const [options, setOptions] = useState<ExportOptions>({
    title: `${itemType}报告`,
    theme: 'light',
    aspectRatio: '16:9',
    template: 'default',
    includeTimestamp: true,
    author: '超级洞察',
    showPageNumbers: true
  })
  const [exporting, setExporting] = useState(false)

  // 重置状态
  const handleClose = () => {
    setStep(1)
    setSelectedFormat(null)
    setOptions({
      title: `${itemType}报告`,
      theme: 'light',
      aspectRatio: '16:9',
      template: 'default',
      includeTimestamp: true,
      author: '超级洞察',
      showPageNumbers: true
    })
    setExporting(false)
    onClose()
  }

  // 选择格式
  const handleFormatSelect = (format: ExportFormat) => {
    setSelectedFormat(format)
    setStep(2)
  }

  // 返回上一步
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // 执行导出
  const handleExport = async () => {
    if (!selectedFormat) return

    setExporting(true)
    try {
      await onExport(selectedFormat, options)
      handleClose()
    } catch (err) {
      console.error('Export failed:', err)
      setExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              导出 {itemCount} 条{itemType}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              步骤 {step}/2
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Step 1: 格式选择 */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                选择导出格式
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {FORMAT_CARDS.map((card) => (
                  <button
                    key={card.format}
                    onClick={() => handleFormatSelect(card.format)}
                    className="relative p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-lg group"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${card.color}15`, color: card.color }}
                      >
                        {card.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {card.label}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {card.description}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Check size={14} className="text-gray-600 dark:text-gray-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: 配置选项 */}
          {step === 2 && selectedFormat && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                配置导出选项
              </h3>
              <div className="space-y-6">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    报告标题
                  </label>
                  <input
                    type="text"
                    value={options.title}
                    onChange={(e) => setOptions({ ...options, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 作者 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    作者
                  </label>
                  <input
                    type="text"
                    value={options.author}
                    onChange={(e) => setOptions({ ...options, author: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 主题（PDF/Word/PPT） */}
                {(selectedFormat === 'pdf' || selectedFormat === 'word' || selectedFormat === 'ppt') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      主题
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setOptions({ ...options, theme: 'light' })}
                        className={`px-4 py-3 border-2 rounded-lg transition-all ${
                          options.theme === 'light'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">明亮</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">适合打印</div>
                      </button>
                      <button
                        onClick={() => setOptions({ ...options, theme: 'dark' })}
                        className={`px-4 py-3 border-2 rounded-lg transition-all ${
                          options.theme === 'dark'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">深色</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">护眼模式</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 幻灯片比例（PPT） */}
                {selectedFormat === 'ppt' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      幻灯片比例
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setOptions({ ...options, aspectRatio: '16:9' })}
                        className={`px-4 py-3 border-2 rounded-lg transition-all ${
                          options.aspectRatio === '16:9'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">16:9</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">宽屏（推荐）</div>
                      </button>
                      <button
                        onClick={() => setOptions({ ...options, aspectRatio: '4:3' })}
                        className={`px-4 py-3 border-2 rounded-lg transition-all ${
                          options.aspectRatio === '4:3'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">4:3</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">标准</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* 模板（Word） */}
                {selectedFormat === 'word' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      文档模板
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['default', 'formal', 'simple'].map((template) => (
                        <button
                          key={template}
                          onClick={() => setOptions({ ...options, template: template as any })}
                          className={`px-4 py-3 border-2 rounded-lg transition-all ${
                            options.template === template
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {template === 'default' ? '默认' : template === 'formal' ? '正式' : '简洁'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 其他选项 */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={options.includeTimestamp}
                      onChange={(e) => setOptions({ ...options, includeTimestamp: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">包含生成时间</span>
                  </label>

                  {(selectedFormat === 'pdf' || selectedFormat === 'ppt') && (
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={options.showPageNumbers}
                        onChange={(e) => setOptions({ ...options, showPageNumbers: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">显示页码</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={step === 1 ? handleClose : handleBack}
          >
            {step === 1 ? '取消' : '上一步'}
          </Button>

          {step === 2 && (
            <Button
              onClick={handleExport}
              loading={exporting}
              icon={<Download size={16} />}
            >
              {exporting ? '导出中...' : '导出'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
