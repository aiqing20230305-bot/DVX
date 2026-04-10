import React from 'react'
import { ApprovalWorkflow } from '../../api/approval.api'
import { Settings, Trash2, Users, CheckCircle } from 'lucide-react'

interface WorkflowListProps {
  workflows: ApprovalWorkflow[]
  loading?: boolean
  onEdit?: (workflow: ApprovalWorkflow) => void
  onDelete?: (workflowId: string) => void
}

const WorkflowList: React.FC<WorkflowListProps> = ({
  workflows,
  loading = false,
  onEdit,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-800/50 rounded-lg h-24"
          />
        ))}
      </div>
    )
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Settings size={48} className="mx-auto mb-4 opacity-50" />
        <p>暂无审批流程</p>
        <p className="text-sm mt-2">创建审批流程来管理内容审核</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <div
          key={workflow.id}
          className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-medium text-gray-100">
                  {workflow.name}
                </h3>
                <span
                  className={`
                    px-2 py-0.5 text-xs rounded-full
                    ${
                      workflow.status === 'active'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-gray-500/10 text-gray-500'
                    }
                  `}
                >
                  {workflow.status === 'active' ? '启用中' : '已停用'}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500">
                  {workflow.target_type === 'topic'
                    ? '选题'
                    : workflow.target_type === 'script'
                    ? '脚本'
                    : '报告'}
                </span>
              </div>

              {workflow.description && (
                <p className="text-sm text-gray-400 mb-3">
                  {workflow.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Users size={14} />
                  <span>{workflow.steps.length} 个审批步骤</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  <span>
                    共 {workflow.steps.reduce((sum, s) => sum + s.reviewers.length, 0)} 位审批人
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {workflow.steps.map((step) => (
                  <div
                    key={step.step}
                    className="text-xs px-2 py-1 bg-gray-700/50 rounded border border-gray-600/50"
                  >
                    <span className="text-gray-400">步骤{step.step}:</span>{' '}
                    <span className="text-gray-300">
                      {step.reviewers.length}人{' '}
                      {step.rule === 'any' ? '(任一通过)' : '(全部通过)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {onEdit && (
                <button
                  onClick={() => onEdit(workflow)}
                  className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-700/50 rounded transition-colors"
                  title="编辑"
                >
                  <Settings size={18} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`确定要删除审批流程"${workflow.name}"吗？`)) {
                      onDelete(workflow.id)
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="删除"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default WorkflowList
