import { create } from 'zustand'
import { Script, AsyncStatus } from '../types/index.js'

interface ScriptStore {
  scripts: Script[]
  selectedIds: Set<string>
  activeTopicId: string | null
  status: AsyncStatus
  error: string | null
  setScripts: (scripts: Script[]) => void
  addScript: (script: Script) => void
  toggleSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  setActiveTopicId: (id: string | null) => void
  updateScript: (id: string, data: Partial<Script>) => void
  batchDelete: (ids: string[]) => Promise<void>
  setStatus: (status: AsyncStatus, error?: string) => void
  reset: () => void
  getScriptsByTopic: (topicId: string) => Script[]
}

export const useScriptStore = create<ScriptStore>((set, get) => ({
  scripts: [],
  selectedIds: new Set(),
  activeTopicId: null,
  status: 'idle',
  error: null,

  setScripts: (scripts) => set({ scripts }),

  addScript: (script) => {
    set(state => {
      // Replace if same topic+variant already exists
      const filtered = state.scripts.filter(s => !(s.topic_id === script.topic_id && s.variant === script.variant))
      return { scripts: [...filtered, script] }
    })
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
    set(state => ({ selectedIds: new Set(state.scripts.map(s => s.id)) }))
  },

  clearSelection: () => {
    set({ selectedIds: new Set() })
  },

  setActiveTopicId: (id) => set({ activeTopicId: id }),

  updateScript: (id, data) => {
    set(state => ({
      scripts: state.scripts.map(s => s.id === id ? { ...s, ...data } : s)
    }))
  },

  batchDelete: async (ids) => {
    try {
      const res = await fetch('/api/script/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      if (!res.ok) throw new Error('批量删除失败')

      set(state => ({
        scripts: state.scripts.filter(s => !ids.includes(s.id)),
        selectedIds: new Set([...state.selectedIds].filter(id => !ids.includes(id)))
      }))
    } catch (err) {
      console.error('Batch delete failed:', err)
      throw err
    }
  },

  setStatus: (status, error) => set({ status, error: error ?? null }),

  reset: () => set({ scripts: [], selectedIds: new Set(), activeTopicId: null, status: 'idle', error: null }),

  getScriptsByTopic: (topicId) => get().scripts.filter(s => s.topic_id === topicId)
}))
