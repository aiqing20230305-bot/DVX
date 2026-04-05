import { create } from 'zustand'
import { TopicCard, AsyncStatus } from '../types/index.js'

interface TopicStore {
  topics: TopicCard[]
  selectedIds: Set<string>
  status: AsyncStatus
  error: string | null
  setTopics: (topics: TopicCard[]) => void
  addTopic: (topic: TopicCard) => void
  toggleSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  updatePriority: (id: string, priority: number) => void
  batchUpdateSelected: (ids: string[], selected: boolean) => Promise<void>
  batchDelete: (ids: string[]) => Promise<void>
  setStatus: (status: AsyncStatus, error?: string) => void
  reset: () => void
}

export const useTopicStore = create<TopicStore>((set) => ({
  topics: [],
  selectedIds: new Set(),
  status: 'idle',
  error: null,

  setTopics: (topics) => {
    const selectedIds = new Set(topics.filter(t => t.selected).map(t => t.id))
    set({ topics, selectedIds })
  },

  addTopic: (topic) => {
    set(state => ({ topics: [...state.topics, topic] }))
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
    set(state => ({ selectedIds: new Set(state.topics.map(t => t.id)) }))
  },

  clearSelection: () => {
    set({ selectedIds: new Set() })
  },

  updatePriority: (id, priority) => {
    set(state => ({
      topics: state.topics.map(t => t.id === id ? { ...t, priority } : t)
    }))
  },

  batchUpdateSelected: async (ids, selected) => {
    try {
      const res = await fetch('/api/topic/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, selected })
      })
      if (!res.ok) throw new Error('批量更新失败')

      set(state => ({
        topics: state.topics.map(t =>
          ids.includes(t.id) ? { ...t, selected } : t
        )
      }))
    } catch (err) {
      console.error('Batch update failed:', err)
      throw err
    }
  },

  batchDelete: async (ids) => {
    try {
      const res = await fetch('/api/topic/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      if (!res.ok) throw new Error('批量删除失败')

      set(state => ({
        topics: state.topics.filter(t => !ids.includes(t.id)),
        selectedIds: new Set([...state.selectedIds].filter(id => !ids.includes(id)))
      }))
    } catch (err) {
      console.error('Batch delete failed:', err)
      throw err
    }
  },

  setStatus: (status, error) => set({ status, error: error ?? null }),

  reset: () => set({ topics: [], selectedIds: new Set(), status: 'idle', error: null })
}))
