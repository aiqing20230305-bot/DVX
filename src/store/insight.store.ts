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
