import { toast } from '../store/toast.store.js'

const BASE_URL = '/api'

// Request configuration
interface RequestConfig {
  retry?: boolean
  retries?: number
  retryDelay?: number
  timeout?: number
  showErrorToast?: boolean
}

const DEFAULT_CONFIG: RequestConfig = {
  retry: true,
  retries: 3,
  retryDelay: 1000,
  timeout: 30000,
  showErrorToast: true
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Network status detection
function isOnline(): boolean {
  return navigator.onLine
}

// Check if error is retryable
function isRetryableError(status: number): boolean {
  // Retry on server errors (5xx) or network errors
  return status >= 500 || status === 0
}

// Sleep utility for retry delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  config: RequestConfig = {}
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Check network status
  if (!isOnline()) {
    const error = new APIError('网络连接已断开，请检查网络设置', 0)
    if (cfg.showErrorToast) {
      toast.error('网络错误', '网络连接已断开，请检查网络设置')
    }
    throw error
  }

  let lastError: APIError | null = null
  const maxAttempts = cfg.retry ? (cfg.retries ?? 1) + 1 : 1

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), cfg.timeout)

      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        signal: controller.signal,
        ...options
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        let errorData: unknown
        try {
          errorData = await res.json()
        } catch {
          errorData = { error: res.statusText }
        }
        const message = (errorData as { error?: string })?.error ?? `HTTP ${res.status}`
        const error = new APIError(message, res.status, errorData)

        // Check if should retry
        if (cfg.retry && attempt < maxAttempts && isRetryableError(res.status)) {
          lastError = error
          await sleep(cfg.retryDelay ?? 1000)
          continue
        }

        // Show error toast for non-retry errors or last attempt
        if (cfg.showErrorToast) {
          toast.error('请求失败', message)
        }
        throw error
      }

      return res.json() as Promise<T>
    } catch (err) {
      // Handle fetch errors (network, timeout, etc.)
      if (err instanceof APIError) {
        throw err
      }

      const isTimeout = err instanceof Error && err.name === 'AbortError'
      const message = isTimeout ? '请求超时，请稍后重试' : '网络请求失败'
      const error = new APIError(message, 0)

      // Retry on network errors or timeouts
      if (cfg.retry && attempt < maxAttempts) {
        lastError = error
        await sleep(cfg.retryDelay ?? 1000)
        continue
      }

      // Show error toast for last attempt
      if (cfg.showErrorToast) {
        toast.error('网络错误', message)
      }
      throw error
    }
  }

  // Should not reach here, but TypeScript needs it
  throw lastError ?? new APIError('请求失败', 0)
}

export const api = {
  get: <T>(path: string, config?: RequestConfig) =>
    request<T>(path, { method: 'GET' }, config),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, config),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, config),
  patch: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, config),
  delete: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }, config),
}
