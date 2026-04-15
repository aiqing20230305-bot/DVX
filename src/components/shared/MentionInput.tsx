import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import { User } from '../../types'

interface MentionInputProps {
  value: string
  onChange: (value: string, mentions: string[]) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  projectId: string
  className?: string
}

interface ProjectMember {
  id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  user: {
    id: string
    email: string
    name: string
    avatar?: string
  }
}

interface MembersResponse {
  projectId: string
  members: ProjectMember[]
  total: number
}

export function MentionInput({
  value,
  onChange,
  placeholder = '输入评论...',
  maxLength = 1000,
  disabled = false,
  projectId,
  className = ''
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [filteredMembers, setFilteredMembers] = useState<ProjectMember[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 从value中提取@提及的用户ID
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1]
      // 根据username查找user_id
      const member = members.find(m =>
        m.user.name.toLowerCase().replace(/\s+/g, '') === username.toLowerCase() ||
        m.user.email.split('@')[0] === username
      )
      if (member) {
        mentions.push(member.user_id)
      }
    }

    return [...new Set(mentions)] // 去重
  }

  // 加载项目成员
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`http://localhost:3001/api/project/${projectId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data: MembersResponse = await response.json()
          setMembers(data.members)
        }
      } catch (error) {
        console.error('Failed to fetch project members:', error)
      }
    }

    if (projectId) {
      fetchMembers()
    }
  }, [projectId])

  // 处理输入变化
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart

    // 检查是否输入了@符号
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)

      // 如果@后面没有空格，显示下拉框
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setSearchQuery(textAfterAt)
        setMentionStartPos(lastAtIndex)

        // 过滤成员
        const filtered = members.filter(member =>
          member.user.name.toLowerCase().includes(textAfterAt.toLowerCase()) ||
          member.user.email.toLowerCase().includes(textAfterAt.toLowerCase())
        )
        setFilteredMembers(filtered)
        setSelectedIndex(0)
        setShowDropdown(filtered.length > 0)

        // 计算下拉框位置
        if (textareaRef.current) {
          const { top, left } = getCaretCoordinates(textareaRef.current, cursorPos)
          setDropdownPosition({ top, left })
        }
      } else {
        setShowDropdown(false)
      }
    } else {
      setShowDropdown(false)
    }

    // 提取mentions并回调
    const mentions = extractMentions(newValue)
    onChange(newValue, mentions)
  }

  // 获取光标位置（用于定位下拉框）
  const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div')
    const style = getComputedStyle(element)

    // 复制textarea样式
    div.style.position = 'absolute'
    div.style.visibility = 'hidden'
    div.style.whiteSpace = 'pre-wrap'
    div.style.wordWrap = 'break-word'
    div.style.font = style.font
    div.style.padding = style.padding
    div.style.border = style.border
    div.style.width = style.width

    div.textContent = element.value.substring(0, position)

    const span = document.createElement('span')
    span.textContent = element.value.substring(position) || '.'
    div.appendChild(span)

    document.body.appendChild(div)

    const rect = element.getBoundingClientRect()
    const coordinates = {
      top: rect.top + span.offsetTop + 20, // 20px下方
      left: rect.left + span.offsetLeft
    }

    document.body.removeChild(div)

    return coordinates
  }

  // 插入@提及
  const insertMention = (member: ProjectMember) => {
    if (mentionStartPos === null || !textareaRef.current) return

    const username = member.user.name.replace(/\s+/g, '') // 移除空格
    const beforeMention = value.slice(0, mentionStartPos)
    const afterMention = value.slice(textareaRef.current.selectionStart)
    const newValue = `${beforeMention}@${username} ${afterMention}`

    const mentions = extractMentions(newValue)
    onChange(newValue, [...mentions, member.user_id]) // 确保新提及的用户被包含

    setShowDropdown(false)
    setMentionStartPos(null)

    // 设置光标位置到@username后面
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartPos + username.length + 2 // @username + 空格
        textareaRef.current.selectionStart = newCursorPos
        textareaRef.current.selectionEnd = newCursorPos
        textareaRef.current.focus()
      }
    }, 0)
  }

  // 处理键盘导航
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown || filteredMembers.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredMembers.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length)
        break
      case 'Enter':
        if (showDropdown) {
          e.preventDefault()
          insertMention(filteredMembers[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowDropdown(false)
        break
    }
  }

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 滚动选中项到可见区域
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const selectedItem = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, showDropdown])

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-[#1F1F1F] border border-[#2A2A2A] rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#5E6AD2] transition-colors resize-none ${className}`}
        rows={3}
      />

      {/* 下拉菜单 */}
      {showDropdown && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed z-50 bg-[#1F1F1F] border border-[#2A2A2A] rounded-md shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            minWidth: '200px'
          }}
        >
          {filteredMembers.map((member, index) => (
            <div
              key={member.id}
              data-index={index}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-[#5E6AD2] text-white'
                  : 'text-gray-300 hover:bg-[#2A2A2A]'
              }`}
              onClick={() => insertMention(member)}
            >
              <div className="flex items-center gap-3">
                {/* 头像 */}
                {member.user.avatar ? (
                  <img
                    src={member.user.avatar}
                    alt={member.user.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* 用户信息 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{member.user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{member.user.email}</div>
                </div>

                {/* 角色标签 */}
                <div className={`text-xs px-2 py-0.5 rounded ${
                  member.role === 'owner'
                    ? 'bg-purple-500/20 text-purple-400'
                    : member.role === 'editor'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {member.role === 'owner' ? '所有者' : member.role === 'editor' ? '编辑' : '查看'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
