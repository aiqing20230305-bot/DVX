import React from 'react'
import { Clock, Star } from 'lucide-react'
import { PlatformBadge } from './Badge.js'
import { ScriptTemplate } from '../../types/index.js'

interface TemplatePreviewProps {
  template: ScriptTemplate
  variables?: string[]
  showHeader?: boolean
}

// 分类配置
const categoryConfig = {
  emotion: { label: '情感型', color: 'var(--color-error)' },
  rational: { label: '理性型', color: 'var(--color-info)' },
  harvest: { label: '种草型', color: 'var(--color-success)' },
  custom: { label: '自定义', color: 'var(--color-warning)' }
}

// 分段类型标签
const segmentTypeLabels: Record<string, string> = {
  hook: 'Hook',
  problem: 'Problem',
  solution: 'Solution',
  proof: 'Proof',
  cta: 'CTA'
}

// 高亮变量的渲染函数
function highlightVariables(text: string): React.ReactNode[] {
  const regex = /\{([^}]+)\}/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(regex)) {
    const index = match.index!
    // 添加变量前的文本
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index))
    }
    // 添加高亮的变量
    parts.push(
      <span
        key={`var-${index}`}
        className="px-1.5 py-0.5 rounded text-xs font-mono font-medium"
        style={{
          backgroundColor: 'var(--color-primary-bg)',
          color: 'var(--color-primary)'
        }}
      >
        {match[0]}
      </span>
    )
    lastIndex = index + match[0].length
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export function TemplatePreview({ template, variables, showHeader = true }: TemplatePreviewProps) {
  return (
    <div className="space-y-6">
      {/* Template Info */}
      {showHeader && (
        <div>
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {template.name}
            </h2>
            {template.project_id === null && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-primary-bg)',
                  color: 'var(--color-primary)'
                }}
              >
                <Star size={11} />
                官方
              </span>
            )}
          </div>

          {template.description && (
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {template.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
              style={{
                backgroundColor: `${categoryConfig[template.category].color}20`,
                color: categoryConfig[template.category].color
              }}
            >
              {categoryConfig[template.category].label}
            </span>
            <PlatformBadge platform={template.platform} size="md" showIcon gradient />
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs"
              style={{
                backgroundColor: 'var(--color-bg-elevated-2)',
                color: 'var(--color-text-tertiary)'
              }}
            >
              使用 {template.usage_count} 次
            </span>
          </div>
        </div>
      )}

      {/* Script Structure */}
      <div>
        <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          🎯 脚本结构（{template.segments.length}个分段）
        </h3>
        <div className="space-y-3">
          {template.segments.map((segment, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-elevated-1)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--color-primary-bg)',
                    color: 'var(--color-primary)'
                  }}
                >
                  {idx + 1}. {segmentTypeLabels[segment.type] || segment.type}
                </span>
                {segment.timing && (
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated-2)',
                      color: 'var(--color-text-tertiary)'
                    }}
                  >
                    <Clock size={11} />
                    {segment.timing}
                  </span>
                )}
              </div>
              <div className="mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  文案：
                </span>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {highlightVariables(segment.content)}
                </p>
              </div>
              {segment.direction && (
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    镜头：
                  </span>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {highlightVariables(segment.direction)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Variables List */}
      {variables && variables.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            📝 变量列表（{variables.length}个）
          </h3>
          <div className="flex flex-wrap gap-2">
            {variables.map((variable, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-medium"
                style={{
                  backgroundColor: 'var(--color-bg-elevated-2)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {'{'}
                {variable}
                {'}'}
              </span>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
            使用模板时，您可以填写这些变量的具体值
          </p>
        </div>
      )}
    </div>
  )
}
