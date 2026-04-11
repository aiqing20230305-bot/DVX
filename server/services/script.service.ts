import { topicRepo } from '../db/repositories/topic.repo.js'
import { scriptRepo, ScriptData } from '../db/repositories/script.repo.js'
import { logRepo } from '../db/repositories/log.repo.js'
import { uploadRepo } from '../db/repositories/upload.repo.js'
import { productRepo } from '../db/repositories/product.repo.js'
import { streamText } from './claude/client.js'
import { XMLStreamParser } from './claude/streaming.js'
import { buildScriptSystemPrompt, buildScriptUserMessage } from './claude/prompts/script.prompt.js'
import { Response } from 'express'
import { initSSE, sendSSEEvent, closeSSE } from '../utils/sse.js'

/**
 * 从上传文件中提取产品列表
 * v2.7.0: 优先从products表读取（包含手动添加的产品），如果为空则降级到文件提取
 */
export function extractProductList(projectId: string): string[] {
  // 1. 优先从products表读取
  const dbProducts = productRepo.findByProject(projectId)
  if (dbProducts.length > 0) {
    return dbProducts.map(p => p.name)
  }

  // 2. 降级到旧逻辑：从文件提取
  const uploads = uploadRepo.findByProject(projectId)
  const productFiles = uploads.filter(u =>
    u.parsed_data &&
    (u.original_name.includes('话术') ||
     u.original_name.includes('卖点') ||
     u.original_name.includes('产品') ||
     u.file_type === 'brand_guide')
  )

  const products = new Set<string>()

  productFiles.forEach(file => {
    // Extract product name from filename
    // Examples: "多芬-产品卖点.pdf" -> "多芬"
    //           "话术参考&违禁词.pdf" -> skip (no specific product)
    const name = file.original_name

    // Try to extract product name before "-" or "."
    const match = name.match(/^([^-\.]+)/)
    if (match && match[1] && !match[1].includes('话术') && !match[1].includes('违禁')) {
      products.add(match[1].trim())
    }

    // Also try to parse content for product names
    try {
      const parsed = JSON.parse(file.parsed_data!)
      const text = parsed.text || parsed.content || ''

      // Look for product name patterns in content
      const productPatterns = [
        /产品名称[：:]\s*([^\n，,。.]+)/,
        /品牌[：:]\s*([^\n，,。.]+)/,
        /【([^】]+)】/  // Extract text in brackets
      ]

      productPatterns.forEach(pattern => {
        const match = text.match(pattern)
        if (match && match[1]) {
          const productName = match[1].trim()
          if (productName.length > 0 && productName.length < 20) {
            products.add(productName)
          }
        }
      })
    } catch {
      // Ignore parse errors
    }
  })

  return Array.from(products)
}

/**
 * 产品详情接口
 */
export interface ProductDetail {
  name: string
  fileCount: number
  files: Array<{
    name: string
    type: string  // '卖点' | '话术' | '产品' | '品牌指南'
  }>
}

/**
 * 从上传文件中提取产品列表（含详细信息）
 * 用于产品选择器UI增强
 */
