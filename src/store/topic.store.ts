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
  updatePriority: (id: string, priority: number) => void
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

  updatePriority: (id, priority) => {
    set(state => ({
      topics: state.topics.map(t => t.id === id ? { ...t, priority } : t)
    }))
  },

  setStatus: (status, error) => set({ status, error: error ?? null }),

  reset: () => set({ topics: [], selectedIds: new Set(), status: 'idle', error: null })
}))
