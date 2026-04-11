const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

export interface Product {
  id: string
  project_id: string
  name: string
  alias?: string
  description?: string
  source: 'auto_extracted' | 'manual'
  file_count: number
  created_at: number
  updated_at: number
}

export interface ProductInput {
  name: string
  alias?: string
  description?: string
}

/**
 * 获取项目的产品列表
 */
export async function getProducts(projectId: string): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/api/project/${projectId}/products`, {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('获取产品列表失败')
  }

  const data = await response.json()
  return data.products
}

/**
 * 创建产品
 */
export async function createProduct(projectId: string, input: ProductInput): Promise<Product> {
  const response = await fetch(`${API_BASE}/api/project/${projectId}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '创建产品失败')
  }

  const data = await response.json()
  return data.product
}

/**
 * 更新产品
 */
export async function updateProduct(
  projectId: string,
  productId: string,
  input: Partial<ProductInput>
): Promise<Product> {
  const response = await fetch(`${API_BASE}/api/project/${projectId}/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '更新产品失败')
  }

  const data = await response.json()
  return data.product
}

/**
 * 删除产品
 */
export async function deleteProduct(projectId: string, productId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/project/${projectId}/products/${productId}`, {
    method: 'DELETE',
    credentials: 'include'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '删除产品失败')
  }
}

/**
 * 刷新产品列表（重新提取）
 */
export async function refreshProducts(projectId: string): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/api/project/${projectId}/products/refresh`, {
    method: 'POST',
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('刷新产品列表失败')
  }

  const data = await response.json()
  return data.products
}
