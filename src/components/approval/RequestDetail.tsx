import React, { useEffect, useState } from 'react'
import { X, User, Clock, MessageCircle, CheckCircle, XCircle } from 'lucide-react'
import { ApprovalRequestWithDetails, ApprovalReviewWithReviewer } from '../../api/approval.api'
import { useApprovalStore } from '../../store/approval.store'
import ApprovalBadge from './ApprovalBadge'
import ReviewForm from './ReviewForm'

interface RequestDetailProps {
  request: ApprovalRequestWithDetails
  currentUserId: string
  token: string
  onClose: () => void
  onCancel?: () => void
}

const RequestDetail: React.FC<RequestDetailProps> = ({
  request,
  currentUserId,
  token,
  onClose,
  onCancel
}) => {
  const { fetchReviews, reviews, reviewsLoading } = useApprovalStore()
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    fetchReviews(request.id, token)
  }, [request.id, token])

  const requestReviews = reviews[request.id] || []

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 判断当前用户是否可以审批
  const currentStepConfig = request.workflow.steps.find(
    (s) => s.step === request.current_step
  )
  const canReview =
    request.status === 'pending' &&
    currentStepConfig?.reviewers.includes(currentUserId) &&
    !requestReviews.some(
      (r) => r.step === request.current_step && r.reviewer_id === currentUserId
    )

  // 判断当前用户是否可以撤销
  const canCancel =
    request.status === 'pending' &&
    (request.requester_id === currentUserId || onCancel)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">
              审批详情
            </h2>
            <div className="flex items-center gap-2">
              <ApprovalBadge status={request.status} />
              <span className="text-sm text-gray-400">
                {request.workflow.name}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基本信息 */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <h3 className="text-sm font-medium text-gray-300 mb-3">基本信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <User size={14} />
                <span>提交人:</span>
                <span className="text-gray-200">{request.requester.name}</span>
                <span className="text-gray-500">({request.requester.email})</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={14} />
                <span>提交时间:</span>
                <span className="text-gray-200">{formatTime(request.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span>审批对象:</span>
                <span className="px-2 py-0.5 text-xs rounded bg-blue-500/10 text-blue-400">
                  {request.target_type === 'topic'
                    ? '选题'
                    : request.target_type === 'script'
                    ? '脚本'
                    : '报告'}
                </span>
                <span className="text-gray-500">(ID: {request.target_id})</span>
              </div>
            </div>
          </div>

          {/* 审批流程 */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">审批流程</h3>
            <div className="space-y-3">
              {request.workflow.steps.map((step) => {
                const stepReviews = requestReviews.filter((r) => r.step === step.step)
                const isCurrentStep = step.step === request.current_step
                const isPastStep = step.step < request.current_step
                const isFutureStep = step.step > request.current_step

                return (
                  <div
                    key={step.step}
                    className={`
                      bg-gray-800/50 rounded-lg p-4 border
                      ${
                        isCurrentStep
                          ? 'border-blue-500/50'
                          : isPastStep
                          ? 'border-green-500/50'
                          : 'border-gray-700/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-300">
                        步骤 {step.step}
                      </span>
                      {isPastStep && (
                        <span className="text-xs text-green-400">✓ 已完成</span>
                      )}
                      {isCurrentStep && (
                        <span className="text-xs text-blue-400">● 进行中</span>
                      )}
                      {isFutureStep && (
                        <span className="text-xs text-gray-500">○ 待审批</span>
                      )}
                      <span className="text-xs text-gray-500">
                        ({step.rule === 'any' ? '任一通过' : '全部通过'})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {stepReviews.length > 0 ? (
                        stepReviews.map((review) => (
                          <div
                            key={review.id}
                            className="flex items-start gap-3 p-3 bg-gray-700/30 rounded"
                          >
                            {review.status === 'approved' ? (
                              <CheckCircle size={16} className="text-green-400 mt-0.5" />
                            ) : (
                              <XCircle size={16} className="text-red-400 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-gray-300">
                                  {review.reviewer.name}
                                </span>
                                <span
                                  className={`
                                    text-xs
                                    ${
                                      review.status === 'approved'
                                        ? 'text-green-400'
                                        : 'text-red-400'
                                    }
                                  `}
                                >
                                  {review.status === 'approved' ? '通过' : '拒绝'}
                                </span>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-gray-400">{review.comment}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTime(review.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">
                          等待审批人: {step.reviewers.length} 人
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
          {canCancel && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            >
              撤销请求
            </button>
          )}
          {canReview && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              提交审批
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-100 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          requestId={request.id}
          token={token}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false)
            fetchReviews(request.id, token)
          }}
        />
      )}
    </div>
  )
}

export default RequestDetail
