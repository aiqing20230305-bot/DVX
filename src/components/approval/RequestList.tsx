import React from 'react'
import { ApprovalRequestWithDetails } from '../../api/approval.api'
import ApprovalBadge from './ApprovalBadge'
import { Clock, User, FileText } from 'lucide-react'

interface RequestListProps {
  requests: ApprovalRequestWithDetails[]
  loading?: boolean
  onRequestClick?: (request: ApprovalRequestWithDetails) => void
}

const RequestList: React.FC<RequestListProps> = ({
  requests,
  loading = false,
  onRequestClick
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-800/50 rounded-lg h-32"
          />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText size={48} className="mx-auto mb-4 opacity-50" />
        <p>暂无审批请求</p>
      </div>
    )
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          onClick={() => onRequestClick?.(request)}
          className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-medium text-gray-100">
                  {request.workflow.name}
                </h3>
                <ApprovalBadge status={request.status} size="sm" />
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <User size={14} />
                  <span>{request.requester.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{formatTime(request.created_at)}</span>
                </div>
                <span className="px-2 py-0.5 text-xs rounded bg-blue-500/10 text-blue-400">
                  {request.target_type === 'topic'
                    ? '选题'
                    : request.target_type === 'script'
                    ? '脚本'
                    : '报告'}
                </span>
              </div>
            </div>
          </div>

          {/* 审批进度 */}
          <div className="flex items-center gap-2">
            {request.workflow.steps.map((step) => (
              <div
                key={step.step}
                className={`
                  flex-1 h-2 rounded-full
                  ${
                    step.step < request.current_step
                      ? 'bg-green-500'
                      : step.step === request.current_step
                      ? 'bg-blue-500'
                      : 'bg-gray-700'
                  }
                `}
                title={`步骤${step.step}: ${
                  step.step < request.current_step
                    ? '已完成'
                    : step.step === request.current_step
                    ? '进行中'
                    : '待审批'
                }`}
              />
            ))}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {request.status === 'pending' && (
              <span>
                当前步骤: {request.current_step}/{request.workflow.steps.length}
              </span>
            )}
            {request.status === 'approved' && (
              <span className="text-green-400">✓ 审批已通过</span>
            )}
            {request.status === 'rejected' && (
              <span className="text-red-400">✗ 审批已拒绝</span>
            )}
            {request.status === 'cancelled' && (
              <span className="text-gray-400">已撤销</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RequestList
