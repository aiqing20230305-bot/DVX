import { useEffect, useState } from 'react'
import { Settings, Users, ArrowLeft, GitBranch, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/project.store'
import { useMemberStore } from '../store/member.store'
import { useAuthStore } from '../store/auth.store'
import { useApprovalStore } from '../store/approval.store'
import MemberList from '../components/members/MemberList'
import InviteMemberModal from '../components/members/InviteMemberModal'
import { WorkflowList, WorkflowForm } from '../components/approval'
import { ApprovalWorkflow } from '../api/approval.api'
import Button from '../components/shared/Button'

export default function ProjectSettings() {
  const navigate = useNavigate()
  const { activeProjectId, projects } = useProjectStore()
  const { user: currentUser } = useAuthStore()
  const { members, loading, fetchMembers, clearMembers } = useMemberStore()
  const {
    workflows,
    workflowsLoading,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  } = useApprovalStore()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [workflowFormOpen, setWorkflowFormOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | undefined>()

  const activeProject = projects.find(p => p.id === activeProjectId)

  // Get current user's role in this project
  const currentUserMember = members.find(m => m.user_id === currentUser?.id)
  const currentUserRole = currentUserMember?.role
  const token = localStorage.getItem('token') || ''

  useEffect(() => {
    if (activeProjectId && token) {
      fetchMembers(activeProjectId)
      fetchWorkflows(activeProjectId, undefined, token)
    }

    return () => {
      clearMembers()
    }
  }, [activeProjectId, token])

  const handleCreateWorkflow = async (data: any) => {
    try {
      await createWorkflow(data, token)
      setWorkflowFormOpen(false)
    } catch (error) {
      console.error('Failed to create workflow:', error)
    }
  }

  const handleUpdateWorkflow = async (data: any) => {
    if (!editingWorkflow) return
    try {
      await updateWorkflow(editingWorkflow.id, data, token)
      setWorkflowFormOpen(false)
      setEditingWorkflow(undefined)
    } catch (error) {
      console.error('Failed to update workflow:', error)
    }
  }

  const handleEditWorkflow = (workflow: ApprovalWorkflow) => {
    setEditingWorkflow(workflow)
    setWorkflowFormOpen(true)
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await deleteWorkflow(workflowId, token)
    } catch (error) {
      console.error('Failed to delete workflow:', error)
    }
  }

  if (!activeProjectId || !activeProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Settings size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">请先选择一个项目</p>
          <Button
            variant="outline"
            onClick={() => navigate('/projects')}
            className="mt-4"
          >
            返回项目列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-[#1A1A1A] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-primary" />
                <h1 className="text-xl font-bold text-white">项目设置</h1>
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                {activeProject.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Project Info Section */}
          <section className="bg-[rgba(255,255,255,0.03)] border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">项目信息</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">项目名称</p>
                <p className="text-white mt-1">{activeProject.name}</p>
              </div>
              <div>
                <p className="text-gray-400">状态</p>
                <p className="text-white mt-1">
                  {activeProject.status === 'active' ? '进行中' : '已归档'}
                </p>
              </div>
              {activeProject.brand && (
                <div>
                  <p className="text-gray-400">品牌</p>
                  <p className="text-white mt-1">{activeProject.brand}</p>
                </div>
              )}
              {activeProject.category && (
                <div>
                  <p className="text-gray-400">品类</p>
                  <p className="text-white mt-1">{activeProject.category}</p>
                </div>
              )}
              {activeProject.description && (
                <div className="col-span-2">
                  <p className="text-gray-400">描述</p>
                  <p className="text-white mt-1">{activeProject.description}</p>
                </div>
              )}
            </div>
          </section>

          {/* Members Section */}
          <section className="bg-[rgba(255,255,255,0.03)] border border-gray-700 rounded-lg p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 mt-2">加载中...</p>
              </div>
            ) : (
              <MemberList
                projectId={activeProjectId}
                members={members}
                currentUserRole={currentUserRole}
                onInvite={() => setInviteModalOpen(true)}
              />
            )}
          </section>

          {/* Approval Workflows Section */}
          {currentUserRole === 'owner' && (
            <section className="bg-[rgba(255,255,255,0.03)] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <GitBranch size={20} className="text-blue-500" />
                  <h2 className="text-lg font-semibold text-white">审批流程</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingWorkflow(undefined)
                    setWorkflowFormOpen(true)
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>创建流程</span>
                </Button>
              </div>

              <WorkflowList
                workflows={workflows}
                loading={workflowsLoading}
                onEdit={handleEditWorkflow}
                onDelete={handleDeleteWorkflow}
              />
            </section>
          )}

          {/* Role Description Section */}
          <section className="bg-[rgba(255,255,255,0.03)] border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">角色权限说明</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <h3 className="text-sm font-medium text-white">所有者 (Owner)</h3>
                </div>
                <ul className="text-xs text-gray-400 space-y-1 ml-4 list-disc list-inside">
                  <li>完全控制项目的所有权限</li>
                  <li>可以添加、移除成员和修改成员角色</li>
                  <li>可以修改项目设置</li>
                  <li>可以删除项目</li>
                  <li>可以转移项目所有权</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <h3 className="text-sm font-medium text-white">编辑者 (Editor)</h3>
                </div>
                <ul className="text-xs text-gray-400 space-y-1 ml-4 list-disc list-inside">
                  <li>可以上传和解析文件</li>
                  <li>可以生成洞察、选题和脚本</li>
                  <li>可以修改和删除内容</li>
                  <li>可以管理知识库</li>
                  <li>可以邀请其他成员（仅限 viewer 角色）</li>
                  <li>无法修改项目设置和成员角色</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <h3 className="text-sm font-medium text-white">查看者 (Viewer)</h3>
                </div>
                <ul className="text-xs text-gray-400 space-y-1 ml-4 list-disc list-inside">
                  <li>可以查看项目所有内容</li>
                  <li>可以查看洞察、选题和脚本</li>
                  <li>可以导出报告</li>
                  <li>无法修改、删除或生成内容</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Workflow Form */}
      {workflowFormOpen && (
        <WorkflowForm
          workflow={editingWorkflow}
          projectId={activeProjectId}
          projectMembers={members.map(m => ({
            id: m.user_id,
            name: m.name,
            email: m.email
          }))}
          onSubmit={editingWorkflow ? handleUpdateWorkflow : handleCreateWorkflow}
          onCancel={() => {
            setWorkflowFormOpen(false)
            setEditingWorkflow(undefined)
          }}
          loading={workflowsLoading}
        />
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        projectId={activeProjectId}
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  )
}
