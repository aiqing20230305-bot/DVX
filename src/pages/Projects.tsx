import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/project.store.js'
import {
  Plus, Search, Archive, Copy, Trash2, MoreVertical,
  Calendar, Tag, TrendingUp, Folder
} from 'lucide-react'
import { Button } from '../components/shared/Button.js'
import { Input } from '../components/shared/Input.js'
import { Badge } from '../components/shared/Badge.js'
import { formatDate } from '../utils/date.js'

export function Projects() {
  const navigate = useNavigate()
  const { projects, setActiveProject, updateProject, removeProject } = useProjectStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [dropdown, setDropdown] = useState<string | null>(null)

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                       p.description.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  const handleArchive = async (id: string) => {
    const project = projects.find(p => p.id === id)
    if (!project) return
    await updateProject(id, { status: project.status === 'active' ? 'archived' : 'active' })
    setDropdown(null)
  }

  const handleDuplicate = async (id: string) => {
    const project = projects.find(p => p.id === id)
    if (!project) return
    // TODO: Implement project duplication
    alert('复制项目功能开发中...')
    setDropdown(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此项目吗？此操作不可恢复。')) return
    await removeProject(id)
    setDropdown(null)
  }

  const handleOpenProject = (id: string) => {
    setActiveProject(id)
    navigate(`/project/${id}`)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>项目管理</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>管理和组织你的所有项目</p>
          </div>
          <Button onClick={() => navigate('/')}>
            <Plus size={16} />
            新建项目
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <Input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索项目..."
              leftIcon={Search}
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 rounded-lg p-1 border" style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)'
          }}>
            {[
              { key: 'all', label: '全部' },
              { key: 'active', label: '活跃' },
              { key: 'archived', label: '已归档' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as typeof filter)}
                className={[
                  'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  filter === item.key ? 'text-white' : ''
                ].join(' ')}
                style={filter === item.key ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                } : {
                  color: 'var(--color-text-secondary)'
                }}
                onMouseEnter={(e) => {
                  if (item.key !== filter) e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (item.key !== filter) e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Folder size={48} className="mb-4" style={{ color: 'var(--color-text-disabled)' }} />
            <div className="mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {search ? '未找到匹配的项目' : filter === 'archived' ? '暂无归档项目' : '暂无项目'}
            </div>
            {!search && filter === 'all' && (
              <Button size="sm" onClick={() => navigate('/')} className="mt-4">
                <Plus size={16} />
                创建第一个项目
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className="rounded-lg border transition-all group overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                {/* Header */}
                <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => handleOpenProject(project.id)}
                      className="flex-1 text-left"
                    >
                      <h3 className="font-semibold transition-colors line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-[#646A73] mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </button>

                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setDropdown(dropdown === project.id ? null : project.id)}
                        className="p-1 rounded hover:bg-[#DEE0E3] text-[#646A73] hover:text-[#1F2329]"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {dropdown === project.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setDropdown(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg shadow-xl shadow-black/50 z-50 py-1 min-w-40">
                            <button
                              onClick={() => handleArchive(project.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#646A73] hover:bg-[#DEE0E3]"
                            >
                              <Archive size={14} />
                              {project.status === 'active' ? '归档' : '恢复'}
                            </button>
                            <button
                              onClick={() => handleDuplicate(project.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#646A73] hover:bg-[#DEE0E3]"
                            >
                              <Copy size={14} />
                              复制
                            </button>
                            <div className="h-px bg-[#DEE0E3] my-1" />
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/30"
                            >
                              <Trash2 size={14} />
                              删除
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="p-4 space-y-3">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {project.brand && (
                      <div className="flex items-center gap-1.5 text-[#646A73]">
                        <TrendingUp size={12} />
                        <span className="truncate">{project.brand}</span>
                      </div>
                    )}
                    {project.category && (
                      <div className="flex items-center gap-1.5 text-[#646A73]">
                        <Folder size={12} />
                        <span className="truncate">{project.category}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {project.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Tag size={12} className="text-[#8F959E] flex-shrink-0" />
                      {project.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{project.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#DEE0E3]">
                    <Calendar size={12} className="text-[#8F959E]" />
                    <span className="text-xs text-[#8F959E]">
                      {formatDate(project.updated_at)}
                    </span>
                    {project.status === 'archived' && (
                      <Badge variant="secondary" className="ml-auto text-xs">已归档</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
