import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, Clock, CheckCircle, Settings } from 'lucide-react'
import { useProjectStore } from '../store/project.store'
import { useAuthStore } from '../store/auth.store'
import { useApprovalStore } from '../store/approval.store'
import { ApprovalRequestWithDetails } from '../api/approval.api'
import { RequestList, RequestDetail } from '../components/approval'
import { Button } from '../components/shared/Button'

export default function Approvals() {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()
  const { user: currentUser } = useAuthStore()
  const {
    requests,
    requestsLoading,
    pendingRequests,
    pendingLoading,
    fetchRequests,
    fetchPendingRequests,
    cancelRequest
  } = useApprovalStore()
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'my_pending'>(
    'all'
  )
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestWithDetails | null>(null)
  const [token, setToken] = useState<string>('')

  // Initialize token from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token') || '')
    }
  }, [])

  useEffect(() => {
    if (!activeProjectId || !token) return

    if (filter === 'my_pending') {
      fetchPendingRequests(token)
    } else {
      fetchRequests(
        activeProjectId,
        {
          status: filter === 'all' ? undefined : filter
        },
        token
      )
    }
  }, [activeProjectId, filter, token])

  if (!activeProjectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <GitBranch size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400">请先选择一个项目</p>
          <Button variant="outline" onClick={() => navigate('/projects')} className="mt-4">
            返回项目列表
          </Button>
        </div>
      </div>
    )
  }

  const displayRequests = filter === 'my_pending' ? pendingRequests : requests
  const loading = filter === 'my_pending' ? pendingLoading : requestsLoading

  const handleCancelRequest = async () => {
    if (!selectedRequest) return
    try {
      await cancelRequest(selectedRequest.id, token)
      setSelectedRequest(null)
      // Refresh list
      if (filter === 'my_pending') {
        fetchPendingRequests(token)
      } else {
        fetchRequests(activeProjectId, { status: filter === 'all' ? undefined : filter }, token)
      }
    } catch (error) {
      console.error('Failed to cancel request:', error)
    }
  }

  const filterOptions = [
    { value: 'all' as const, label: '全部', icon: GitBranch },
    { value: 'my_pending' as const, label: '待我审批', icon: Clock },
    { value: 'pending' as const, label: '进行中', icon: Clock },
    { value: 'approved' as const, label: '已通过', icon: CheckCircle }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-[#1A1A1A] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch size={20} className="text-blue-500" />
              <h1 className="text-xl font-bold text-white">审批管理</h1>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">查看和处理审批请求</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Settings size={16} />}
            onClick={() => navigate('/settings')}
          >
            审批设置
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-[#1A1A1A] px-6">
        <div className="flex gap-1">
          {filterOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative
                ${
                  filter === value
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                }
              `}
            >
              <Icon size={16} />
              <span>{label}</span>
              {value === 'my_pending' && pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                  {pendingRequests.length}
                </span>
              )}
              {filter === value && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <RequestList
            requests={displayRequests}
            loading={loading}
            onRequestClick={setSelectedRequest}
          />
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <RequestDetail
          request={selectedRequest}
          currentUserId={currentUser?.id || ''}
          token={token}
          onClose={() => setSelectedRequest(null)}
          onCancel={
            selectedRequest.requester_id === currentUser?.id
              ? handleCancelRequest
              : undefined
          }
        />
      )}
    </div>
  )
}
