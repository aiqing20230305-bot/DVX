import { create } from 'zustand'
import { Script, AsyncStatus } from '../types/index.js'

interface ScriptStore {
  scripts: Script[]
  activeTopicId: string | null
  status: AsyncStatus
  error: string | null
  setScripts: (scripts: Script[]) => void
  addScript: (script: Script) => void
  setActiveTopicId: (id: string | null) => void
  updateScript: (id: string, data: Partial<Script>) => void
  setStatus: (status: AsyncStatus, error?: string) => void
  reset: () => void
  getScriptsByTopic: (topicId: string) => Script[]
}

export const useScriptStore = create<ScriptStore>((set, get) => ({
  scripts: [],
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

  setActiveTopicId: (id) => set({ activeTopicId: id }),

  updateScript: (id, data) => {
    set(state => ({
      scripts: state.scripts.map(s => s.id === id ? { ...s, ...data } : s)
    }))
  },

  setStatus: (status, error) => set({ status, error: error ?? null }),

  reset: () => set({ scripts: [], activeTopicId: null, status: 'idle', error: null }),

  getScriptsByTopic: (topicId) => get().scripts.filter(s => s.topic_id === topicId)
}))
