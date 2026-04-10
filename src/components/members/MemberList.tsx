import { useState } from 'react'
import { User, Crown, Edit2, Eye, Trash2, ArrowRightLeft } from 'lucide-react'
import { ProjectMember, useMemberStore } from '../../store/member.store'
import { useAuthStore } from '../../store/auth.store'
import { useToast } from '../../hooks/useToast'
import Button from '../shared/Button'

interface MemberListProps {
  projectId: string
  members: ProjectMember[]
  currentUserRole?: 'owner' | 'editor' | 'viewer'
  onInvite: () => void
}

const roleIcons = {
  owner: <Crown size={14} className="text-yellow-500" />,
  editor: <Edit2 size={14} className="text-blue-500" />,
  viewer: <Eye size={14} className="text-gray-500" />
}

const roleLabels = {
  owner: '所有者',
  editor: '编辑者',
  viewer: '查看者'
}

const roleDescriptions = {
  owner: '完全控制权限',
  editor: '可编辑内容',
  viewer: '仅查看'
}

export default function MemberList({ projectId, members, currentUserRole, onInvite }: MemberListProps) {
  const { user: currentUser } = useAuthStore()
  const { updateMemberRole, removeMember, transferOwnership } = useMemberStore()
  const { showToast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleRoleChange = async (member: ProjectMember, newRole: 'owner' | 'editor' | 'viewer') => {
    if (member.role === newRole) return

    try {
      setActionLoading(member.id)

      if (newRole === 'owner') {
        // Transfer ownership
        if (!confirm(`确定要将项目所有权转移给 ${member.user.name} (${member.user.email}) 吗？\n\n转移后，您的角色将变更为编辑者。`)) {
          setActionLoading(null)
          return
        }
        await transferOwnership(projectId, member.user_id)
        showToast('success', '所有权转移成功')
      } else {
        // Change role
        await updateMemberRole(member.id, newRole)
        showToast('success', `已将 ${member.user.name} 的角色更新为 ${roleLabels[newRole]}`)
      }
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (member: ProjectMember) => {
    const isSelf = member.user_id === currentUser?.id

    if (!confirm(
      isSelf
        ? `确定要退出此项目吗？\n\n退出后，您将无法访问项目内容。`
        : `确定要移除成员 ${member.user.name} (${member.user.email}) 吗？\n\n移除后，该成员将无法访问项目。`
    )) {
      return
    }

    try {
      setActionLoading(member.id)
      await removeMember(member.id)
      showToast('success', isSelf ? '已退出项目' : '成员移除成功')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const canModifyMember = (member: ProjectMember): boolean => {
    if (!currentUserRole) return false
    if (currentUserRole === 'viewer') return false
    if (member.role === 'owner') return currentUserRole === 'owner' && member.user_id !== currentUser?.id
    return currentUserRole === 'owner'
  }

  const canRemoveMember = (member: ProjectMember): boolean => {
    if (!currentUserRole) return false
    // Owner can remove others (except if target is owner)
    if (currentUserRole === 'owner') {
      return member.role !== 'owner' || member.user_id === currentUser?.id
    }
    // Members can remove themselves
    return member.user_id === currentUser?.id
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">项目成员</h3>
          <p className="text-sm text-gray-400 mt-1">
            共 {members.length} 名成员
          </p>
        </div>
        {currentUserRole && (currentUserRole === 'owner' || currentUserRole === 'editor') && (
          <Button
            size="sm"
            variant="primary"
            onClick={onInvite}
          >
            邀请成员
          </Button>
        )}
      </div>

      {/* Member List */}
      <div className="space-y-2">
        {members.map(member => {
          const isSelf = member.user_id === currentUser?.id
          const isLoading = actionLoading === member.id

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.05)] border border-gray-700 rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors"
            >
              {/* User Info */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  {member.user.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={member.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {member.user.name}
                      {isSelf && <span className="text-gray-400 ml-1">(您)</span>}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2 mr-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-gray-600 rounded-md">
                  {roleIcons[member.role]}
                  <span className="text-xs font-medium text-gray-300">
                    {roleLabels[member.role]}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Role Change Dropdown */}
                {canModifyMember(member) && (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member, e.target.value as 'owner' | 'editor' | 'viewer')}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs bg-[rgba(255,255,255,0.05)] border border-gray-600 rounded text-gray-300 hover:bg-[rgba(255,255,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="viewer">查看者</option>
                    <option value="editor">编辑者</option>
                    <option value="owner">所有者</option>
                  </select>
                )}

                {/* Remove Button */}
                {canRemoveMember(member) && (
                  <button
                    onClick={() => handleRemoveMember(member)}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                    title={isSelf ? '退出项目' : '移除成员'}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {members.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <User size={48} className="mx-auto mb-4 opacity-50" />
          <p>暂无成员</p>
        </div>
      )}
    </div>
  )
}
