import { create } from 'zustand'
import { Insight, AsyncStatus } from '../types/index.js'

interface InsightStore {
  insights: Insight[]
  selectedIds: Set<string>
  status: AsyncStatus
  error: string | null
  streamBuffer: string
  setInsights: (insights: Insight[]) => void
  addInsight: (insight: Insight) => void
  toggleSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  batchUpdateSelected: (ids: string[], selected: boolean) => Promise<void>
  batchDelete: (ids: string[]) => Promise<void>
  appendStream: (text: string) => void
  setStatus: (status: AsyncStatus, error?: string) => void
  reset: () => void
}

export const useInsightStore = create<InsightStore>((set, get) => ({
  insights: [],
  selectedIds: new Set(),
  status: 'idle',
  error: null,
  streamBuffer: '',

  setInsights: (insights) => {
    const selectedIds = new Set(insights.filter(i => i.selected).map(i => i.id))
    set({ insights, selectedIds })
  },

  addInsight: (insight) => {
    set(state => ({ insights: [...state.insights, insight] }))
  },

  toggleSelection: (id) => {
    set(state => {
      const next = new Set(state.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next }
    })
  },

  selectAll: () => {
    set(state => ({ selectedIds: new Set(state.insights.map(i => i.id)) }))
  },

  clearSelection: () => {
    set({ selectedIds: new Set() })
  },

  batchUpdateSelected: async (ids, selected) => {
    try {
      const res = await fetch('/api/insight/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, selected })
      })
      if (!res.ok) throw new Error('批量更新失败')

      set(state => ({
        insights: state.insights.map(i =>
          ids.includes(i.id) ? { ...i, selected } : i
        )
      }))
    } catch (err) {
      console.error('Batch update failed:', err)
      throw err
    }
  },

  batchDelete: async (ids) => {
    try {
      const res = await fetch('/api/insight/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      if (!res.ok) throw new Error('批量删除失败')

      set(state => ({
        insights: state.insights.filter(i => !ids.includes(i.id)),
        selectedIds: new Set([...state.selectedIds].filter(id => !ids.includes(id)))
      }))
    } catch (err) {
      console.error('Batch delete failed:', err)
      throw err
    }
  },

  appendStream: (text) => {
    set(state => ({ streamBuffer: state.streamBuffer + text }))
  },

  setStatus: (status, error) => {
    if (status === 'streaming') {
      set({ status, streamBuffer: '' })
    } else {
      set({ status, error: error ?? null })
    }
  },

  reset: () => set({ insights: [], selectedIds: new Set(), status: 'idle', error: null, streamBuffer: '' })
}))
