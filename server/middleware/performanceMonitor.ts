import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'

/**
 * API性能监控中间件
 * 记录每个请求的响应时间
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()

  // 在响应完成时记录
  res.on('finish', () => {
    const duration = Date.now() - start
    const { method, url } = req
    const { statusCode } = res

    // 记录请求日志
    logger.request(method, url, duration)

    // 如果响应时间过长，记录警告
    if (duration > 1000 && !url.includes('/generate')) {
      // generate接口除外（AI生成本身就很慢）
      logger.warn(`Slow API: ${method} ${url} - ${duration}ms`, {
        statusCode,
        duration
      })
    }

    // 如果响应错误，记录错误
    if (statusCode >= 400) {
      logger.error(`API Error: ${method} ${url} - ${statusCode}`, {
        statusCode,
        duration
      })
    }
  })

  next()
}
