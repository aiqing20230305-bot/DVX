import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface KBItemData {
  type: 'report' | 'template' | 'tone' | 'insight' | 'other'
  title: string
  content: string
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string | null
  defaults: {
    brand?: string
    category?: string
    target_audience?: string
    campaign?: string
    tags?: string[]
  }
  knowledgeBase: KBItemData[]
}

interface TemplateData {
  templates: ProjectTemplate[]
}

let _templates: ProjectTemplate[] | null = null

export function getTemplates(): ProjectTemplate[] {
  if (!_templates) {
    const filePath = resolve(__dirname, '../templates/project-templates.json')
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as TemplateData
    _templates = data.templates
  }
  return _templates
}

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return getTemplates().find(t => t.id === id)
}
