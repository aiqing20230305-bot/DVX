/**
 * 简单的日志工具
 * 用于统一的日志格式和输出
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  meta?: any
}

class Logger {
  private format(level: LogLevel, message: string, meta?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      meta
    }
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const entry = this.format(level, message, meta)
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`

    switch (level) {
      case 'error':
        console.error(prefix, message, meta || '')
        break
      case 'warn':
        console.warn(prefix, message, meta || '')
        break
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(prefix, message, meta || '')
        }
        break
      case 'info':
      default:
        console.log(prefix, message, meta || '')
        break
    }
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta)
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta)
  }

  // 便捷方法：记录API请求
  request(method: string, url: string, duration?: number): void {
    const message = duration
      ? `${method} ${url} - ${duration}ms`
      : `${method} ${url}`
    this.info(message)
  }

  // 便捷方法：记录数据库操作
  db(operation: string, table: string, meta?: any): void {
    this.debug(`DB ${operation}: ${table}`, meta)
  }
}

// 导出单例
export const logger = new Logger()
