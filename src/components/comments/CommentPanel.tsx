import React, { useState, useEffect } from 'react'
import { X, MessageCircle, Loader } from 'lucide-react'
import { CommentList } from './CommentList'
import { CommentInput } from './CommentInput'
import { useCommentStore, type Comment } from '../../store/comment.store'

interface CommentPanelProps {
  projectId: string
  targetType: 'insight' | 'topic' | 'script' | 'report'
  targetId: string
  isOpen: boolean
  onToggle: () => void
}

export function CommentPanel({
  projectId,
  targetType,
  targetId,
  isOpen,
  onToggle
}: CommentPanelProps) {
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | undefined>()

  const {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    deleteComment,
    getCommentCount
  } = useCommentStore()

  const cacheKey = `${targetType}:${targetId}`
  const currentComments = comments[cacheKey] || []
  const isLoading = loading[cacheKey] || false
  const currentError = error[cacheKey] || null
  const commentCount = getCommentCount(targetType, targetId)

  // Fetch comments when panel opens
  useEffect(() => {
    if (isOpen && !currentComments.length) {
      fetchComments(targetType, targetId).catch(err => {
        console.error('Failed to fetch comments:', err)
      })
    }
  }, [isOpen, targetType, targetId])

  // Handle reply
  const handleReply = (comment: Comment) => {
    setReplyTo({ id: comment.id, name: comment.user.name })
  }

  // Handle submit comment
  const handleSubmit = async (content: string, mentions: string[]) => {
    await addComment({
      project_id: projectId,
      target_type: targetType,
      target_id: targetId,
      content,
      parent_id: replyTo?.id,
      mentions
    })
    setReplyTo(undefined)
  }

  // Handle delete comment
  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？删除后将无法恢复。')) {
      return
    }

    try {
      await deleteComment(commentId, targetType, targetId)
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert(error instanceof Error ? error.message : '删除评论失败')
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-6 bottom-6 p-4 bg-blue-600 hover:bg-blue-700 text-white
                   rounded-full shadow-lg transition-colors z-50 group"
        title="评论"
      >
        <MessageCircle size={24} />
        {commentCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs
                           rounded-full flex items-center justify-center font-medium">
            {commentCount > 99 ? '99+' : commentCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-gray-900 border-l border-gray-800
                    shadow-2xl z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-200">
            评论
            {commentCount > 0 && (
              <span className="ml-2 text-sm text-gray-500">({commentCount})</span>
            )}
          </h2>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800
                     transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-gray-500" size={32} />
            </div>
          )}

          {currentError && (
            <div className="py-8 text-center">
              <p className="text-sm text-red-400 mb-2">加载评论失败</p>
              <button
                onClick={() => fetchComments(targetType, targetId)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                重新加载
              </button>
            </div>
          )}

          {!isLoading && !currentError && (
            <CommentList
              comments={currentComments}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 px-6 py-4 bg-gray-900/50">
          <CommentInput
            projectId={projectId}
            onSubmit={handleSubmit}
            onCancel={replyTo ? () => setReplyTo(undefined) : undefined}
            replyTo={replyTo}
          />
        </div>
      </div>
    </div>
  )
}
