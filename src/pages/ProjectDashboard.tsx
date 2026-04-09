import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/project.store.js'
import { api } from '../api/client.js'
import {
  Database, Lightbulb, FileText, PenTool, Calendar,
  TrendingUp, Users, Target, Tag, Edit, ArrowLeft, Loader, Activity
} from 'lucide-react'
import { Button } from '../components/shared/Button.js'
import { Badge } from '../components/shared/Badge.js'
import { Modal } from '../components/shared/Modal.js'
import { ProjectTimeline } from '../components/timeline/ProjectTimeline.js'
import { ActivityHeatmap } from '../components/timeline/ActivityHeatmap.js'
import type { UpdateProjectInput } from '../store/project.store.js'

interface ProjectStats {
  uploads: number
  insights: number
  topics: number
  scripts: number
  selectedInsights: number
  selectedTopics: number
}

export function ProjectDashboard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, fetchProject, updateProject } = useProjectStore()
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState<UpdateProjectInput>({})
  const [saving, setSaving] = useState(false)

  const project = projects.find(p => p.id === id)

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      await fetchProject(id)
      const { stats } = await api.get<{ stats: ProjectStats }>(`/project/${id}/stats`)
      setStats(stats)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = () => {
    if (!project) return
    setEditForm({
      name: project.name,
      description: project.description,
      brand: project.brand,
      category: project.category,
      target_audience: project.target_audience,
      campaign: project.campaign,
      start_date: project.start_date,
      end_date: project.end_date,
      tags: project.tags
    })
    setEditModal(true)
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      await updateProject(id, editForm)
      setEditModal(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin" style={{ color: 'var(--color-primary)' }} size={32} />
      </div>
    )
  }

  if (!project || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div style={{ color: 'var(--color-text-secondary)' }}>项目不存在</div>
        <Button onClick={() => navigate('/')}>返回工作台</Button>
      </div>
    )
  }

  const statCards = [
    { label: '上传文件', value: stats.uploads, icon: Database, color: 'text-blue-400', to: '/' },
    { label: '洞察数量', value: stats.insights, icon: Lightbulb, color: 'text-yellow-400', badge: `${stats.selectedInsights} 已选`, to: '/insights' },
    { label: '选题数量', value: stats.topics, icon: FileText, color: 'text-green-400', badge: `${stats.selectedTopics} 已选`, to: '/topics' },
    { label: '脚本数量', value: stats.scripts, icon: PenTool, color: 'text-purple-400', to: '/scripts' },
  ]

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft size={16} />
                返回
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{project.name}</h1>
                {project.description && (
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{project.description}</p>
                )}
              </div>
            </div>
            <Button size="sm" onClick={openEditModal}>
              <Edit size={16} />
              编辑项目
            </Button>
          </div>

          {/* Project Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {project.brand && (
              <div className="rounded-lg p-4 border" style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)'
              }}>
                <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <Target size={14} />
                  品牌
                </div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{project.brand}</div>
              </div>
            )}
            {project.category && (
              <div className="rounded-lg p-4 border" style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)'
              }}>
                <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <TrendingUp size={14} />
                  品类
                </div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{project.category}</div>
              </div>
            )}
            {project.target_audience && (
              <div className="rounded-lg p-4 border" style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)'
              }}>
                <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <Users size={14} />
                  目标人群
                </div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{project.target_audience}</div>
              </div>
            )}
            {project.campaign && (
              <div className="rounded-lg p-4 border" style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)'
              }}>
                <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <Calendar size={14} />
                  营销活动
                </div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{project.campaign}</div>
              </div>
            )}
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={16} className="text-[#8F959E]" />
              {project.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(card => (
              <div
                key={card.label}
                onClick={() => navigate(card.to)}
                className="bg-[#F7F8FA] rounded-lg p-5 border border-[#DEE0E3] hover:border-[#C9CDD4] transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <card.icon className={`${card.color} group-hover:scale-110 transition-transform`} size={24} />
                  {card.badge && (
                    <Badge variant="secondary" className="text-xs">{card.badge}</Badge>
                  )}
                </div>
                <div className="text-3xl font-bold text-[#1F2329] mb-1">{card.value}</div>
                <div className="text-sm text-[#646A73]">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Activity Heatmap */}
          <div className="bg-[#F7F8FA] rounded-lg p-6 border border-[#DEE0E3]">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={20} className="text-[#5B8EFF]" />
              <h2 className="text-lg font-semibold text-[#1F2329]">活动趋势（最近30天）</h2>
            </div>
            <ActivityHeatmap projectId={id!} days={30} />
          </div>

          {/* Timeline */}
          <div className="bg-[#F7F8FA] rounded-lg p-6 border border-[#DEE0E3]">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-[#5B8EFF]" />
              <h2 className="text-lg font-semibold text-[#1F2329]">项目时间线</h2>
            </div>
            <ProjectTimeline projectId={id!} limit={50} />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title="编辑项目"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModal(false)}>取消</Button>
            <Button loading={saving} onClick={handleSave}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#646A73] mb-1.5">项目名称 *</label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#F2F3F5] border border-[#DEE0E3] focus:border-[#3370FF] focus:outline-none focus:ring-1 focus:ring-[#3370FF] text-[#1F2329] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#646A73] mb-1.5">项目描述</label>
            <textarea
              value={editForm.description || ''}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#F2F3F5] border border-[#DEE0E3] focus:border-[#3370FF] focus:outline-none focus:ring-1 focus:ring-[#3370FF] text-[#1F2329] text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#646A73] mb-1.5">品牌名称</label>
              <input
                type="text"
                value={editForm.brand || ''}
                onChange={e => setEditForm({ ...editForm, brand: e.target.value })}
                placeholder="例如：多芬"
                className="w-full px-3 py-2 rounded-lg bg-[#F2F3F5] border border-[#DEE0E3] focus:border-[#3370FF] focus:outline-none focus:ring-1 focus:ring-[#3370FF] text-[#1F2329] placeholder-[#737373] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#646A73] mb-1.5">品类</label>
              <input
                type="text"
                value={editForm.category || ''}
                onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                placeholder="例如：个护"
                className="w-full px-3 py-2 rounded-lg bg-[#F2F3F5] border border-[#DEE0E3] focus:border-[#3370FF] focus:outline-none focus:ring-1 focus:ring-[#3370FF] text-[#1F2329] placeholder-[#737373] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#646A73] mb-1.5">目标人群</label>
            <input
              type="text"
              value={editForm.target_audience || ''}
              onChange={e => setEditForm({ ...editForm, target_audience: e.target.value })}
              placeholder="例如：25-35岁女性"
              className="w-full px-3 py-2 rounded-lg bg-[#F2F3F5] border border-[#DEE0E3] focus:border-[#3370FF] focus:outline-none focus:ring-1 focus:ring-[#3370FF] text-[#1F2329] placeholder-[#737373] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#646A73] mb-1.5">营销活动</label>
            <input
              type="text"
              value={editForm.campaign || ''}
              onChange={e => setEditForm({ ...editForm, campaign: e.target.value })}
              placeholder="例如：618大促"
              className="w-full px-3 py-2 rounded-lg bg-[#F2F3F5] border border-[#DEE0E3] focus:border-[#3370FF] focus:outline-none focus:ring-1 focus:ring-[#3370FF] text-[#1F2329] placeholder-[#737373] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#646A73] mb-1.5">标签（用逗号分隔）</label>
            <input
              type="text"
              value={editForm.tags?.join(', ') || ''}
              onChange={e => setEditForm({ ...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="例如：快消品, 女性, 个护"
              className="w-full px-3 py-2 rounded-lg bg-[#F2F3F5] border border-[#DEE0E3] focus:border-[#3370FF] focus:outline-none focus:ring-1 focus:ring-[#3370FF] text-[#1F2329] placeholder-[#737373] text-sm"
            />
          </div>
        </div>
      </Modal>
    </>
  )
}
