import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Database, Lightbulb, FileText, PenTool, BookOpen,
  ChevronLeft, ChevronRight, Sun, Moon, Plus, Zap,
  ChevronDown, Check, Trash2, ArrowLeft, FolderOpen
} from 'lucide-react'
import { useUIStore } from '../../store/ui.store.js'
import { useProjectStore } from '../../store/project.store.js'
import { Modal } from '../shared/Modal.js'
import { Button } from '../shared/Button.js'
import { TemplateSelector } from '../project/TemplateSelector.js'

const navItems = [
  { to: '/', label: '数据工作台', icon: Database, end: true },
  { to: '/insights', label: '洞察引擎', icon: Lightbulb },
  { to: '/topics', label: '选题策划', icon: FileText },
  { to: '/scripts', label: '脚本创作', icon: PenTool },
  { to: '/report', label: '战略报告', icon: Zap },
  { to: '/kb', label: '知识库', icon: BookOpen },
  { to: '/projects', label: '所有项目', icon: FolderOpen, divider: true },
]

export function Sidebar() {
  const { sidebarCollapsed, theme, toggleSidebar, toggleTheme } = useUIStore()
  const { projects, activeProjectId, setActiveProject, addProject, removeProject } = useProjectStore()
  const [projectDropdown, setProjectDropdown] = useState(false)
  const [newProjectModal, setNewProjectModal] = useState(false)
  const [newProjectStep, setNewProjectStep] = useState<'template' | 'details'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const activeProject = projects.find(p => p.id === activeProjectId)

  const handleOpenNewProject = () => {
    setNewProjectModal(true)
    setNewProjectStep('template')
    setSelectedTemplate(null)
    setNewProjectName('')
    setNewProjectDesc('')
  }

  const handleTemplateNext = () => {
    setNewProjectStep('details')
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    setCreating(true)
    try {
      await addProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        templateId: selectedTemplate ?? undefined
      })
      setNewProjectModal(false)
      setNewProjectStep('template')
      setSelectedTemplate(null)
      setNewProjectName('')
      setNewProjectDesc('')
      navigate('/')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <aside className={[
        'flex flex-col h-full bg-[#F7F8FA] border-r border-[#DEE0E3] transition-all duration-300 flex-shrink-0',
        'md:relative fixed left-0 top-0 bottom-0 z-50',
        sidebarCollapsed ? 'w-16 md:w-16 -translate-x-full md:translate-x-0' : 'w-60'
      ].join(' ')}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#DEE0E3]">
          <div className="w-8 h-8 rounded-lg bg-[#3370FF] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#0D3DB8]/50">
            <Zap size={16} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 animate-fade-in-scale">
              <div className="font-bold text-[#1F2329] text-sm leading-tight">超级洞察</div>
              <div className="text-xs text-[#8F959E]">AI 内容战略平台</div>
            </div>
          )}
        </div>

        {/* Project selector */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 border-b border-[#DEE0E3] animate-fade-in-scale">
            <div className="relative">
              <div className="flex gap-1">
                <button
                  onClick={() => activeProject && navigate(`/project/${activeProject.id}`)}
                  className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-l-lg bg-[#F7F8FA] border border-[#DEE0E3] hover:border-[#3370FF] transition-colors text-left"
                  title="查看项目详情"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#8F959E] mb-0.5">当前项目</div>
                    <div className="text-sm font-medium text-[#1F2329] truncate">
                      {activeProject?.name ?? '选择项目'}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setProjectDropdown(!projectDropdown)}
                  className="px-2 rounded-r-lg bg-[#F7F8FA] border border-l-0 border-[#DEE0E3] hover:border-[#C9CDD4] transition-colors flex items-center"
                >
                  <ChevronDown size={14} className={`text-[#646A73] transition-transform ${projectDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {projectDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg shadow-xl shadow-black/50 z-50 overflow-hidden animate-fade-in-down">
                  {projects.map((project, index) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-[#DEE0E3] cursor-pointer group transition-colors duration-150"
                      onClick={() => { setActiveProject(project.id); setProjectDropdown(false) }}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#1F2329] truncate">{project.name}</div>
                      </div>
                      {activeProjectId === project.id && <Check size={14} className="text-[#5B8EFF] flex-shrink-0" />}
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900/30 hover:text-red-400 text-[#8F959E] transition-all"
                        onClick={(e) => { e.stopPropagation(); removeProject(project.id) }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-[#DEE0E3] cursor-pointer border-t border-[#DEE0E3] text-[#5B8EFF]"
                    onClick={() => { setProjectDropdown(false); handleOpenNewProject() }}
                  >
                    <Plus size={14} />
                    <span className="text-sm">新建项目</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end, divider }) => (
            <React.Fragment key={to}>
              {divider && <div className="h-px bg-[#DEE0E3] my-2" />}
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden',
                  isActive
                    ? 'bg-[#3370FF]/20 text-[#5B8EFF] border border-[#3370FF]/30 shadow-lg shadow-[#0D3DB8]/20'
                    : 'text-[#646A73] hover:text-[#1F2329] hover:bg-[#F7F8FA] hover:shadow-md hover:shadow-black/20 border border-transparent hover:border-[#DEE0E3]'
                ].join(' ')}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{label}</span>}
              </NavLink>
            </React.Fragment>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="px-2 py-3 border-t border-[#DEE0E3] flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-[#646A73] hover:text-[#1F2329] hover:bg-[#F7F8FA] transition-colors"
            title={theme === 'dark' ? '切换到亮色' : '切换到暗色'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {!sidebarCollapsed && (
            <button
              onClick={handleOpenNewProject}
              className="flex items-center gap-2 flex-1 px-2 py-2 rounded-lg text-[#646A73] hover:text-[#1F2329] hover:bg-[#F7F8FA] transition-colors text-sm"
            >
              <Plus size={15} />
              新建项目
            </button>
          )}
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-[#646A73] hover:text-[#1F2329] hover:bg-[#F7F8FA] transition-colors ml-auto"
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* New Project Modal */}
      <Modal
        open={newProjectModal}
        onClose={() => setNewProjectModal(false)}
        title={newProjectStep === 'template' ? '选择项目模板' : '新建项目'}
        footer={
          newProjectStep === 'template' ? (
            <>
              <Button variant="secondary" onClick={() => setNewProjectModal(false)}>取消</Button>
              <Button onClick={handleTemplateNext} disabled={!selectedTemplate}>
                下一步
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => setNewProjectStep('template')}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                返回
              </Button>
              <Button loading={creating} onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                创建项目
              </Button>
            </>
          )
        }
      >
        {newProjectStep === 'template' ? (
          <div>
            <div className="text-sm text-[#646A73] mb-4">
              选择一个模板快速开始，模板包含预设的知识库和内容基调
            </div>
            <TemplateSelector value={selectedTemplate} onChange={setSelectedTemplate} />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#646A73] mb-1.5">项目名称 *</label>
              <input
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                placeholder="例如：618大促内容战略"
                className="w-full px-3 py-2 rounded-lg bg-[#F2F3F5] border border-[#DEE0E3] focus:border-[#3370FF] focus:outline-none focus:ring-1 focus:ring-[#3370FF] text-[#1F2329] placeholder-[#737373] text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#646A73] mb-1.5">项目描述</label>
              <textarea
                value={newProjectDesc}
                onChange={e => setNewProjectDesc(e.target.value)}
                placeholder="简短描述项目目标（可选）"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[#F2F3F5] border border-[#DEE0E3] focus:border-[#3370FF] focus:outline-none focus:ring-1 focus:ring-[#3370FF] text-[#1F2329] placeholder-[#737373] text-sm resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
