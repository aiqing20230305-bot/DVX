import { create } from 'zustand'

export interface TestSession {
  id: string
  user_name: string
  user_role: string
  user_email: string | null
  scenario: string
  status: 'active' | 'completed' | 'abandoned'
  start_time: number
  end_time: number | null
  notes: string | null
  created_at: number
  updated_at: number
}

export interface UserAction {
  id: string
  session_id: string
  action_type: 'click' | 'navigate' | 'input' | 'scroll' | 'error' | 'success' | 'confusion'
  page: string
  target: string | null
  details: string | null
  timestamp: number
}

export interface FeedbackResponse {
  id: string
  session_id: string
  question_id: string
  question_text: string
  answer: string
  created_at: number
}

interface TestingStore {
  sessions: TestSession[]
  currentSession: TestSession | null
  actions: UserAction[]
  feedback: FeedbackResponse[]
  loading: boolean

  // Session management
  fetchSessions: () => Promise<void>
  fetchSessionById: (id: string) => Promise<void>
  createSession: (data: { user_name: string; user_role: string; user_email?: string; scenario: string }) => Promise<TestSession>
  completeSession: (id: string, notes?: string) => Promise<void>

  // Actions
  fetchActions: (sessionId: string) => Promise<void>
  recordAction: (data: { session_id: string; action_type: UserAction['action_type']; page: string; target?: string; details?: string }) => Promise<void>

  // Feedback
  fetchFeedback: (sessionId: string) => Promise<void>
  submitFeedback: (data: { session_id: string; question_id: string; question_text: string; answer: string }) => Promise<void>
  submitFeedbackBatch: (data: { session_id: string; responses: Array<{ question_id: string; question_text: string; answer: string }> }) => Promise<void>
}

const API_BASE = 'http://localhost:3001/api/testing'

export const useTestingStore = create<TestingStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  actions: [],
  feedback: [],
  loading: false,

  fetchSessions: async () => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/session`)
      const data = await res.json()
      set({ sessions: data.sessions, loading: false })
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      set({ loading: false })
    }
  },

  fetchSessionById: async (id: string) => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/session/${id}`)
      const data = await res.json()
      set({ currentSession: data.session, loading: false })
    } catch (error) {
      console.error('Failed to fetch session:', error)
      set({ loading: false })
    }
  },

  createSession: async (data) => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      set({ currentSession: result.session, loading: false })
      return result.session
    } catch (error) {
      console.error('Failed to create session:', error)
      set({ loading: false })
      throw error
    }
  },

  completeSession: async (id: string, notes?: string) => {
    try {
      await fetch(`${API_BASE}/session/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      await get().fetchSessions()
    } catch (error) {
      console.error('Failed to complete session:', error)
      throw error
    }
  },

  fetchActions: async (sessionId: string) => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/action/${sessionId}`)
      const data = await res.json()
      set({ actions: data.actions, loading: false })
    } catch (error) {
      console.error('Failed to fetch actions:', error)
      set({ loading: false })
    }
  },

  recordAction: async (data) => {
    try {
      await fetch(`${API_BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to record action:', error)
    }
  },

  fetchFeedback: async (sessionId: string) => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/feedback/${sessionId}`)
      const data = await res.json()
      set({ feedback: data.feedback, loading: false })
    } catch (error) {
      console.error('Failed to fetch feedback:', error)
      set({ loading: false })
    }
  },

  submitFeedback: async (data) => {
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      throw error
    }
  },

  submitFeedbackBatch: async (data) => {
    try {
      await fetch(`${API_BASE}/feedback/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to submit feedback batch:', error)
      throw error
    }
  }
}))
