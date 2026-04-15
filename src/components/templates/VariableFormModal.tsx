import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, AlertCircle } from 'lucide-react'
import { Modal } from '../shared/Modal.js'
import { toast } from '../../store/toast.store.js'
import { useProjectStore } from '../../store/project.store.js'
import { templateApi } from '../../api/template.api.js'
import { TemplateVariables } from '../../types/index.js'

interface VariableFormModalProps {
  templateId: string | null
  variables: string[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function VariableFormModal({
  templateId,
  variables,
  isOpen,
  onClose,
  onSuccess
}: VariableFormModalProps) {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()

  const [topicId, setTopicId] = useState('')
  const [variableValues, setVariableValues] = useState<TemplateVariables>({})
  const [topics, setTopics] = useState<Array<{ id: string; title: string }>>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载选题列表
  useEffect(() => {
    if (isOpen && activeProjectId) {
      loadTopics()
    } else {
      setTopics([])
      setTopicId('')
      setVariableValues({})
      setError(null)
    }
  }, [isOpen, activeProjectId])

  const loadTopics = async () => {
    if (!activeProjectId) return

    setLoadingTopics(true)
    try {
      const response = await fetch(`/api/topic/${activeProjectId}`)
      if (!response.ok) throw new Error('加载选题失败')
      const data = await response.json()
      setTopics(data.topics || [])
    } catch (err) {
      console.error('Failed to load topics:', err)
      toast.error('加载失败', '无法加载选题列表')
    } finally {
      setLoadingTopics(false)
    }
  }

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [varName]: value
    }))
  }

  const handleSubmit = async () => {
    // 校验
    if (!topicId) {
      setError('请选择一个选题')
      return
    }

    if (!templateId || !activeProjectId) {
      setError('缺少必要参数')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // 调用API生成脚本
      await templateApi.applyTemplate(templateId, {
        topicId,
        projectId: activeProjectId,
        variables: variableValues,
        saveToDatabase: true
      })

      toast.success('生成成功', '已生成A/B两个版本脚本')
      onSuccess()
      onClose()

      // 跳转到Scripts页面
      setTimeout(() => {
        navigate('/scripts')
      }, 500)
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成脚本失败'
      setError(message)
      toast.error('生成失败', message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="填写模板变量"
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
            disabled={submitting || !topicId}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: submitting || !topicId ? 'var(--color-bg-elevated-2)' : 'var(--color-primary)',
              color: submitting || !topicId ? 'var(--color-text-tertiary)' : 'white',
              cursor: submitting || !topicId ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Play size={14} />
                生成A/B脚本
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
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

        {/* Topic Selection */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            选择选题 <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            disabled={loadingTopics || submitting}
            className="w-full px-3 py-2 rounded-md text-sm transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-elevated-1)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              cursor: loadingTopics || submitting ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">
              {loadingTopics ? '加载中...' : '请选择一个选题'}
            </option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
          {topics.length === 0 && !loadingTopics && (
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
              当前项目暂无选题，请先创建选题
            </p>
          )}
        </div>

        {/* Variables Form */}
        {variables.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
              模板变量（{variables.length}个）
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {variables.map((varName) => (
                <div key={varName}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {varName}
                  </label>
                  <input
                    type="text"
                    value={variableValues[varName] || ''}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`例如：${getPlaceholder(varName)}`}
                    disabled={submitting}
                    className="w-full px-3 py-2 rounded-md text-sm transition-colors"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated-1)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      cursor: submitting ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              className="mt-4 p-3 rounded-md flex items-start gap-2"
              style={{
                backgroundColor: 'var(--color-info-bg)',
                border: '1px solid var(--color-info-border)'
              }}
            >
              <AlertCircle size={14} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                未填写的变量将保留 <code style={{
                  backgroundColor: 'var(--color-bg-elevated-1)',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontFamily: 'monospace'
                }}>{'{变量名}'}</code> 格式，可在生成后手动编辑脚本
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// 根据变量名生成示例占位符
function getPlaceholder(varName: string): string {
  const lowerName = varName.toLowerCase()

  if (lowerName.includes('价格')) {
    if (lowerName.includes('高')) return '199元'
    if (lowerName.includes('低')) return '49元'
    return '99元'
  }

  if (lowerName.includes('产品') && lowerName.includes('名')) return '多芬无硅油洗发水'
  if (lowerName.includes('产品') && lowerName.includes('类')) return '洗发水'
  if (lowerName.includes('品牌')) return '多芬'
  if (lowerName.includes('卖点')) return '温和清洁不伤发'
  if (lowerName.includes('成分')) return '无硅油配方'
  if (lowerName.includes('人群')) return '学生党/上班族'
  if (lowerName.includes('场景')) return '日常洗护'
  if (lowerName.includes('效果')) return '柔顺亮泽'
  if (lowerName.includes('链接')) return 'https://...'

  return '输入内容'
}
