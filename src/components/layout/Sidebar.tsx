import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Database, Lightbulb, FileText, PenTool, BookOpen,
  ChevronLeft, ChevronRight, Plus, Zap,
  ChevronDown, Check, Trash2, ArrowLeft, FolderOpen,
  User, LogOut, GitBranch, Settings
} from 'lucide-react'
import { useUIStore } from '../../store/ui.store.js'
import { useProjectStore } from '../../store/project.store.js'
import { useAuthStore } from '../../store/auth.store.js'
import { toast } from '../../store/toast.store.js'
import { Modal } from '../shared/Modal.js'
import { Button } from '../shared/Button.js'
import { TemplateSelector } from '../project/TemplateSelector.js'
import { NotificationCenter } from '../notifications/NotificationCenter.js'

const navItems = [
  // 核心工作流
  { to: '/', label: '数据工作台', icon: Database, end: true },
  { to: '/insights', label: '洞察引擎', icon: Lightbulb },
  { to: '/topics', label: '选题策划', icon: FileText },
  { to: '/scripts', label: '脚本创作', icon: PenTool },
  { to: '/report', label: '战略报告', icon: Zap, divider: true },
  // 协作功能
  { to: '/approvals', label: '审批管理', icon: GitBranch },
  { to: '/kb', label: '知识库', icon: BookOpen, divider: true },
  // 项目管理
  { to: '/settings', label: '项目设置', icon: Settings },
  { to: '/projects', label: '所有项目', icon: FolderOpen },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { projects, activeProjectId, setActiveProject, addProject, removeProject } = useProjectStore()
  const { user, logout } = useAuthStore()
  const [projectDropdown, setProjectDropdown] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [newProjectModal, setNewProjectModal] = useState(false)
  const [newProjectStep, setNewProjectStep] = useState<'template' | 'details'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [token, setToken] = useState<string>('')
  const navigate = useNavigate()

  const activeProject = projects.find(p => p.id === activeProjectId)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '')
    }
  }, [])

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

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('已退出登录')
      navigate('/login')
    } catch (error) {
      toast.error('退出失败')
    }
  }

  return (
    <>
      <aside className={[
        'flex flex-col h-full border-r transition-all duration-300 flex-shrink-0',
        'md:relative fixed left-0 top-0 bottom-0 z-50',
        sidebarCollapsed ? 'w-16 md:w-16 -translate-x-full md:translate-x-0' : 'w-60'
      ].join(' ')} style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg" style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 10px 15px -3px rgba(99, 91, 255, 0.5)' }}>
            <Zap size={16} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 animate-fade-in-scale">
              <div className="font-bold text-sm leading-tight" style={{ color: 'var(--color-text-primary)' }}>超级洞察</div>
              <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>AI 内容战略平台</div>
            </div>
          )}
        </div>

        {/* Project selector */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 border-b animate-fade-in-scale space-y-2" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative">
              <div className="flex gap-1">
                <button
                  onClick={() => activeProject && navigate(`/project/${activeProject.id}`)}
                  className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-l-lg border transition-colors text-left"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  title="查看项目详情"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-tertiary)' }}>当前项目</div>
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {activeProject?.name ?? '选择项目'}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setProjectDropdown(!projectDropdown)}
                  className="px-2 rounded-r-lg border border-l-0 transition-colors flex items-center"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <ChevronDown size={14} className={`transition-transform ${projectDropdown ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>

              {projectDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in-down" style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                  {projects.map((project, index) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer group transition-colors duration-150"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => { setActiveProject(project.id); setProjectDropdown(false) }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{project.name}</div>
                      </div>
                      {activeProjectId === project.id && <Check size={14} className="flex-shrink-0" style={{ color: 'var(--color-primary-light)' }} />}
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                          e.currentTarget.style.color = '#EF4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--color-text-tertiary)';
                        }}
                        onClick={(e) => { e.stopPropagation(); removeProject(project.id) }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 cursor-pointer border-t transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary-light)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => { setProjectDropdown(false); handleOpenNewProject() }}
                  >
                    <Plus size={14} />
                    <span className="text-sm">新建项目</span>
                  </div>
                </div>
              )}
            </div>

            {/* New Project Button */}
            <button
              onClick={handleOpenNewProject}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <Plus size={16} />
              <span className="text-sm font-medium">新建项目</span>
            </button>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end, divider }) => (
            <React.Fragment key={to}>
              {divider && <div className="h-px my-2" style={{ backgroundColor: 'var(--color-border)' }} />}
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden border',
                  isActive ? '' : ''
                ].join(' ')}
                style={({ isActive }) => isActive ? {
                  backgroundColor: 'rgba(99, 91, 255, 0.2)',
                  color: 'var(--color-primary-light)',
                  borderColor: 'rgba(99, 91, 255, 0.3)',
                  boxShadow: '0 10px 15px -3px rgba(99, 91, 255, 0.2)'
                } : {
                  color: 'var(--color-text-secondary)',
                  borderColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget;
                  if (!target.classList.contains('active')) {
                    target.style.color = 'var(--color-text-primary)';
                    target.style.backgroundColor = 'var(--color-bg-tertiary)';
                    target.style.borderColor = 'var(--color-border)';
                    target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget;
                  if (!target.classList.contains('active')) {
                    target.style.color = 'var(--color-text-secondary)';
                    target.style.backgroundColor = 'transparent';
                    target.style.borderColor = 'transparent';
                    target.style.boxShadow = 'none';
                  }
                }}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{label}</span>}
              </NavLink>
            </React.Fragment>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="px-2 py-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
          {/* User Avatar & Dropdown */}
          {!sidebarCollapsed && user && (
            <div className="relative flex-1 min-w-0">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2 w-full px-2 py-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                  <span className="text-white text-xs font-medium">{user.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{user.email}</div>
                </div>
                <ChevronDown size={14} className="flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              </button>

              {/* User Dropdown */}
              {userDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserDropdown(false)} />
                  <div
                    className="absolute bottom-full left-2 mb-2 w-48 rounded-lg border shadow-lg z-20"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-primary)';
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <LogOut size={16} />
                        退出登录
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Right side controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Notification Center */}
            {user && token && <NotificationCenter token={token} />}

            {/* Sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
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
            <div className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              选择一个模板快速开始，模板包含预设的知识库和内容基调
            </div>
            <TemplateSelector value={selectedTemplate} onChange={setSelectedTemplate} />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>项目名称 *</label>
              <input
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                placeholder="例如：618大促内容战略"
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>项目描述</label>
              <textarea
                value={newProjectDesc}
                onChange={e => setNewProjectDesc(e.target.value)}
                placeholder="简短描述项目目标（可选）"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 text-sm resize-none"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