export function extractProductListWithDetails(projectId: string): ProductDetail[] {
  const uploads = uploadRepo.findByProject(projectId)
  const productFiles = uploads.filter(u =>
    u.parsed_data &&
    (u.original_name.includes('话术') ||
     u.original_name.includes('卖点') ||
     u.original_name.includes('产品') ||
     u.file_type === 'brand_guide')
  )

  // Map: product name -> file list
  const productFilesMap = new Map<string, Array<{name: string, type: string}>>()

  productFiles.forEach(file => {
    // Extract product name from filename
    const name = file.original_name
    const match = name.match(/^([^-\.]+)/)

    if (match && match[1] && !match[1].includes('话术') && !match[1].includes('违禁')) {
      const productName = match[1].trim()

      // Determine file type
      let fileType = '产品'
      if (name.includes('卖点')) fileType = '卖点'
      else if (name.includes('话术')) fileType = '话术'
      else if (file.file_type === 'brand_guide') fileType = '品牌指南'

      if (!productFilesMap.has(productName)) {
        productFilesMap.set(productName, [])
      }
      productFilesMap.get(productName)!.push({
        name: file.original_name,
        type: fileType
      })
    }

    // Also try to parse content for product names
    try {
      const parsed = JSON.parse(file.parsed_data!)
      const text = parsed.text || parsed.content || ''

      const productPatterns = [
        /产品名称[：:]\s*([^\n，,。.]+)/,
        /品牌[：:]\s*([^\n，,。.]+)/,
        /【([^】]+)】/
      ]

      productPatterns.forEach(pattern => {
        const match = text.match(pattern)
        if (match && match[1]) {
          const productName = match[1].trim()
          if (productName.length > 0 && productName.length < 20) {
            if (!productFilesMap.has(productName)) {
              productFilesMap.set(productName, [])
            }
            // Only add if not already in the list
            const existingFile = productFilesMap.get(productName)!.find(f => f.name === file.original_name)
            if (!existingFile) {
              let fileType = '产品'
              if (name.includes('卖点')) fileType = '卖点'
              else if (name.includes('话术')) fileType = '话术'
              else if (file.file_type === 'brand_guide') fileType = '品牌指南'

              productFilesMap.get(productName)!.push({
                name: file.original_name,
                type: fileType
              })
            }
          }
        }
      })
    } catch {
      // Ignore parse errors
    }
  })

  // Convert to array and sort by file count descending
  return Array.from(productFilesMap.entries())
    .map(([name, files]) => ({
      name,
      fileCount: files.length,
      files
    }))
    .sort((a, b) => b.fileCount - a.fileCount)
}

/**
 * 从选题中自动检测主要产品
 */
function detectMainProduct(topics: any[], productList: string[]): string | null {
  if (productList.length === 0) return null

  // Count product occurrences in topic titles
  const productCounts: Record<string, number> = {}

  productList.forEach(product => {
    productCounts[product] = 0
    topics.forEach(topic => {
      if (topic.title.includes(product)) {
        productCounts[product]++
      }
    })
  })

  // Find the most frequent product
  let maxCount = 0
  let mainProduct: string | null = null

  Object.entries(productCounts).forEach(([product, count]) => {
    if (count > maxCount) {
      maxCount = count
      mainProduct = product
    }
  })

  return mainProduct
}

/**
 * 获取项目的话术参考和产品卖点内容
 * @param productName 可选，指定产品名称以过滤内容
 */
function getBrandContext(projectId: string, productName?: string): string {
  const uploads = uploadRepo.findByProject(projectId)
  let referenceFiles = uploads.filter(u =>
    u.parsed_data &&
    (u.original_name.includes('话术') ||
     u.original_name.includes('卖点') ||
     u.original_name.includes('产品') ||
     u.file_type === 'brand_guide')
  )

  // Filter by product name if specified
  if (productName) {
    referenceFiles = referenceFiles.filter(file =>
      file.original_name.includes(productName)
    )
  }

  if (referenceFiles.length === 0) {
    return ''
  }

  const contexts = referenceFiles.map(file => {
    try {
      const parsed = JSON.parse(file.parsed_data!)
      const text = parsed.text || parsed.content || ''
      return `【${file.original_name}】\n${text}`
    } catch {
      return ''
    }
  }).filter(Boolean)

  return contexts.join('\n\n---\n\n')
}

export async function generateScriptsStream(projectId: string, topicId: string, res: Response): Promise<void> {
  initSSE(res)

  try {
    const topic = topicRepo.findById(topicId)
    if (!topic) {
      sendSSEEvent(res, 'error', { message: '选题不存在' })
      closeSSE(res)
      return
    }

    const topicData = `标题：${topic.title}
切角：${topic.angle}
目标受众：${topic.persona}
平台：${topic.platform}
预计时长：${topic.estimated_duration}秒
行动号召：${topic.cta}`

    // 获取话术参考和产品卖点
    const brandContext = getBrandContext(projectId)

    const systemPrompt = buildScriptSystemPrompt()

    // Generate A and B variants in parallel for better performance
    await Promise.all(
      (['A', 'B'] as const).map(async (variant) => {
        const userMessage = buildScriptUserMessage(topicData, variant, brandContext)
        let scriptSaved = false

        const parser = new XMLStreamParser<ScriptData>(
          'script',
          (item) => {
            if (!scriptSaved) {
              const saved = scriptRepo.create(projectId, topicId, variant, item)
              scriptSaved = true
              sendSSEEvent(res, `script_${variant}`, {
                ...item,
                id: saved.id,
                variant,
                topicId
              })
            }
          },
          (err, raw) => {
            console.error(`Failed to parse script ${variant}:`, err.message, raw.slice(0, 100))
          }
        )

        sendSSEEvent(res, 'generating', { variant, message: `正在生成${variant}版本脚本...` })

        await streamText({
          systemPrompt,
          userContent: userMessage,
          onChunk: (text) => {
            parser.feed(text)
            sendSSEEvent(res, `chunk_${variant}`, { text })
          },
          onComplete: () => {
            sendSSEEvent(res, `complete_${variant}`, { variant })
          }
        })
      })
    )

    // Mark topic as selected after successful script generation
    topicRepo.update(topicId, { selected: true })

    // Log script generation
    logRepo.create(projectId, 'script', `生成脚本：${topic.title}（A/B两版本）`)

    sendSSEEvent(res, 'complete', { message: '脚本生成完成' })
    closeSSE(res)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    sendSSEEvent(res, 'error', { message })
    closeSSE(res)
  }
}

