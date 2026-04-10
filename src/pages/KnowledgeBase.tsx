import React, { useState, useEffect, useCallback } from 'react'
import { BookOpen, Search, Plus, Trash2, Tag, Filter, AlertCircle, Sparkles } from 'lucide-react'
import { kbApi } from '../api/kb.api.js'
import { KBItem } from '../types/index.js'
import { Button } from '../components/shared/Button.js'
import { Modal } from '../components/shared/Modal.js'
import { Badge } from '../components/shared/Badge.js'
import { useProjectStore } from '../store/project.store.js'
import { KBSearch, KBSearchResult } from '../components/kb/KBSearch.js'

const typeOptions: Array<{ value: KBItem['type']; label: string }> = [
  { value: 'report', label: '战略报告' },
  { value: 'template', label: '脚本模板' },
  { value: 'tone', label: '品牌语气' },
  { value: 'insight', label: '市场洞察' },
  { value: 'other', label: '其他' },
]

const typeColors: Record<string, string> = {
  report: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  template: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  tone: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  insight: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  other: 'bg-gray-700 text-gray-300',
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function KnowledgeBase() {
  const { activeProjectId } = useProjectStore()
  const [items, setItems] = useState<KBItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewItem, setViewItem] = useState<KBItem | null>(null)
  const [form, setForm] = useState({ type: 'other' as KBItem['type'], title: '', content: '', tags: '' })
  const [creating, setCreating] = useState(false)
  const [searchMode, setSearchMode] = useState<'basic' | 'ai'>('basic')

  const fetchItems = useCallback(async () => {
    if (!activeProjectId) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const { items } = await kbApi.list({ projectId: activeProjectId, type: filterType || undefined, q: search || undefined })
      setItems(items)
    } finally {
      setLoading(false)
    }
  }, [activeProjectId, search, filterType])

  useEffect(() => {
    const t = setTimeout(fetchItems, 300)
    return () => clearTimeout(t)
  }, [fetchItems])

  const handleCreate = async () => {
    if (!form.title || !form.content || !activeProjectId) return
    setCreating(true)
    try {
      const tags = form.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
      const { item } = await kbApi.create({ ...form, tags, projectId: activeProjectId })
      setItems(prev => [item, ...prev])
      setModalOpen(false)
      setForm({ type: 'other', title: '', content: '', tags: '' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此条目？')) return
    await kbApi.delete(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleAISearchResult = (result: KBSearchResult) => {
    // Convert KBSearchResult to KBItem for viewing
    const item: KBItem = {
      id: result.id,
      type: result.type,
      title: result.title,
      content: result.content,
      tags: result.tags,
      project_id: result.project_id,
      created_at: result.created_at,
      updated_at: result.updated_at
    }
    setViewItem(item)
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl border flex items-center justify-center" style={{
            backgroundColor: 'rgba(99, 91, 255, 0.2)',
            borderColor: 'rgba(99, 91, 255, 0.3)'
          }}>
            <BookOpen size={18} style={{ color: 'var(--color-primary-light)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>知识库</h1>
        </div>
        <p className="text-sm ml-12" style={{ color: 'var(--color-text-tertiary)' }}>存储报告、模板、品牌语气等可复用的内容资产</p>
      </div>

      {/* Project warning */}
      {!activeProjectId && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <BookOpen size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-900 mb-1">请先选择项目</div>
            <p className="text-xs text-amber-700">知识库内容按项目隔离，请先在侧边栏选择一个项目</p>
          </div>
        </div>
      )}

      {/* Search Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSearchMode('basic')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            searchMode === 'basic'
              ? 'text-white'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
          }`}
          style={{
            backgroundColor: searchMode === 'basic' ? 'var(--color-primary)' : 'transparent'
          }}
        >
          <div className="flex items-center gap-2">
            <Search size={14} />
            <span>基础搜索</span>
          </div>
        </button>
        <button
          onClick={() => setSearchMode('ai')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            searchMode === 'ai'
              ? 'text-white'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
          }`}
          style={{
            backgroundColor: searchMode === 'ai' ? 'var(--color-primary)' : 'transparent'
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} />
            <span>AI智能搜索</span>
          </div>
        </button>
      </div>

      {/* Search Panel */}
      {searchMode === 'basic' ? (
        <>
          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Search */}
            <div className="flex-1 min-w-48 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索标题、内容、标签..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1"
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

            {/* Type filter */}
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-tertiary)' }} />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="pl-8 pr-8 py-2 border rounded-lg text-sm focus:outline-none appearance-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <option value="">全部类型</option>
                {typeOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <Button
              icon={<Plus size={15} />}
              onClick={() => setModalOpen(true)}
              disabled={!activeProjectId}
            >
              新增条目
            </Button>
          </div>
        </>
      ) : (
        <div className="mb-6 p-6 rounded-xl border" style={{
          backgroundColor: 'var(--color-bg-elevated-1)',
          borderColor: 'var(--color-border)'
        }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>AI智能搜索</h3>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            使用 FTS5 全文检索和 BM25 排序算法，智能匹配知识库内容
          </p>
          <KBSearch
            projectId={activeProjectId}
            onResultClick={handleAISearchResult}
          />
        </div>
      )}

      {/* Stats - Only show in basic search mode */}
      {searchMode === 'basic' && (
        <>
          <div className="flex gap-4 mb-6 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>共 {items.length} 条记录</span>
            {filterType && <span>· 筛选：{typeOptions.find(t => t.value === filterType)?.label}</span>}
            {search && <span>· 搜索："{search}"</span>}
          </div>

          {/* Items grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4" style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)'
          }}>
            <BookOpen size={28} style={{ color: 'var(--color-text-disabled)' }} />
          </div>
          <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>知识库为空</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-disabled)' }}>生成报告后可保存到知识库，或点击「新增条目」手动添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className="border rounded-xl p-4 transition-all card-hover cursor-pointer"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              onClick={() => setViewItem(item)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[item.type] ?? 'bg-[#DEE0E3] text-[#646A73]'}`}>
                  {typeOptions.find(t => t.value === item.type)?.label ?? item.type}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#C9CDD4]">{formatDate(item.created_at)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                    className="p-1 rounded hover:bg-red-900/30 hover:text-red-400 text-[#C9CDD4] transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-[#1F2329] mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-xs text-[#8F959E] line-clamp-2 mb-3">{item.content.replace(/<[^>]+>/g, ' ')}</p>

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded bg-[#DEE0E3] text-[#646A73]">
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 4 && <span className="text-xs text-[#C9CDD4]">+{item.tags.length - 4}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新增知识库条目"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button loading={creating} onClick={handleCreate} disabled={!form.title || !form.content}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#646A73] mb-1.5">类型 *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as KBItem['type'] }))}
                className="w-full px-3 py-2 bg-[#F2F3F5] border border-[#DEE0E3] rounded-lg text-sm text-[#1F2329] focus:outline-none focus:border-[#3370FF]"
              >
                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#646A73] mb-1.5">标签</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="用逗号分隔"
                className="w-full px-3 py-2 bg-[#F2F3F5] border border-[#DEE0E3] rounded-lg text-sm text-[#1F2329] placeholder-[#737373] focus:outline-none focus:border-[#3370FF]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#646A73] mb-1.5">标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="条目标题"
              className="w-full px-3 py-2 bg-[#F2F3F5] border border-[#DEE0E3] rounded-lg text-sm text-[#1F2329] placeholder-[#737373] focus:outline-none focus:border-[#3370FF]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#646A73] mb-1.5">内容 *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="输入内容..."
              rows={6}
              className="w-full px-3 py-2 bg-[#F2F3F5] border border-[#DEE0E3] rounded-lg text-sm text-[#1F2329] placeholder-[#737373] resize-none focus:outline-none focus:border-[#3370FF]"
            />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.title}
        size="xl"
      >
        {viewItem && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[viewItem.type]}`}>
                {typeOptions.find(t => t.value === viewItem.type)?.label}
              </span>
              {viewItem.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[#DEE0E3] text-[#646A73]">{tag}</span>
              ))}
            </div>
            <div className="bg-[#F2F3F5] rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-[#646A73] whitespace-pre-wrap font-sans leading-relaxed">
                {viewItem.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
