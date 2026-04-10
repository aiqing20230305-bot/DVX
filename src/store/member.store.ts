import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface PublicUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  status: string
  email_verified: boolean
  last_login_at?: number
  created_at: number
  updated_at: number
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  invited_by?: string
  joined_at: number
  created_at: number
  updated_at: number
  user: PublicUser
}

interface MemberState {
  // State
  members: ProjectMember[]
  loading: boolean
  error: string | null

  // Actions
  fetchMembers: (projectId: string) => Promise<void>
  inviteMember: (projectId: string, email: string, role: 'editor' | 'viewer') => Promise<ProjectMember>
  updateMemberRole: (memberId: string, role: 'owner' | 'editor' | 'viewer') => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  transferOwnership: (projectId: string, newOwnerId: string) => Promise<void>
  clearMembers: () => void
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export const useMemberStore = create<MemberState>()(
  devtools(
    (set, get) => ({
      // Initial state
      members: [],
      loading: false,
      error: null,

      // Fetch members by project
      fetchMembers: async (projectId: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`${API_BASE}/api/project/${projectId}/members`, {
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || errorData.message || '获取成员列表失败')
          }

          const data = await response.json()
          set({ members: data.members || [], loading: false })
        } catch (error) {
          const message = error instanceof Error ? error.message : '获取成员列表失败'
          set({ error: message, loading: false })
          throw error
        }
      },

      // Invite member
      inviteMember: async (projectId: string, email: string, role: 'editor' | 'viewer') => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`${API_BASE}/api/project/${projectId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, role })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || errorData.message || '邀请成员失败')
          }

          const data = await response.json()
          const newMember = data.member

          // Add to local state
          set(state => ({
            members: [...state.members, newMember],
            loading: false
          }))

          return newMember
        } catch (error) {
          const message = error instanceof Error ? error.message : '邀请成员失败'
          set({ error: message, loading: false })
          throw error
        }
      },

      // Update member role
      updateMemberRole: async (memberId: string, role: 'owner' | 'editor' | 'viewer') => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`${API_BASE}/api/project-member/${memberId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ role })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || errorData.message || '更新角色失败')
          }

          // Update local state
          set(state => ({
            members: state.members.map(m =>
              m.id === memberId ? { ...m, role, updated_at: Date.now() } : m
            ),
            loading: false
          }))
        } catch (error) {
          const message = error instanceof Error ? error.message : '更新角色失败'
          set({ error: message, loading: false })
          throw error
        }
      },

      // Remove member
      removeMember: async (memberId: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`${API_BASE}/api/project-member/${memberId}`, {
            method: 'DELETE',
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || errorData.message || '移除成员失败')
          }

          // Remove from local state
          set(state => ({
            members: state.members.filter(m => m.id !== memberId),
            loading: false
          }))
        } catch (error) {
          const message = error instanceof Error ? error.message : '移除成员失败'
          set({ error: message, loading: false })
          throw error
        }
      },

      // Transfer ownership
      transferOwnership: async (projectId: string, newOwnerId: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`${API_BASE}/api/project/${projectId}/transfer-ownership`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newOwnerId })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || errorData.message || '转移所有权失败')
          }

          // Refresh member list after ownership transfer
          await get().fetchMembers(projectId)
        } catch (error) {
          const message = error instanceof Error ? error.message : '转移所有权失败'
          set({ error: message, loading: false })
          throw error
        }
      },

      // Clear members (e.g., on project switch)
      clearMembers: () => {
        set({ members: [], error: null })
      }
    }),
    { name: 'member-store' }
  )
)
