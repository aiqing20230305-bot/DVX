import { useState } from 'react'
import { User, Crown, Edit2, Eye, Trash2, ArrowRightLeft } from 'lucide-react'
import { ProjectMember, useMemberStore } from '../../store/member.store'
import { useAuthStore } from '../../store/auth.store'
import { toast } from '../../store/toast.store'
import { Button } from '../shared/Button'

interface MemberListProps {
  projectId: string
  members: ProjectMember[]
  currentUserRole?: 'owner' | 'editor' | 'viewer'
  onInvite: () => void
}

const roleIcons = {
  owner: <Crown size={14} style={{ color: 'var(--color-warning)' }} />,
  editor: <Edit2 size={14} style={{ color: 'var(--color-primary)' }} />,
  viewer: <Eye size={14} style={{ color: 'var(--color-text-tertiary)' }} />
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
        toast.success( '所有权转移成功')
      } else {
        // Change role
        await updateMemberRole(member.id, newRole)
        toast.success( `已将 ${member.user.name} 的角色更新为 ${roleLabels[newRole]}`)
      }
    } catch (error) {
      toast.error( error instanceof Error ? error.message : '操作失败')
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
      toast.success( isSelf ? '已退出项目' : '成员移除成功')
    } catch (error) {
      toast.error( error instanceof Error ? error.message : '操作失败')
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
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>项目成员</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
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
              className="flex items-center justify-between p-4 border rounded-lg transition-all duration-100"
              style={{
                backgroundColor: 'var(--color-bg-elevated-2)',
                borderColor: 'var(--color-border)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
              }}
            >
              {/* User Info */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #3B82F6 100%)'
                }}>
                  {member.user.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={member.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} style={{ color: 'white' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {member.user.name}
                      {isSelf && <span className="ml-1" style={{ color: 'var(--color-text-tertiary)' }}>(您)</span>}
                    </p>
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{member.user.email}</p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2 mr-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md" style={{
                  backgroundColor: 'var(--color-bg-elevated-1)',
                  borderColor: 'var(--color-border)'
                }}>
                  {roleIcons[member.role]}
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
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
                    className="px-2 py-1 text-xs border rounded transition-all duration-100 focus:outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated-1)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
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
                    className="p-2 rounded transition-all duration-100 disabled:opacity-50"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-danger)';
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-tertiary)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
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
        <div className="text-center py-12" style={{ color: 'var(--color-text-tertiary)' }}>
          <User size={48} className="mx-auto mb-4" style={{ opacity: 0.5 }} />
          <p>暂无成员</p>
        </div>
      )}
    </div>
  )
}
