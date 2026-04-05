import { create } from 'zustand'

const API_BASE = 'http://localhost:3001/api/questionnaire'

export interface Questionnaire {
  id: string
  title: string
  description?: string
  trigger_type: 'manual' | 'timed' | 'event'
  trigger_value?: string
  status: 'active' | 'archived'
  created_at: number
  updated_at: number
}

export interface Question {
  id: string
  questionnaire_id: string
  question_type: 'radio' | 'checkbox' | 'text' | 'rating'
  question_text: string
  options?: string // JSON array string
  required: number // 0=optional, 1=required
  order_index: number
  created_at: number
}

export interface QuestionnaireWithQuestions extends Questionnaire {
  questions: Question[]
}

export interface QuestionnaireResponse {
  id: string
  session_id: string
  questionnaire_id: string
  question_id: string
  question_text: string
  question_type: string
  answer: string
  created_at: number
}

export interface QuestionnaireStats {
  questionnaire_id: string
  total_responses: number
  response_rate?: number
  question_stats: Array<{
    question_id: string
    question_text: string
    question_type: string
    answer_distribution?: Record<string, number>
    average_rating?: number
    text_answers?: string[]
  }>
}

export interface QuestionnaireTrigger {
  id: string
  session_id: string
  questionnaire_id: string
  trigger_rule: string // JSON
  triggered_at: number
  shown: number
  answered: number
  response_id?: string
  created_at: number
}

export interface TriggerStats {
  questionnaire_id: string
  total_triggers: number
  shown_count: number
  answered_count: number
  answer_rate: number
}

interface QuestionnaireStore {
  questionnaires: Questionnaire[]
  currentQuestionnaire: QuestionnaireWithQuestions | null
  responses: QuestionnaireResponse[]
  stats: QuestionnaireStats | null
  triggers: QuestionnaireTrigger[]
  triggerStats: TriggerStats | null
  loading: boolean

  // Actions
  fetchQuestionnaires: (filters?: { status?: string }) => Promise<void>
  fetchQuestionnaireById: (id: string) => Promise<void>
  createQuestionnaire: (data: {
    title: string
    description?: string
    trigger_type?: 'manual' | 'timed' | 'event'
    trigger_value?: string
  }) => Promise<Questionnaire>
  updateQuestionnaire: (id: string, data: Partial<Questionnaire>) => Promise<void>
  deleteQuestionnaire: (id: string) => Promise<void>

  // Question actions
  addQuestion: (questionnaireId: string, data: {
    question_type: 'radio' | 'checkbox' | 'text' | 'rating'
    question_text: string
    options?: string[]
    required?: boolean
    order_index?: number
  }) => Promise<Question>
  updateQuestion: (questionId: string, data: Partial<Question>) => Promise<void>
  deleteQuestion: (questionId: string) => Promise<void>

  // Response actions
  submitQuestionnaire: (questionnaireId: string, sessionId: string, answers: Array<{
    question_id: string
    question_text: string
    question_type: string
    answer: string
  }>) => Promise<void>
  fetchResponses: (questionnaireId: string) => Promise<void>
  fetchStats: (questionnaireId: string) => Promise<void>

  // Trigger actions
  fetchTriggers: (questionnaireId: string) => Promise<void>
  fetchTriggerStats: (questionnaireId: string) => Promise<void>
}

