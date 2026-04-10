import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { PublicUser } from './member.store'

export interface Comment {
  id: string
  project_id: string
  target_type: 'insight' | 'topic' | 'script' | 'report'
  target_id: string
  user_id: string
  content: string
  parent_id?: string
  mentions: string[]
  created_at: number
  updated_at: number
  user: PublicUser
  replies?: Comment[]
}

export interface CreateCommentInput {
  project_id: string
  target_type: 'insight' | 'topic' | 'script' | 'report'
  target_id: string
  content: string
  parent_id?: string
  mentions?: string[]
}

interface CommentState {
  // State - comments grouped by target
  comments: Record<string, Comment[]>  // key: "targetType:targetId"
  loading: Record<string, boolean>
  error: Record<string, string | null>

  // Actions
  fetchComments: (targetType: string, targetId: string) => Promise<void>
  addComment: (comment: CreateCommentInput) => Promise<Comment>
  deleteComment: (commentId: string, targetType: string, targetId: string) => Promise<void>
  clearComments: (targetType: string, targetId: string) => void
  getCommentCount: (targetType: string, targetId: string) => number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// Helper to generate cache key
const getCacheKey = (targetType: string, targetId: string) => `${targetType}:${targetId}`

// Helper to flatten comments (includes replies)
const flattenComments = (comments: Comment[]): Comment[] => {
  return comments.flatMap(comment => [
    comment,
    ...(comment.replies ? flattenComments(comment.replies) : [])
  ])
}

export const useCommentStore = create<CommentState>()(
  devtools(
    (set, get) => ({
      // Initial state
      comments: {},
      loading: {},
      error: {},

      // Fetch comments by target
      fetchComments: async (targetType: string, targetId: string) => {
        const key = getCacheKey(targetType, targetId)

        set(state => ({
          loading: { ...state.loading, [key]: true },
          error: { ...state.error, [key]: null }
        }))

        try {
          const response = await fetch(
            `${API_BASE}/api/comments?target_type=${targetType}&target_id=${targetId}`,
            { credentials: 'include' }
          )

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || errorData.message || '获取评论失败')
          }

          const data = await response.json()

          set(state => ({
            comments: { ...state.comments, [key]: data.comments || [] },
            loading: { ...state.loading, [key]: false }
          }))
        } catch (error) {
          const message = error instanceof Error ? error.message : '获取评论失败'
          set(state => ({
            error: { ...state.error, [key]: message },
            loading: { ...state.loading, [key]: false }
          }))
          throw error
        }
      },

      // Add comment
      addComment: async (input: CreateCommentInput) => {
        const key = getCacheKey(input.target_type, input.target_id)

        set(state => ({
          loading: { ...state.loading, [key]: true },
          error: { ...state.error, [key]: null }
        }))

        try {
          const response = await fetch(`${API_BASE}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(input)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || errorData.message || '创建评论失败')
          }

          const data = await response.json()
          const newComment = data.comment

          // Optimistically add comment to store
          set(state => {
            const currentComments = state.comments[key] || []

            // If it's a reply, find the parent and add to its replies
            if (input.parent_id) {
              const updateComments = (comments: Comment[]): Comment[] => {
                return comments.map(comment => {
                  if (comment.id === input.parent_id) {
                    return {
                      ...comment,
                      replies: [...(comment.replies || []), newComment]
                    }
                  }
                  if (comment.replies && comment.replies.length > 0) {
                    return {
                      ...comment,
                      replies: updateComments(comment.replies)
                    }
                  }
                  return comment
                })
              }

              return {
                comments: { ...state.comments, [key]: updateComments(currentComments) },
                loading: { ...state.loading, [key]: false }
              }
            }

            // Otherwise, add as top-level comment
            return {
              comments: { ...state.comments, [key]: [...currentComments, newComment] },
              loading: { ...state.loading, [key]: false }
            }
          })

          return newComment
        } catch (error) {
          const message = error instanceof Error ? error.message : '创建评论失败'
          set(state => ({
            error: { ...state.error, [key]: message },
            loading: { ...state.loading, [key]: false }
          }))
          throw error
        }
      },

      // Delete comment
      deleteComment: async (commentId: string, targetType: string, targetId: string) => {
        const key = getCacheKey(targetType, targetId)

        set(state => ({
          loading: { ...state.loading, [key]: true },
          error: { ...state.error, [key]: null }
        }))

        try {
          const response = await fetch(`${API_BASE}/api/comments/${commentId}`, {
            method: 'DELETE',
            credentials: 'include'
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || errorData.message || '删除评论失败')
          }

          // Remove comment from store (including all replies due to CASCADE)
          set(state => {
            const currentComments = state.comments[key] || []

            const removeComment = (comments: Comment[]): Comment[] => {
              return comments
                .filter(comment => comment.id !== commentId)
                .map(comment => ({
                  ...comment,
                  replies: comment.replies ? removeComment(comment.replies) : []
                }))
            }

            return {
              comments: { ...state.comments, [key]: removeComment(currentComments) },
              loading: { ...state.loading, [key]: false }
            }
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : '删除评论失败'
          set(state => ({
            error: { ...state.error, [key]: message },
            loading: { ...state.loading, [key]: false }
          }))
          throw error
        }
      },

      // Clear comments for a target
      clearComments: (targetType: string, targetId: string) => {
        const key = getCacheKey(targetType, targetId)
        set(state => {
          const { [key]: _, ...rest } = state.comments
          return { comments: rest }
        })
      },

      // Get comment count (including replies)
      getCommentCount: (targetType: string, targetId: string) => {
        const key = getCacheKey(targetType, targetId)
        const comments = get().comments[key] || []
        return flattenComments(comments).length
      }
    }),
    { name: 'comment-store' }
  )
)
