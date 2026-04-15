/**
 * v2.33.0 Phase 2: 导出进度模态框
 * 显示导出进度和当前阶段
 */

import React from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from './Button.js'

/**
 * 导出进度接口
 */
export interface ExportProgress {
  visible: boolean
  progress: number      // 0-100
  stage: string         // "准备数据", "生成PDF", "下载文件"
}

/**
 * ExportProgressModal组件Props
 */
interface ExportProgressModalProps {
  isOpen: boolean
  progress: number      // 0-100
  stage: string
  onCancel: () => void
}

/**
 * ExportProgressModal组件
 */
export function ExportProgressModal({
  isOpen,
  progress,
  stage,
  onCancel
}: ExportProgressModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              导出中...
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stage}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Stage Description */}
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {progress < 30 && '正在准备数据，请稍候...'}
            {progress >= 30 && progress < 90 && '正在生成文件，这可能需要几秒钟...'}
            {progress >= 90 && progress < 100 && '即将完成，准备下载...'}
            {progress === 100 && '导出成功！'}
          </div>
        </div>

        {/* Footer */}
        {progress < 100 && (
          <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={onCancel}
              size="sm"
            >
              取消
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
