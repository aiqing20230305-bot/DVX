/**
 * 环境变量验证模块
 * 在服务启动前验证必需的环境变量
 */

import { logger } from './logger.js'

/**
 * 验证环境变量
 * @throws {Error} 如果缺少必需的环境变量
 */
export function validateEnv(): void {
  logger.info('开始验证环境变量...')

  // 必需的环境变量列表
  const required = ['ANTHROPIC_API_KEY']
  const missing = required.filter(key => !process.env[key])

  // 检查缺失的环境变量
  if (missing.length > 0) {
    logger.error('❌ 缺少必需的环境变量', { missing })
    console.error('\n❌ 错误：缺少必需的环境变量\n')
    console.error('缺少的变量:', missing.join(', '))
    console.error('\n请按以下步骤操作:')
    console.error('1. 复制 .env.example 为 .env')
    console.error('2. 编辑 .env 文件，添加必需的环境变量')
    console.error('3. 重新启动服务\n')
    console.error('详细说明请参考: docs/DEPLOYMENT.md\n')
    process.exit(1)
  }

  // 验证 API Key 格式
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey && !apiKey.startsWith('sk-ant-')) {
    logger.warn('⚠️  ANTHROPIC_API_KEY 格式可能不正确', {
      prefix: apiKey.substring(0, 7)
    })
    console.warn('\n⚠️  警告：ANTHROPIC_API_KEY 格式可能不正确')
    console.warn('Claude API Key 通常以 "sk-ant-" 开头')
    console.warn('请确认 API Key 是否正确\n')
  }

  // 验证端口号
  const port = process.env.PORT
  if (port && (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
    logger.error('❌ PORT 环境变量值无效', { port })
    console.error('\n❌ 错误：PORT 环境变量值无效')
    console.error(`当前值: ${port}`)
    console.error('PORT 必须是 1-65535 之间的数字\n')
    process.exit(1)
  }

  // 验证 NODE_ENV
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    logger.warn('⚠️  NODE_ENV 值不标准', { nodeEnv })
    console.warn(`\n⚠️  警告：NODE_ENV 值 "${nodeEnv}" 不是标准值`)
    console.warn('推荐使用: development, production, test\n')
  }

  // 验证 ALLOWED_ORIGINS
  const allowedOrigins = process.env.ALLOWED_ORIGINS
  if (allowedOrigins) {
    const origins = allowedOrigins.split(',').map(o => o.trim())
    const invalidOrigins = origins.filter(o => {
      try {
        new URL(o)
        return false
      } catch {
        return true
      }
    })

    if (invalidOrigins.length > 0) {
      logger.warn('⚠️  ALLOWED_ORIGINS 中包含无效的URL', { invalidOrigins })
      console.warn('\n⚠️  警告：ALLOWED_ORIGINS 中包含无效的URL')
      console.warn('无效的URL:', invalidOrigins.join(', '))
      console.warn('格式示例: http://localhost:5173,https://example.com\n')
    }
  }

  // 所有验证通过
  logger.info('✅ 环境变量验证通过', {
    port: process.env.PORT || 3001,
    nodeEnv: nodeEnv || 'development',
    hasApiKey: !!apiKey,
    allowedOriginsCount: allowedOrigins?.split(',').length || 2
  })

  console.log('✅ 环境变量验证通过\n')
}

/**
 * 获取环境变量配置信息（用于日志）
 */
export function getEnvInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').length || 2,
  }
}
