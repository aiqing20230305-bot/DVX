import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Users } from 'lucide-react'
import {
  ApprovalWorkflow,
  ApprovalWorkflowStep,
  CreateWorkflowInput
} from '../../api/approval.api'

interface WorkflowFormProps {
  workflow?: ApprovalWorkflow
  projectId: string
  projectMembers: Array<{ id: string; name: string; email: string }>
  onSubmit: (data: CreateWorkflowInput | { name?: string; description?: string; steps?: ApprovalWorkflowStep[]; status?: 'active' | 'inactive' }) => void
  onCancel: () => void
  loading?: boolean
}

const WorkflowForm: React.FC<WorkflowFormProps> = ({
  workflow,
  projectId,
  projectMembers,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [name, setName] = useState(workflow?.name || '')
  const [description, setDescription] = useState(workflow?.description || '')
  const [targetType, setTargetType] = useState<'topic' | 'script' | 'report'>(
    workflow?.target_type || 'topic'
  )
  const [steps, setSteps] = useState<ApprovalWorkflowStep[]>(
    workflow?.steps || [{ step: 1, reviewers: [], rule: 'any' }]
  )

  const addStep = () => {
    setSteps([...steps, { step: steps.length + 1, reviewers: [], rule: 'any' }])
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    // 重新编号
    setSteps(newSteps.map((s, i) => ({ ...s, step: i + 1 })))
  }

  const updateStep = (index: number, updates: Partial<ApprovalWorkflowStep>) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...updates } : s)))
  }

  const toggleReviewer = (stepIndex: number, userId: string) => {
    const step = steps[stepIndex]
    const reviewers = step.reviewers.includes(userId)
      ? step.reviewers.filter((id) => id !== userId)
      : [...step.reviewers, userId]
    updateStep(stepIndex, { reviewers })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('请输入流程名称')
      return
    }

    if (steps.some((s) => s.reviewers.length === 0)) {
      alert('每个步骤至少需要一位审批人')
      return
    }

    if (workflow) {
      // 编辑模式
      onSubmit({ name, description, steps })
    } else {
      // 创建模式
      onSubmit({
        project_id: projectId,
        name,
        description,
        target_type: targetType,
        steps
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-gray-100">
            {workflow ? '编辑审批流程' : '创建审批流程'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                流程名称 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
                placeholder="例如：选题两级审批"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                流程描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
                placeholder="简要说明此审批流程的用途"
                disabled={loading}
              />
            </div>

            {!workflow && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  适用对象 *
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="topic">选题</option>
                  <option value="script">脚本</option>
                  <option value="report">报告</option>
                </select>
              </div>
            )}
          </div>

          {/* 审批步骤 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-300">
                审批步骤 *
              </label>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                disabled={loading}
              >
                <Plus size={16} />
                <span>添加步骤</span>
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-200">
                      步骤 {step.step}
                    </h4>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        disabled={loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* 审批规则 */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-2">
                      审批规则
                    </label>
                    <select
                      value={step.rule}
                      onChange={(e) =>
                        updateStep(index, { rule: e.target.value as 'any' | 'all' })
                      }
                      className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded text-gray-100 focus:outline-none focus:border-blue-500"
                      disabled={loading}
                    >
                      <option value="any">任一审批人通过即可</option>
                      <option value="all">所有审批人都通过</option>
                    </select>
                  </div>

                  {/* 审批人选择 */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">
                      审批人 ({step.reviewers.length} 人已选)
                    </label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {projectMembers.map((member) => (
                        <label
                          key={member.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700/50 rounded cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={step.reviewers.includes(member.id)}
                            onChange={() => toggleReviewer(index, member.id)}
                            className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                            disabled={loading}
                          />
                          <span className="text-sm text-gray-300">{member.name}</span>
                          <span className="text-xs text-gray-500">
                            {member.email}
                          </span>
                        </label>
                      ))}
                    </div>
                    {step.reviewers.length === 0 && (
                      <p className="text-xs text-red-400 mt-1">
                        至少选择一位审批人
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-gray-100 transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? '保存中...' : workflow ? '保存修改' : '创建流程'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WorkflowForm
