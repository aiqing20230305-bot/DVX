import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { logger } from '../utils/logger.js'

/**
 * 自定义错误类
 * 用于标识可操作的错误（vs 系统错误）
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * 全局错误处理中间件
 * 统一处理所有API错误
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 确定状态码
  const statusCode = err instanceof AppError ? err.statusCode : 500
  const message = err.message || 'Internal Server Error'
  const isOperational = err instanceof AppError ? err.isOperational : false

  // 记录错误日志
  logger.error(`${req.method} ${req.url} - ${message}`, {
    statusCode,
    message,
    stack: err.stack,
    isOperational,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  })

  // 返回错误响应
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * 404错误处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`)
  res.status(404).json({
    error: {
      message: 'Resource not found',
      statusCode: 404,
      path: req.url,
      timestamp: new Date().toISOString()
    }
  })
}
