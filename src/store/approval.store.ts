import { create } from 'zustand'
import {
  approvalApi,
  ApprovalWorkflow,
  ApprovalRequestWithDetails,
  ApprovalReviewWithReviewer,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  CreateRequestInput,
  SubmitReviewInput
} from '../api/approval.api'

interface ApprovalState {
  // Workflows
  workflows: ApprovalWorkflow[]
  workflowsLoading: boolean
  workflowsError: string | null

  // Requests
  requests: ApprovalRequestWithDetails[]
  requestsLoading: boolean
  requestsError: string | null

  // Pending Requests (待我审批)
  pendingRequests: ApprovalRequestWithDetails[]
  pendingLoading: boolean
  pendingError: string | null

  // Reviews
  reviews: Record<string, ApprovalReviewWithReviewer[]> // key: request_id
  reviewsLoading: Record<string, boolean>
  reviewsError: Record<string, string | null>

  // ==================== Workflow Actions ====================

  fetchWorkflows: (projectId: string, targetType: string | undefined, token: string) => Promise<void>
  createWorkflow: (input: CreateWorkflowInput, token: string) => Promise<ApprovalWorkflow>
  updateWorkflow: (workflowId: string, updates: UpdateWorkflowInput, token: string) => Promise<void>
  deleteWorkflow: (workflowId: string, token: string) => Promise<void>

  // ==================== Request Actions ====================

  fetchRequests: (
    projectId: string,
    filters: { status?: string; target_type?: string; target_id?: string },
    token: string
  ) => Promise<void>
  fetchPendingRequests: (token: string) => Promise<void>
  createRequest: (input: CreateRequestInput, token: string) => Promise<ApprovalRequestWithDetails>
  cancelRequest: (requestId: string, token: string) => Promise<void>

  // ==================== Review Actions ====================

  fetchReviews: (requestId: string, token: string) => Promise<void>
  submitReview: (
    requestId: string,
    input: SubmitReviewInput,
    token: string
  ) => Promise<{ request_status: string; current_step?: number }>

  // ==================== Utility ====================

  clearError: () => void
  reset: () => void
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  // Initial state
  workflows: [],
  workflowsLoading: false,
  workflowsError: null,

  requests: [],
  requestsLoading: false,
  requestsError: null,

  pendingRequests: [],
  pendingLoading: false,
  pendingError: null,

  reviews: {},
  reviewsLoading: {},
  reviewsError: {},

  // ==================== Workflow Actions ====================

  fetchWorkflows: async (projectId, targetType, token) => {
    set({ workflowsLoading: true, workflowsError: null })
    try {
      const workflows = await approvalApi.getWorkflows(projectId, targetType, token)
      set({ workflows, workflowsLoading: false })
    } catch (error: any) {
      set({
        workflowsError: error.response?.data?.message || '获取审批流程列表失败',
        workflowsLoading: false
      })
    }
  },

  createWorkflow: async (input, token) => {
    set({ workflowsLoading: true, workflowsError: null })
    try {
      const workflow = await approvalApi.createWorkflow(input, token)
      set((state) => ({
        workflows: [workflow, ...state.workflows],
        workflowsLoading: false
      }))
      return workflow
    } catch (error: any) {
      set({
        workflowsError: error.response?.data?.message || '创建审批流程失败',
        workflowsLoading: false
      })
      throw error
    }
  },

