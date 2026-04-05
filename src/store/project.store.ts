import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Project } from '../types/index.js'
import { api } from '../api/client.js'

export interface CreateProjectInput {
  name: string
  description?: string
  brand?: string
  category?: string
  target_audience?: string
  campaign?: string
  start_date?: number
  end_date?: number
  tags?: string[]
  templateId?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  brand?: string
  category?: string
  target_audience?: string
  campaign?: string
  start_date?: number
  end_date?: number
  status?: 'active' | 'archived'
  tags?: string[]
}

interface ProjectStore {
  projects: Project[]
  activeProjectId: string | null
  loading: boolean
  setActiveProject: (id: string | null) => void
  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<Project | null>
  addProject: (input: CreateProjectInput) => Promise<Project>
  updateProject: (id: string, data: UpdateProjectInput) => Promise<void>
  removeProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      loading: false,

      setActiveProject: (id) => set({ activeProjectId: id }),

      fetchProjects: async () => {
        set({ loading: true })
        try {
          const { projects } = await api.get<{ projects: Project[] }>('/project')
          set({ projects })
          // Auto-select first project if none selected
          if (!get().activeProjectId && projects.length > 0) {
            set({ activeProjectId: projects[0]!.id })
          }
        } finally {
          set({ loading: false })
        }
      },

      fetchProject: async (id) => {
        try {
          const { project } = await api.get<{ project: Project }>(`/project/${id}`)
          // Update cache
          set(state => ({
            projects: state.projects.map(p => p.id === id ? project : p)
          }))
          return project
        } catch {
          return null
        }
      },

      addProject: async (input) => {
        const { project } = await api.post<{ project: Project }>('/project', input)
        set(state => ({ projects: [project, ...state.projects], activeProjectId: project.id }))
        return project
      },

      updateProject: async (id, data) => {
        const { project } = await api.put<{ project: Project }>(`/project/${id}`, data)
        set(state => ({ projects: state.projects.map(p => p.id === id ? project : p) }))
      },

      removeProject: async (id) => {
        await api.delete(`/project/${id}`)
        set(state => {
          const projects = state.projects.filter(p => p.id !== id)
          const activeProjectId = state.activeProjectId === id ? (projects[0]?.id ?? null) : state.activeProjectId
          return { projects, activeProjectId }
        })
      }
    }),
    {
      name: 'project-store',
      partialize: (state) => ({ activeProjectId: state.activeProjectId })
    }
  )
)
