/**
 * Error Message Utilities
 * 将技术错误转换为用户友好的语言，并提供解决建议
 */

export interface FriendlyError {
  userMessage: string
  suggestions: string[]
  severity: 'info' | 'warning' | 'error'
  technicalDetails?: string
  canRetry?: boolean
}

/**
 * 错误类型映射
 */
const errorPatterns: Array<{
  pattern: RegExp | string
  transform: (error: Error | string) => FriendlyError
}> = [
  // JSON解析错误
  {
    pattern: /JSON|parse|Unexpected token|position \d+/i,
    transform: (error) => ({
      userMessage: '🔧 脚本生成格式异常',
      suggestions: [
        '点击"重试"按钮再试一次',
        '这通常是临时性问题',
        '如果持续失败，请联系技术支持'
      ],
      severity: 'warning',
      technicalDetails: error.toString(),
      canRetry: true
    })
  },

  // 网络错误
  {
    pattern: /network|fetch|ERR_NETWORK|Failed to fetch|NetworkError/i,
    transform: (error) => ({
      userMessage: '📡 网络连接失败',
      suggestions: [
        '检查您的网络连接',
        '刷新页面后重试',
        '如果问题持续，可能是服务器维护中'
      ],
      severity: 'error',
      technicalDetails: error.toString(),
      canRetry: true
    })
  },

  // 超时错误
  {
    pattern: /timeout|timed out|ETIMEDOUT/i,
    transform: (error) => ({
      userMessage: '⏱️ 请求超时',
      suggestions: [
        '服务器响应较慢，请稍后重试',
        '如果经常超时，可能是数据量较大',
        '考虑减少一次性生成的数量'
      ],
      severity: 'warning',
      technicalDetails: error.toString(),
      canRetry: true
    })
  },

  // 授权错误
  {
    pattern: /401|unauthorized|unauthenticated|token|登录/i,
    transform: (error) => ({
      userMessage: '🔐 登录已过期',
      suggestions: [
        '请重新登录',
        '您的登录状态可能已失效'
      ],
      severity: 'error',
      technicalDetails: error.toString(),
      canRetry: false
    })
  },

  // 权限错误
  {
    pattern: /403|forbidden|permission|权限/i,
    transform: (error) => ({
      userMessage: '🚫 权限不足',
      suggestions: [
        '您没有执行此操作的权限',
        '请联系项目管理员授予权限'
      ],
      severity: 'error',
      technicalDetails: error.toString(),
      canRetry: false
    })
  },

  // 404错误
  {
    pattern: /404|not found|不存在/i,
    transform: (error) => ({
      userMessage: '🔍 资源不存在',
      suggestions: [
        '请求的资源可能已被删除',
        '刷新页面后重试',
        '如果问题持续，请联系技术支持'
      ],
      severity: 'error',
      technicalDetails: error.toString(),
      canRetry: false
    })
  },

  // 服务器错误
  {
    pattern: /500|502|503|504|server error|internal error|服务器错误/i,
    transform: (error) => ({
      userMessage: '⚠️ 服务器错误',
      suggestions: [
        '服务器遇到了问题',
        '请稍后重试',
        '如果问题持续，请联系技术支持'
      ],
      severity: 'error',
      technicalDetails: error.toString(),
      canRetry: true
    })
  },

  // 参数错误
  {
    pattern: /缺少|必填|invalid|validation|参数/i,
    transform: (error) => ({
      userMessage: '📝 参数错误',
      suggestions: [
        '请检查输入的信息是否完整',
        '确保所有必填字段都已填写',
        '如果不确定，请刷新页面重试'
      ],
      severity: 'warning',
      technicalDetails: error.toString(),
      canRetry: false
    })
  },

  // 数据库错误
  {
    pattern: /database|sqlite|sql|UNIQUE constraint|数据库/i,
    transform: (error) => ({
      userMessage: '💾 数据保存失败',
      suggestions: [
        '可能存在重复数据',
        '请刷新页面查看最新状态',
        '如果问题持续，请联系技术支持'
      ],
      severity: 'error',
      technicalDetails: error.toString(),
      canRetry: false
    })
  },

  // 文件上传错误
  {
    pattern: /upload|file|size|type|格式|大小/i,
    transform: (error) => ({
      userMessage: '📎 文件上传失败',
      suggestions: [
        '检查文件格式是否正确',
        '确保文件大小不超过限制',
        '尝试重新选择文件上传'
      ],
      severity: 'warning',
      technicalDetails: error.toString(),
      canRetry: true
    })
  }
]

/**
 * 将技术错误转换为用户友好的错误消息
 */
export function toFriendlyError(error: unknown): FriendlyError {
  // 默认错误消息
  const defaultError: FriendlyError = {
    userMessage: '❌ 操作失败',
    suggestions: [
      '请重试',
      '如果问题持续，请联系技术支持'
    ],
    severity: 'error',
    technicalDetails: String(error),
    canRetry: true
  }

  // 如果已经是FriendlyError格式，直接返回
  if (error && typeof error === 'object' && 'userMessage' in error) {
    return error as FriendlyError
  }

  // 转换为字符串
  const errorString = error instanceof Error ? error.message : String(error)

  // 匹配错误模式
  for (const { pattern, transform } of errorPatterns) {
    if (typeof pattern === 'string') {
      if (errorString.includes(pattern)) {
        return transform(error as Error)
      }
    } else {
      if (pattern.test(errorString)) {
        return transform(error as Error)
      }
    }
  }

  // 如果没有匹配的模式，返回默认错误
  return defaultError
}

/**
 * 格式化错误消息用于显示
 */
export function formatErrorMessage(error: FriendlyError): string {
  let message = error.userMessage

  if (error.suggestions.length > 0) {
    message += '\n\n💡 建议：\n'
    message += error.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
  }

  return message
}

/**
 * 生成可复制的错误详情
 */
export function getErrorDetails(error: FriendlyError): string {
  const lines = [
    `错误类型: ${error.severity}`,
    `用户消息: ${error.userMessage}`,
    '',
    '建议操作:',
    ...error.suggestions.map((s, i) => `  ${i + 1}. ${s}`),
    '',
    '技术详情:',
    error.technicalDetails || '无'
  ]

  return lines.join('\n')
}

/**
 * 复制错误详情到剪贴板
 */
export async function copyErrorDetails(error: FriendlyError): Promise<boolean> {
  try {
    const details = getErrorDetails(error)
    await navigator.clipboard.writeText(details)
    return true
  } catch (err) {
    console.error('Failed to copy error details:', err)
    return false
  }
}
