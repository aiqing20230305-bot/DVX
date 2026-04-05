import React, { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { Package, Sparkles, Cookie, FileIcon, Check, Loader } from 'lucide-react'

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string | null
}

interface TemplateSelectorProps {
  value: string | null
  onChange: (templateId: string | null) => void
}

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  package: Package,
  sparkles: Sparkles,
  cookie: Cookie,
  file: FileIcon,
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const { templates } = await api.get<{ templates: ProjectTemplate[] }>('/template')
      setTemplates(templates)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin text-indigo-500" size={24} />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {templates.map(template => {
        const Icon = iconMap[template.icon] || FileIcon
        const isSelected = value === template.id

        return (
          <button
            key={template.id}
            onClick={() => onChange(template.id)}
            className={[
              'relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left',
              isSelected
                ? 'border-indigo-500 bg-indigo-900/20'
                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
            ].join(' ')}
          >
            {/* Icon */}
            <div className={[
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
              isSelected ? 'bg-indigo-600' : 'bg-slate-700'
            ].join(' ')}>
              <Icon size={20} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-200 mb-1">{template.name}</div>
              <div className="text-xs text-slate-400 line-clamp-2">{template.description}</div>
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
