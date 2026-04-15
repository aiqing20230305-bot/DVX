import React, { useEffect, useState } from 'react'
import { Search, X, ChevronRight } from 'lucide-react'
import { Modal } from '../shared/Modal.js'
import { TemplatePreview } from '../shared/TemplatePreview.js'
import { VariableFormModal } from '../templates/VariableFormModal.js'
import { PlatformBadge } from '../shared/Badge.js'
import { useTemplateStore } from '../../store/template.store.js'
import { templateApi } from '../../api/template.api.js'
import { ScriptTemplate } from '../../types/index.js'

interface TemplateSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onScriptCreated: () => void
}

// 分类配置
const categoryConfig = {
  emotion: { label: '情感型', color: 'var(--color-error)', icon: '💖' },
  rational: { label: '理性型', color: 'var(--color-info)', icon: '🧠' },
  harvest: { label: '种草型', color: 'var(--color-success)', icon: '🌱' },
  custom: { label: '自定义', color: 'var(--color-warning)', icon: '⚙️' }
}

export function TemplateSelectModal({
  isOpen,
  onClose,
  onScriptCreated
}: TemplateSelectModalProps) {
  const { templates, loading: templatesLoading, fetchTemplates } = useTemplateStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<ScriptTemplate | null>(null)
  const [selectedVariables, setSelectedVariables] = useState<string[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [variableModalOpen, setVariableModalOpen] = useState(false)

  // 加载模板列表
  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    } else {
      // Reset on close
      setSearchQuery('')
      setSelectedCategory(null)
      setSelectedTemplateId(null)
      setSelectedTemplateDetail(null)
      setSelectedVariables([])
    }
  }, [isOpen])

  // 当选中模板时，加载详情
  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateDetail(selectedTemplateId)
    }
  }, [selectedTemplateId])

  const loadTemplateDetail = async (templateId: string) => {
    setLoadingDetail(true)
    try {
      const response = await templateApi.getTemplateById(templateId)
      setSelectedTemplateDetail(response.template)
      setSelectedVariables(response.variables)
    } catch (err) {
      console.error('Failed to load template detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!template.name.toLowerCase().includes(query) &&
          !template.description?.toLowerCase().includes(query)) {
        return false
      }
    }

    // 分类过滤
    if (selectedCategory && template.category !== selectedCategory) {
      return false
    }

    return true
  })

  // 选中第一个模板（如果没有选中）
  useEffect(() => {
    if (filteredTemplates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(filteredTemplates[0].id)
    }
  }, [filteredTemplates, selectedTemplateId])

  const handleUseTemplate = () => {
    if (selectedTemplateId) {
      setVariableModalOpen(true)
    }
  }

  const handleVariableFormSuccess = () => {
    setVariableModalOpen(false)
    onScriptCreated()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        title="选择模板"
        size="full"
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
              disabled={!selectedTemplateId}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              style={{
                backgroundColor: selectedTemplateId ? 'var(--color-primary)' : 'var(--color-bg-elevated-2)',
                color: selectedTemplateId ? 'white' : 'var(--color-text-tertiary)',
                cursor: selectedTemplateId ? 'pointer' : 'not-allowed'
              }}
            >
              <ChevronRight size={14} />
              使用模板
            </button>
          </div>
        }
      >
        <div className="flex h-[70vh]">
          {/* Left Sidebar: Template List */}
          <div
            className="w-2/5 border-r overflow-y-auto pr-4"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
                <input
                  type="text"
                  placeholder="搜索模板..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-md text-sm transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated-1)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-elevated-2 transition-colors"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filters */}
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const isActive = selectedCategory === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(isActive ? null : key)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? `${config.color}20` : 'var(--color-bg-elevated-1)',
                      border: `1px solid ${isActive ? config.color : 'var(--color-border)'}`,
                      color: isActive ? config.color : 'var(--color-text-secondary)'
                    }}
                  >
                    {config.icon} {config.label}
                  </button>
                )
              })}
            </div>

            {/* Template List */}
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div
                  className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      暂无匹配的模板
                    </p>
                  </div>
                ) : (
                  filteredTemplates.map(template => {
                    const isSelected = selectedTemplateId === template.id
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplateId(template.id)}
                        className="w-full p-3 rounded-lg text-left transition-all"
                        style={{
                          backgroundColor: isSelected ? 'var(--color-bg-elevated-2)' : 'var(--color-bg-elevated-1)',
                          border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          cursor: 'pointer'
                        }}
                      >
                        <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {template.name}
                        </h4>
                        {template.description && (
                          <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: `${categoryConfig[template.category].color}15`,
                              color: categoryConfig[template.category].color
                            }}
                          >
                            {categoryConfig[template.category].label}
                          </span>
                          <PlatformBadge platform={template.platform} size="sm" />
                          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {template.usage_count} 次
                          </span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Right Section: Template Preview */}
          <div className="w-3/5 pl-6 overflow-y-auto">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    加载模板详情...
                  </p>
                </div>
              </div>
            ) : selectedTemplateDetail ? (
              <TemplatePreview
                template={selectedTemplateDetail}
                variables={selectedVariables}
                showHeader={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  请选择一个模板查看详情
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Variable Form Modal */}
      <VariableFormModal
        templateId={selectedTemplateId}
        variables={selectedVariables}
        isOpen={variableModalOpen}
        onClose={() => setVariableModalOpen(false)}
        onSuccess={handleVariableFormSuccess}
      />
    </>
  )
}