  updateWorkflow: async (workflowId, updates, token) => {
    set({ workflowsLoading: true, workflowsError: null })
    try {
      await approvalApi.updateWorkflow(workflowId, updates, token)
      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === workflowId ? { ...w, ...updates, updated_at: Date.now() } : w
        ),
        workflowsLoading: false
      }))
    } catch (error: any) {
      set({
        workflowsError: error.response?.data?.message || '更新审批流程失败',
        workflowsLoading: false
      })
      throw error
    }
  },

  deleteWorkflow: async (workflowId, token) => {
    set({ workflowsLoading: true, workflowsError: null })
    try {
      await approvalApi.deleteWorkflow(workflowId, token)
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== workflowId),
        workflowsLoading: false
      }))
    } catch (error: any) {
      set({
        workflowsError: error.response?.data?.message || '删除审批流程失败',
        workflowsLoading: false
      })
      throw error
    }
  },

  // ==================== Request Actions ====================

  fetchRequests: async (projectId, filters, token) => {
    set({ requestsLoading: true, requestsError: null })
    try {
      const requests = await approvalApi.getRequests(projectId, filters, token)
      set({ requests, requestsLoading: false })
    } catch (error: any) {
      set({
        requestsError: error.response?.data?.message || '获取审批请求列表失败',
        requestsLoading: false
      })
    }
  },

  fetchPendingRequests: async (token) => {
    set({ pendingLoading: true, pendingError: null })
    try {
      const pendingRequests = await approvalApi.getPendingRequests(token)
      set({ pendingRequests, pendingLoading: false })
    } catch (error: any) {
      set({
        pendingError: error.response?.data?.message || '获取待审批列表失败',
        pendingLoading: false
      })
    }
  },

  createRequest: async (input, token) => {
    set({ requestsLoading: true, requestsError: null })
    try {
      const request = await approvalApi.createRequest(input, token)

      // Optimistic update: fetch detailed version
      const requests = await approvalApi.getRequests(
        request.project_id,
        { target_id: request.target_id },
        token
      )
      const detailedRequest = requests.find((r) => r.id === request.id)

      if (detailedRequest) {
        set((state) => ({
          requests: [detailedRequest, ...state.requests],
          requestsLoading: false
        }))
        return detailedRequest
      }

      set({ requestsLoading: false })
      return request as ApprovalRequestWithDetails
    } catch (error: any) {
      set({
        requestsError: error.response?.data?.message || '提交审批请求失败',
        requestsLoading: false
      })
      throw error
    }
  },

  cancelRequest: async (requestId, token) => {
    set({ requestsLoading: true, requestsError: null })
    try {
      await approvalApi.cancelRequest(requestId, token)
      set((state) => ({
        requests: state.requests.map((r) =>
          r.id === requestId ? { ...r, status: 'cancelled' as const, updated_at: Date.now() } : r
        ),
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
        requestsLoading: false
      }))
    } catch (error: any) {
      set({
        requestsError: error.response?.data?.message || '撤销审批请求失败',
        requestsLoading: false
      })
      throw error
    }
  },

  // ==================== Review Actions ====================

  fetchReviews: async (requestId, token) => {
    set((state) => ({
      reviewsLoading: { ...state.reviewsLoading, [requestId]: true },
      reviewsError: { ...state.reviewsError, [requestId]: null }
    }))
    try {
      const reviews = await approvalApi.getReviews(requestId, token)
      set((state) => ({
        reviews: { ...state.reviews, [requestId]: reviews },
        reviewsLoading: { ...state.reviewsLoading, [requestId]: false }
      }))
    } catch (error: any) {
      set((state) => ({
        reviewsError: {
          ...state.reviewsError,
          [requestId]: error.response?.data?.message || '获取审批历史失败'
        },
        reviewsLoading: { ...state.reviewsLoading, [requestId]: false }
      }))
    }
  },

  submitReview: async (requestId, input, token) => {
    set((state) => ({
      reviewsLoading: { ...state.reviewsLoading, [requestId]: true },
      reviewsError: { ...state.reviewsError, [requestId]: null }
    }))
    try {
      const result = await approvalApi.submitReview(requestId, input, token)

      // Update request status
      set((state) => ({
        requests: state.requests.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: result.request_status as any,
                current_step: result.current_step || r.current_step,
                updated_at: Date.now()
              }
            : r
        ),
        pendingRequests: state.pendingRequests.filter((r) => r.id !== requestId),
        reviewsLoading: { ...state.reviewsLoading, [requestId]: false }
      }))

      // Refresh reviews
      await get().fetchReviews(requestId, token)

      return result
    } catch (error: any) {
      set((state) => ({
        reviewsError: {
          ...state.reviewsError,
          [requestId]: error.response?.data?.message || '提交审批意见失败'
        },
        reviewsLoading: { ...state.reviewsLoading, [requestId]: false }
      }))
      throw error
    }
  },

  // ==================== Utility ====================

  clearError: () => {
    set({
      workflowsError: null,
      requestsError: null,
      pendingError: null,
      reviewsError: {}
    })
  },

  reset: () => {
    set({
      workflows: [],
      workflowsLoading: false,
      workflowsError: null,
      requests: [],
      requestsLoading: false,
      requestsError: null,
      pendingRequests: [],
      pendingLoading: false,
      pendingError: null,
      reviews: {},
      reviewsLoading: {},
      reviewsError: {}
    })
  }
}))
