import React, { useEffect, useState } from 'react'
import { FileText, AlertCircle, Check } from 'lucide-react'
import { Modal } from '../shared/Modal.js'
import { PlatformBadge } from '../shared/Badge.js'
import { Script } from '../../types/index.js'
import { toast } from '../../store/toast.store.js'

interface SaveAsTemplateModalProps {
  script: Script | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// 分类配置
const categoryOptions = [
  { value: 'emotion', label: '情感型', description: '通过情感共鸣引发购买' },
  { value: 'rational', label: '理性型', description: '数据和理性分析驱动' },
  { value: 'harvest', label: '种草型', description: '快节奏展示和即时转化' },
  { value: 'custom', label: '自定义', description: '自定义类型模板' }
]

const platformOptions = [
  { value: 'douyin', label: '抖音' },
  { value: 'kuaishou', label: '快手' },
  { value: 'xiaohongshu', label: '小红书' }
]

export function SaveAsTemplateModal({
  script,
  isOpen,
  onClose,
  onSuccess
}: SaveAsTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('custom')
  const [platform, setPlatform] = useState<string>('douyin')
  const [tags, setTags] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && script) {
      // Pre-fill with script data
      setName(`${script.topic_title || '脚本'}模板`)
      setDescription(`基于脚本创建的模板`)
      setCategory('custom')
      setPlatform('douyin')
      setTags('')
      setError(null)
    } else if (!isOpen) {
      // Reset on close
      setName('')
      setDescription('')
      setCategory('custom')
      setPlatform('douyin')
      setTags('')
      setError(null)
    }
  }, [isOpen, script])

  const handleSubmit = async () => {
    if (!script) {
      setError('脚本数据缺失')
      return
    }

    // Validation
    if (!name.trim()) {
      setError('请填写模板名称')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Parse tags
      const tagList = tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

      const response = await fetch(`/api/templates/scripts/${script.id}/save-as-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          platform,
          tags: tagList
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '保存失败')
      }

      const data = await response.json()

      toast.success('模板创建成功', `"${name}"已保存到模板库`)
      onSuccess()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存模板失败'
      setError(message)
      toast.error('保存失败', message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="保存为模板"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-elevated-2)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: submitting || !name.trim() ? 'var(--color-bg-elevated-2)' : 'var(--color-primary)',
              color: submitting || !name.trim() ? 'var(--color-text-tertiary)' : 'white',
              cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check size={14} />
                保存模板
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Error Alert */}
        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)'
            }}
          >
            <AlertCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Template Info Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            模板信息
          </h3>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              模板名称 <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：多芬洗发水情感型模板"
              disabled={submitting}
              className="w-full px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: `1px solid ${!name.trim() && error ? 'var(--color-error)' : 'var(--color-border)'}`,
                color: 'var(--color-text-primary)',
                cursor: submitting ? 'not-allowed' : 'text'
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              模板描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述这个模板的特点和适用场景"
              disabled={submitting}
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm transition-colors resize-none"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                cursor: submitting ? 'not-allowed' : 'text'
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              模板分类 <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} - {opt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              目标平台 <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {platformOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              标签（可选）
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="多个标签用逗号分隔，例如：种草,快节奏,学生党"
              disabled={submitting}
              className="w-full px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                cursor: submitting ? 'not-allowed' : 'text'
              }}
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
              标签用于搜索和分类，建议添加2-5个
            </p>
          </div>
        </div>

        {/* Script Preview */}
        {script && (
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              脚本预览
            </h3>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {script.topic_title || '未命名脚本'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: script.variant === 'A' ? 'var(--color-primary-bg)' : 'var(--color-success-bg)',
                      color: script.variant === 'A' ? 'var(--color-primary)' : 'var(--color-success)'
                    }}
                  >
                    {script.variant}版
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {script.word_count} 字
                </span>
              </div>
              <p className="text-sm line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
                {script.full_text}
              </p>
            </div>
            <div
              className="mt-3 p-3 rounded-md flex items-start gap-2"
              style={{
                backgroundColor: 'var(--color-info-bg)',
                border: '1px solid var(--color-info-border)'
              }}
            >
              <AlertCircle size={14} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                保存后，该模板将仅在当前项目可用。脚本结构将自动提取并保存。
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
