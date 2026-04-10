import { useState } from 'react'
import { X, Mail, UserPlus, Info } from 'lucide-react'
import { Button } from '../shared/Button'
import { useMemberStore } from '../../store/member.store'
import { toast } from '../../store/toast.store'

interface InviteMemberModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export default function InviteMemberModal({ projectId, isOpen, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer')
  const [loading, setLoading] = useState(false)
  const { inviteMember } = useMemberStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('请输入邮箱地址')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('请输入有效的邮箱地址')
      return
    }

    try {
      setLoading(true)
      await inviteMember(projectId, email.trim(), role)
      toast.success(`邀请已发送给 ${email}`)
      setEmail('')
      setRole('viewer')
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '邀请失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div className="border rounded-lg shadow-xl w-full max-w-md mx-4" style={{
        backgroundColor: 'var(--color-bg-elevated-2)',
        borderColor: 'var(--color-border)'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{
          borderColor: 'var(--color-border)'
        }}>
          <div className="flex items-center gap-2">
            <UserPlus size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>邀请成员</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition-colors duration-100"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-tertiary)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              邮箱地址
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-10 pr-3 py-2 bg-[rgba(255,255,255,0.05)] border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              邀请该邮箱的用户加入项目
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              角色权限
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loading}
            >
              <option value="viewer">查看者 - 仅查看项目内容</option>
              <option value="editor">编辑者 - 可编辑项目内容</option>
            </select>
          </div>

          {/* Role Description */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3">
            <div className="flex gap-2">
              <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                {role === 'viewer' ? (
                  <>
                    <p className="font-medium mb-1">查看者权限：</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      <li>查看项目所有内容</li>
                      <li>查看洞察、选题和脚本</li>
                      <li>导出报告</li>
                      <li>无法修改或删除内容</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-medium mb-1">编辑者权限：</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      <li>查看者的所有权限</li>
                      <li>上传和解析文件</li>
                      <li>生成洞察、选题和脚本</li>
                      <li>修改和删除内容</li>
                      <li>管理知识库</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={!email.trim() || loading}
              className="flex-1"
            >
              发送邀请
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
