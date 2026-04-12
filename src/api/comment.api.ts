// v2.22.0 Phase 2: 评论协作系统API

import { api } from './client.js'

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
  user: {
    id: string
    username: string
    email: string
  }
  replies?: Comment[]
}

export interface CreateCommentInput {
  target_type: 'insight' | 'topic' | 'script' | 'report'
  target_id: string
  content: string
  project_id: string
  parent_id?: string
  mentions?: string[]
}

export interface CommentsResponse {
  target_type: string
  target_id: string
  comments: Comment[]
  total: number
}

export const commentApi = {
  /**
   * 获取评论列表
   */
  list: (targetType: string, targetId: string) =>
    api.get<CommentsResponse>(`/comments?target_type=${targetType}&target_id=${targetId}`),

  /**
   * 创建评论
   */
  create: (data: CreateCommentInput) =>
    api.post<{ message: string; comment: Comment }>('/comments', data),

  /**
   * 删除评论
   */
  delete: (commentId: string) =>
    api.delete<{ message: string; comment_id: string; replies_deleted: number }>(`/comments/${commentId}`)
}
