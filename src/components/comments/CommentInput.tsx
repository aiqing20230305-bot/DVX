import React, { useState, useRef, useEffect } from 'react'
import { Send, X } from 'lucide-react'
import { useMemberStore, type ProjectMember } from '../../store/member.store'

interface CommentInputProps {
  projectId: string
  onSubmit: (content: string, mentions: string[]) => Promise<void>
  onCancel?: () => void
  replyTo?: { id: string; name: string }
  placeholder?: string
}

export function CommentInput({
  projectId,
  onSubmit,
  onCancel,
  replyTo,
  placeholder = '写下你的评论...'
}: CommentInputProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { members, fetchMembers } = useMemberStore()

  // Fetch project members on mount
  useEffect(() => {
    fetchMembers(projectId).catch(err => {
      console.error('Failed to fetch members:', err)
    })
  }, [projectId])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  // Handle content change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart
    setContent(value)
    setCursorPosition(position)

    // Check for @ mention trigger
    const textBeforeCursor = value.slice(0, position)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1 && lastAtIndex === position - 1) {
      // Just typed @
      setShowMentions(true)
      setMentionSearch('')
    } else if (lastAtIndex !== -1) {
      // After @, check if we're still in mention mode
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      if (/^\w*$/.test(textAfterAt)) {
        setShowMentions(true)
        setMentionSearch(textAfterAt)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Handle mention selection
  const handleSelectMention = (member: ProjectMember) => {
    const textBeforeCursor = content.slice(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const before = content.slice(0, lastAtIndex)
      const after = content.slice(cursorPosition)
      const newContent = `${before}@${member.user.name} ${after}`

      setContent(newContent)
      setMentionedUsers(prev => [...new Set([...prev, member.user_id])])
      setShowMentions(false)

      // Focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus()
        const newPosition = lastAtIndex + member.user.name.length + 2
        textareaRef.current?.setSelectionRange(newPosition, newPosition)
      }, 0)
    }
  }

  // Filter members for mention dropdown
  const filteredMembers = members.filter(member =>
    member.user.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.user.email.toLowerCase().includes(mentionSearch.toLowerCase())
  )

  // Handle submit
  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || submitting) return

    if (trimmed.length > 1000) {
      alert('评论内容不能超过1000字符')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(trimmed, mentionedUsers)
      setContent('')
      setMentionedUsers([])
    } catch (error) {
      console.error('Submit comment error:', error)
      alert(error instanceof Error ? error.message : '发送评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit with Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }

    // Close mention dropdown with Escape
    if (e.key === 'Escape' && showMentions) {
      e.preventDefault()
      setShowMentions(false)
    }
  }

  return (
    <div className="relative">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 bg-gray-800/50 rounded-lg">
          <span className="text-sm text-gray-400">
            回复 <span className="text-gray-200 font-medium">@{replyTo.name}</span>
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700 rounded-lg
                     text-sm text-gray-200 placeholder-gray-500 resize-none min-h-[80px] max-h-[200px]
                     focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
                     transition-colors"
          rows={3}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="absolute right-3 bottom-3 p-2 rounded-lg bg-blue-600 text-white
                     hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
          title="发送 (Cmd+Enter)"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Mention dropdown */}
      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700
                        rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
          {filteredMembers.map(member => (
            <button
              key={member.id}
              onClick={() => handleSelectMention(member)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/50
                         transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
                              flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {member.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 font-medium truncate">
                  {member.user.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {member.user.email}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {member.role === 'owner' && '所有者'}
                {member.role === 'editor' && '编辑'}
                {member.role === 'viewer' && '查看'}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>提示：输入 @ 提及成员，Cmd+Enter 发送</span>
        <span className={content.length > 900 ? 'text-yellow-500' : ''}>
          {content.length} / 1000
        </span>
      </div>
    </div>
  )
}