export const useQuestionnaireStore = create<QuestionnaireStore>((set, get) => ({
  questionnaires: [],
  currentQuestionnaire: null,
  responses: [],
  stats: null,
  triggers: [],
  triggerStats: null,
  loading: false,

  fetchQuestionnaires: async (filters) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)

      const response = await fetch(`${API_BASE}?${params}`)
      if (!response.ok) throw new Error('Failed to fetch questionnaires')

      const data = await response.json()
      set({ questionnaires: data, loading: false })
    } catch (error) {
      console.error('Error fetching questionnaires:', error)
      set({ loading: false })
    }
  },

  fetchQuestionnaireById: async (id) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/${id}`)
      if (!response.ok) throw new Error('Failed to fetch questionnaire')

      const data = await response.json()
      set({ currentQuestionnaire: data, loading: false })
    } catch (error) {
      console.error('Error fetching questionnaire:', error)
      set({ loading: false })
    }
  },

  createQuestionnaire: async (data) => {
    set({ loading: true })
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create questionnaire')

      const questionnaire = await response.json()
      set((state) => ({
        questionnaires: [questionnaire, ...state.questionnaires],
        loading: false
      }))
      return questionnaire
    } catch (error) {
      console.error('Error creating questionnaire:', error)
      set({ loading: false })
      throw error
    }
  },

  updateQuestionnaire: async (id, data) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update questionnaire')

      const updated = await response.json()
      set((state) => ({
        questionnaires: state.questionnaires.map(q => q.id === id ? updated : q),
        currentQuestionnaire: updated,
        loading: false
      }))
    } catch (error) {
      console.error('Error updating questionnaire:', error)
      set({ loading: false })
      throw error
    }
  },

  deleteQuestionnaire: async (id) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete questionnaire')

      set((state) => ({
        questionnaires: state.questionnaires.filter(q => q.id !== id),
        loading: false
      }))
    } catch (error) {
      console.error('Error deleting questionnaire:', error)
      set({ loading: false })
      throw error
    }
  },

  addQuestion: async (questionnaireId, data) => {
    set({ loading: true })
    try {
      const payload = {
        ...data,
        options: data.options ? JSON.stringify(data.options) : undefined,
        required: data.required ? 1 : 0
      }

      const response = await fetch(`${API_BASE}/${questionnaireId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Failed to add question')

      const question = await response.json()

      // Refresh current questionnaire
      await get().fetchQuestionnaireById(questionnaireId)

      set({ loading: false })
      return question
    } catch (error) {
      console.error('Error adding question:', error)
      set({ loading: false })
      throw error
    }
  },

  updateQuestion: async (questionId, data) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/question/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update question')

      set({ loading: false })
    } catch (error) {
      console.error('Error updating question:', error)
      set({ loading: false })
      throw error
    }
  },

  deleteQuestion: async (questionId) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/question/${questionId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete question')

      set({ loading: false })
    } catch (error) {
      console.error('Error deleting question:', error)
      set({ loading: false })
      throw error
    }
  },

  submitQuestionnaire: async (questionnaireId, sessionId, answers) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/${questionnaireId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, answers })
      })
      if (!response.ok) throw new Error('Failed to submit questionnaire')

      set({ loading: false })
    } catch (error) {
      console.error('Error submitting questionnaire:', error)
      set({ loading: false })
      throw error
    }
  },

  fetchResponses: async (questionnaireId) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/${questionnaireId}/responses`)
      if (!response.ok) throw new Error('Failed to fetch responses')

      const data = await response.json()
      set({ responses: data, loading: false })
    } catch (error) {
      console.error('Error fetching responses:', error)
      set({ loading: false })
    }
  },

  fetchStats: async (questionnaireId) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/${questionnaireId}/stats`)
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      set({ stats: data, loading: false })
    } catch (error) {
      console.error('Error fetching stats:', error)
      set({ loading: false })
    }
  },

  fetchTriggers: async (questionnaireId) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/${questionnaireId}/triggers`)
      if (!response.ok) throw new Error('Failed to fetch triggers')

      const data = await response.json()
      set({ triggers: data, loading: false })
    } catch (error) {
      console.error('Error fetching triggers:', error)
      set({ loading: false })
    }
  },

  fetchTriggerStats: async (questionnaireId) => {
    set({ loading: true })
    try {
      const response = await fetch(`${API_BASE}/${questionnaireId}/trigger-stats`)
      if (!response.ok) throw new Error('Failed to fetch trigger stats')

      const data = await response.json()
      set({ triggerStats: data, loading: false })
    } catch (error) {
      console.error('Error fetching trigger stats:', error)
      set({ loading: false })
    }
  }
}))