/**
 * Generate a single script variant with automatic retry on failure
 * @param maxRetries Maximum retry attempts (default 2)
 * @returns { success: boolean, scriptId?: string, retries: number, error?: string }
 */
async function generateScriptWithRetry(
  systemPrompt: string,
  topicData: string,
  variant: 'A' | 'B',
  brandContext: string,
  projectId: string,
  topicId: string,
  topicTitle: string,
  res: Response,
  maxRetries: number = 2
): Promise<{ success: boolean; scriptId?: string; retries: number; error?: string }> {
  let retries = 0
  let lastError: string = ''

  while (retries <= maxRetries) {
    try {
      const userMessage = buildScriptUserMessage(topicData, variant, brandContext)
      let scriptSaved = false
      let scriptId: string = ''
      let parseError: string | null = null

      const parser = new XMLStreamParser<ScriptData>(
        'script',
        (item) => {
          if (!scriptSaved) {
            const saved = scriptRepo.create(projectId, topicId, variant, item)
            scriptSaved = true
            scriptId = saved.id
            sendSSEEvent(res, 'script_created', {
              ...item,
              id: saved.id,
              variant,
              topicId,
              topicTitle
            })
          }
        },
        (err, raw) => {
          parseError = err.message
          console.error(`[Batch] Failed to parse script ${variant} for topic ${topicId} (attempt ${retries + 1}):`, err.message)
          console.error(`[Batch] Raw content (first 200 chars):`, raw.slice(0, 200))
        }
      )

      await streamText({
        systemPrompt,
        userContent: userMessage,
        onChunk: (text) => {
          parser.feed(text)
        },
        onComplete: () => {
          sendSSEEvent(res, 'variant_complete', {
            topicId,
            variant
          })
        }
      })

      // Check if parsing succeeded
      if (scriptSaved) {
        if (retries > 0) {
          console.log(`[Batch] Script ${variant} for topic ${topicId} succeeded after ${retries} retries`)
        }
        return { success: true, scriptId, retries }
      }

      // Parsing failed
      lastError = parseError || 'Unknown parse error'

      if (retries < maxRetries) {
        console.log(`[Batch] Retrying script ${variant} for topic ${topicId} (attempt ${retries + 2}/${maxRetries + 1})`)
        sendSSEEvent(res, 'script_retry', {
          topicId,
          variant,
          attempt: retries + 2,
          maxAttempts: maxRetries + 1
        })
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
        retries++
      } else {
        break
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.error(`[Batch] Error generating script ${variant} for topic ${topicId} (attempt ${retries + 1}):`, lastError)

      if (retries < maxRetries) {
        retries++
        await new Promise(resolve => setTimeout(resolve, 1000))
      } else {
        break
      }
    }
  }

  return { success: false, retries, error: lastError }
}

/**
 * Batch generate scripts for multiple topics with controlled concurrency
 * @param product 可选，指定产品名称以统一脚本内容
 */
export async function generateScriptsBatchStream(projectId: string, topicIds: string[], res: Response, product?: string): Promise<void> {
  initSSE(res)

  try {
    // Validate all topics exist
    const topics = topicIds.map(id => topicRepo.findById(id)).filter(Boolean)
    if (topics.length === 0) {
      sendSSEEvent(res, 'error', { message: '未找到有效的选题' })
      closeSSE(res)
      return
    }

    // Auto-detect main product if not specified
    let selectedProduct = product
    if (!selectedProduct) {
      const productList = extractProductList(projectId)
      selectedProduct = detectMainProduct(topics, productList) || undefined
      if (selectedProduct) {
        console.log(`[Batch] Auto-detected main product: ${selectedProduct}`)
      }
    }

    sendSSEEvent(res, 'batch_start', {
      message: `开始批量生成${topics.length}个选题的脚本...`,
      total: topics.length,
      product: selectedProduct // 通知前端使用的产品
    })

    // Get brand context once (shared across all topics), filtered by product
    const brandContext = getBrandContext(projectId, selectedProduct)
    const systemPrompt = buildScriptSystemPrompt()

    // Process topics with controlled concurrency (2 at a time)
    const CONCURRENCY = 2
    let completed = 0

    for (let i = 0; i < topics.length; i += CONCURRENCY) {
      const batch = topics.slice(i, i + CONCURRENCY)

      await Promise.all(
        batch.map(async (topic) => {
          try {
            sendSSEEvent(res, 'topic_start', {
              topicId: topic.id,
              title: topic.title,
              progress: completed + 1,
              total: topics.length
            })

            const topicData = `标题：${topic.title}
切角：${topic.angle}
目标受众：${topic.persona}
平台：${topic.platform}
预计时长：${topic.estimated_duration}秒
行动号召：${topic.cta}`

            // Generate A and B variants with automatic retry on failure
            const variantResults = await Promise.allSettled(
              (['A', 'B'] as const).map(async (variant) => {
                const result = await generateScriptWithRetry(
                  systemPrompt,
                  topicData,
                  variant,
                  brandContext,
                  projectId,
                  topic.id,
                  topic.title,
                  res,
                  2 // maxRetries
                )

                if (!result.success) {
                  throw new Error(`Script ${variant} generation failed after ${result.retries} retries: ${result.error}`)
                }

                return { variant, success: result.success, retries: result.retries }
              })
            )

            // Check for failed variants and collect retry statistics
            const failedVariants: ('A' | 'B')[] = []
            let totalRetries = 0

            variantResults.forEach((result, index) => {
              const variant: 'A' | 'B' = index === 0 ? 'A' : 'B'
              if (result.status === 'rejected') {
                failedVariants.push(variant)
                console.error(`[Batch] Variant ${variant} for topic ${topic.id} failed:`, result.reason)
              } else if (result.status === 'fulfilled') {
                totalRetries += result.value.retries || 0
              }
            })

            // Mark topic as selected only if at least one variant succeeded
            const successCount = variantResults.filter(r => r.status === 'fulfilled').length
            if (successCount > 0) {
              topicRepo.update(topic.id, { selected: true })
            }

            // Send partial failure event if any variant failed
            if (failedVariants.length > 0) {
              sendSSEEvent(res, 'script_partial_failure', {
                topicId: topic.id,
                title: topic.title,
                failedVariants,
                successCount,
                totalRetries,
                message: `${topic.title} - ${failedVariants.join('/')}版本生成失败（共重试${totalRetries}次）`
              })
            } else if (totalRetries > 0) {
              // All succeeded but with retries - log it
              console.log(`[Batch] Topic ${topic.id} completed successfully with ${totalRetries} total retries`)
            }

            completed++
            sendSSEEvent(res, 'topic_complete', {
              topicId: topic.id,
              title: topic.title,
              progress: completed,
              total: topics.length,
              failedVariants: failedVariants.length > 0 ? failedVariants : undefined
            })
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            sendSSEEvent(res, 'topic_error', {
              topicId: topic.id,
              title: topic.title,
              error: message
            })
          }
        })
      )
    }

    // Log batch generation with actual script count
    const totalScripts = scriptRepo.findByProject(projectId).filter(s =>
      topicIds.includes(s.topic_id)
    ).length

    logRepo.create(projectId, 'script',
      `批量生成脚本：${topics.length}个选题（共${totalScripts}个脚本）`
    )

    sendSSEEvent(res, 'batch_complete', {
      message: `批量生成完成：${completed}/${topics.length}个选题`,
      completed,
      total: topics.length
    })
    closeSSE(res)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    sendSSEEvent(res, 'error', { message })
    closeSSE(res)
  }
}
