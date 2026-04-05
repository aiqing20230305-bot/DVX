import React, { useState, useEffect, useCallback } from 'react'
import { BookOpen, Search, Plus, Trash2, Tag, Filter } from 'lucide-react'
import { kbApi } from '../api/kb.api.js'
import { KBItem } from '../types/index.js'
import { Button } from '../components/shared/Button.js'
import { Modal } from '../components/shared/Modal.js'
import { Badge } from '../components/shared/Badge.js'

const typeOptions: Array<{ value: KBItem['type']; label: string }> = [
  { value: 'report', label: '战略报告' },
  { value: 'template', label: '脚本模板' },
  { value: 'tone', label: '品牌语气' },
  { value: 'insight', label: '市场洞察' },
  { value: 'other', label: '其他' },
]

const typeColors: Record<string, string> = {
  report: 'bg-indigo-900/50 text-indigo-300',
  template: 'bg-emerald-900/50 text-emerald-300',
  tone: 'bg-purple-900/50 text-purple-300',
  insight: 'bg-blue-900/50 text-blue-300',
  other: 'bg-slate-700 text-slate-300',
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function KnowledgeBase() {
  const [items, setItems] = useState<KBItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewItem, setViewItem] = useState<KBItem | null>(null)
  const [form, setForm] = useState({ type: 'other' as KBItem['type'], title: '', content: '', tags: '' })
  const [creating, setCreating] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const { items } = await kbApi.list({ type: filterType || undefined, q: search || undefined })
      setItems(items)
    } finally {
      setLoading(false)
    }
  }, [search, filterType])

  useEffect(() => {
    const t = setTimeout(fetchItems, 300)
    return () => clearTimeout(t)
  }, [fetchItems])

  const handleCreate = async () => {
    if (!form.title || !form.content) return
    setCreating(true)
    try {
      const tags = form.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
      const { item } = await kbApi.create({ ...form, tags })
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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
            <BookOpen size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">知识库</h1>
        </div>
        <p className="text-slate-500 text-sm ml-12">存储报告、模板、品牌语气等可复用的内容资产</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索标题、内容、标签..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Type filter */}
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="pl-8 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
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
        >
          新增条目
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6 text-xs text-slate-500">
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
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-slate-600" />
          </div>
          <h3 className="text-slate-400 font-medium mb-2">知识库为空</h3>
          <p className="text-slate-600 text-sm">生成报告后可保存到知识库，或点击「新增条目」手动添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all card-hover cursor-pointer"
              onClick={() => setViewItem(item)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[item.type] ?? 'bg-slate-700 text-slate-300'}`}>
                  {typeOptions.find(t => t.value === item.type)?.label ?? item.type}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-600">{formatDate(item.created_at)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                    className="p-1 rounded hover:bg-red-900/30 hover:text-red-400 text-slate-600 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-200 mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.content.replace(/<[^>]+>/g, ' ')}</p>

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 4).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 4 && <span className="text-xs text-slate-600">+{item.tags.length - 4}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
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
              <label className="block text-xs font-medium text-slate-400 mb-1.5">类型 *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as KBItem['type'] }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">标签</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="用逗号分隔"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="条目标题"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">内容 *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="输入内容..."
              rows={6}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500"
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
                <span key={tag} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{tag}</span>
              ))}
            </div>
            <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {viewItem.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
