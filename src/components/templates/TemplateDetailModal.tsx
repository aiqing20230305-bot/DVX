import React, { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { Modal } from '../shared/Modal.js'
import { TemplatePreview } from '../shared/TemplatePreview.js'
import { ScriptTemplate } from '../../types/index.js'
import { templateApi } from '../../api/template.api.js'

interface TemplateDetailModalProps {
  templateId: string | null
  isOpen: boolean
  onClose: () => void
  onUseTemplate: (templateId: string) => void
}

// Helper functions moved to TemplatePreview component

export function TemplateDetailModal({
  templateId,
  isOpen,
  onClose,
  onUseTemplate
}: TemplateDetailModalProps) {
  const [template, setTemplate] = useState<ScriptTemplate | null>(null)
  const [variables, setVariables] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && templateId) {
      loadTemplate()
    } else {
      setTemplate(null)
      setVariables([])
      setError(null)
    }
  }, [isOpen, templateId])

  const loadTemplate = async () => {
    if (!templateId) return

    setLoading(true)
    setError(null)
    try {
      const response = await templateApi.getTemplateById(templateId)
      setTemplate(response.template)
      setVariables(response.variables)
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载模板失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = () => {
    if (template) {
      onUseTemplate(template.id)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="模板详情"
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-elevated-2)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)'
            }}
          >
            取消
          </button>
          <button
            onClick={handleUseTemplate}
            disabled={loading || !!error}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: loading || error ? 'var(--color-bg-elevated-2)' : 'var(--color-primary)',
              color: loading || error ? 'var(--color-text-tertiary)' : 'white',
              cursor: loading || error ? 'not-allowed' : 'pointer'
            }}
          >
            <Play size={14} />
            使用模板
          </button>
        </div>
      }
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              加载中...
            </p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)'
          }}
        >
          <p className="font-medium mb-2" style={{ color: 'var(--color-error)' }}>
            加载失败
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {error}
          </p>
        </div>
      )}

      {template && !loading && !error && (
        <TemplatePreview template={template} variables={variables} showHeader={true} />
      )}
    </Modal>
  )
}
