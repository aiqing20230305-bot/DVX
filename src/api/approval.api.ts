import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

// ==================== Types ====================

export interface ApprovalWorkflowStep {
  step: number
  reviewers: string[]
  rule: 'any' | 'all'
}

export interface ApprovalWorkflow {
  id: string
  project_id: string
  name: string
  description?: string
  target_type: 'topic' | 'script' | 'report'
  steps: ApprovalWorkflowStep[]
  status: 'active' | 'inactive'
  created_by: string
  created_at: number
  updated_at: number
}

export interface ApprovalRequest {
  id: string
  workflow_id: string
  project_id: string
  target_type: string
  target_id: string
  current_step: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  requester_id: string
  created_at: number
  updated_at: number
}

export interface ApprovalRequestWithDetails extends ApprovalRequest {
  workflow: ApprovalWorkflow
  requester: {
    id: string
    email: string
    name: string
  }
  reviews: ApprovalReviewWithReviewer[]
}

export interface ApprovalReview {
  id: string
  request_id: string
  step: number
  reviewer_id: string
  status: 'approved' | 'rejected'
  comment?: string
  created_at: number
}

export interface ApprovalReviewWithReviewer extends ApprovalReview {
  reviewer: {
    id: string
    email: string
    name: string
  }
}

export interface CreateWorkflowInput {
  project_id: string
  name: string
  description?: string
  target_type: 'topic' | 'script' | 'report'
  steps: ApprovalWorkflowStep[]
}

export interface UpdateWorkflowInput {
  name?: string
  description?: string
  steps?: ApprovalWorkflowStep[]
  status?: 'active' | 'inactive'
}

export interface CreateRequestInput {
  workflow_id: string
  target_type: string
  target_id: string
}

export interface SubmitReviewInput {
  status: 'approved' | 'rejected'
  comment?: string
}

// ==================== Workflow API ====================

export const approvalApi = {
  // 创建审批流程
  async createWorkflow(input: CreateWorkflowInput, token: string): Promise<ApprovalWorkflow> {
    const response = await axios.post(
      `${API_BASE}/api/approval/workflows`,
      input,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data.workflow
  },

  // 获取项目流程列表
  async getWorkflows(
    projectId: string,
    targetType: string | undefined,
    token: string
  ): Promise<ApprovalWorkflow[]> {
    const params = new URLSearchParams({ project_id: projectId })
    if (targetType) {
      params.append('target_type', targetType)
    }

    const response = await axios.get(`${API_BASE}/api/approval/workflows?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.workflows
  },

  // 更新流程
  async updateWorkflow(
    workflowId: string,
    updates: UpdateWorkflowInput,
    token: string
  ): Promise<void> {
    await axios.put(`${API_BASE}/api/approval/workflows/${workflowId}`, updates, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
  },

  // 删除流程
  async deleteWorkflow(workflowId: string, token: string): Promise<void> {
    await axios.delete(`${API_BASE}/api/approval/workflows/${workflowId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },

  // ==================== Request API ====================

  // 提交审批请求
  async createRequest(input: CreateRequestInput, token: string): Promise<ApprovalRequest> {
    const response = await axios.post(
      `${API_BASE}/api/approval/requests`,
      input,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data.request
  },

  // 获取审批请求列表
  async getRequests(
    projectId: string,
    filters: {
      status?: string
      target_type?: string
      target_id?: string
    },
    token: string
  ): Promise<ApprovalRequestWithDetails[]> {
    const params = new URLSearchParams({ project_id: projectId })
    if (filters.status) params.append('status', filters.status)
    if (filters.target_type) params.append('target_type', filters.target_type)
    if (filters.target_id) params.append('target_id', filters.target_id)

    const response = await axios.get(`${API_BASE}/api/approval/requests?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.requests
  },

  // 获取待我审批的请求
  async getPendingRequests(token: string): Promise<ApprovalRequestWithDetails[]> {
    const response = await axios.get(`${API_BASE}/api/approval/requests/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data.requests
  },

  // 撤销请求
  async cancelRequest(requestId: string, token: string): Promise<void> {
    await axios.put(
      `${API_BASE}/api/approval/requests/${requestId}/cancel`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
  },

  // ==================== Review API ====================

  // 提交审批意见
  async submitReview(
    requestId: string,
    input: SubmitReviewInput,
    token: string
  ): Promise<{
    review: ApprovalReview
    request_status: string
    current_step?: number
  }> {
    const response = await axios.post(
      `${API_BASE}/api/approval/requests/${requestId}/review`,
      input,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    )
    return {
      review: response.data.review,
      request_status: response.data.request_status,
      current_step: response.data.current_step
    }
  },

  // 获取审批历史
  async getReviews(requestId: string, token: string): Promise<ApprovalReviewWithReviewer[]> {
    const response = await axios.get(
      `${API_BASE}/api/approval/requests/${requestId}/reviews`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    return response.data.reviews
  }
}
