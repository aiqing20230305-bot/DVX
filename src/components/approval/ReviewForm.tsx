import React, { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { useApprovalStore } from '../../store/approval.store'

interface ReviewFormProps {
  requestId: string
  token: string
  onClose: () => void
  onSuccess?: () => void
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  requestId,
  token,
  onClose,
  onSuccess
}) => {
  const { submitReview, reviewsLoading } = useApprovalStore()
  const [status, setStatus] = useState<'approved' | 'rejected'>('approved')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loading = reviewsLoading[requestId] || false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await submitReview(requestId, { status, comment: comment.trim() || undefined }, token)
      onSuccess?.()
    } catch (error: any) {
      setError(error.response?.data?.message || '提交审批意见失败')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 rounded-lg max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-gray-100">提交审批意见</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 审批决定 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              审批决定 *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('approved')}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors
                  ${
                    status === 'approved'
                      ? 'bg-green-500/10 border-green-500 text-green-400'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  }
                `}
                disabled={loading}
              >
                <CheckCircle size={20} />
                <span className="font-medium">通过</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors
                  ${
                    status === 'rejected'
                      ? 'bg-red-500/10 border-red-500 text-red-400'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  }
                `}
                disabled={loading}
              >
                <XCircle size={20} />
                <span className="font-medium">拒绝</span>
              </button>
            </div>
          </div>

          {/* 审批意见 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              审批意见 {status === 'rejected' && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
              rows={4}
              placeholder={
                status === 'approved'
                  ? '可选：说明通过的理由或补充建议...'
                  : '请说明拒绝的原因，以便提交人改进...'
              }
              disabled={loading}
            />
            {status === 'rejected' && !comment.trim() && (
              <p className="text-xs text-red-400 mt-1">拒绝时必须填写审批意见</p>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-100 transition-colors"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className={`
                px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  status === 'approved'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }
              `}
              disabled={loading || (status === 'rejected' && !comment.trim())}
            >
              {loading ? '提交中...' : status === 'approved' ? '确认通过' : '确认拒绝'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReviewForm
