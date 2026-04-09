import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('完整工作流', () => {
  let projectId: string

  test.beforeAll(async ({ browser }) => {
    // 创建测试项目
    const page = await browser.newPage()
    await page.goto('/')
    await page.click('text=新建项目')
    await page.click('text=快消品')
    await page.fill('input[name="name"]', '工作流测试项目')
    await page.fill('input[name="brand"]', '测试品牌')
    await page.click('button:has-text("创建")')
    await page.waitForTimeout(2000)

    // 获取项目ID
    const url = page.url()
    projectId = url.split('/').pop() || ''

    await page.close()
  })

  test('完整流程：上传 → 洞察 → 选题 → 脚本', async ({ page }) => {
    // 1. 进入项目
    await page.goto(`/project/${projectId}`)
    await expect(page.locator('h1')).toBeVisible()

    // 2. 上传测试数据
    await page.click('text=数据工作台')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(process.cwd(), 'test-data', 'test-data.csv')
    await fileInput.setInputFiles(testFilePath)

    // 等待上传完成
    await expect(page.locator('text=解析完成')).toBeVisible({ timeout: 15000 })

    // 3. 生成洞察
    await page.click('text=洞察引擎')
    await page.click('button:has-text("生成洞察")')

    // 等待洞察生成完成（SSE流式输出）
    await expect(page.locator('.insight-card')).toBeVisible({ timeout: 30000 })

    // 验证至少生成了一条洞察
    const insightCount = await page.locator('.insight-card').count()
    expect(insightCount).toBeGreaterThan(0)

    // 选择第一条洞察
    await page.click('.insight-card:first-child')

    // 4. 生成选题
    await page.click('text=选题策划')
    await page.click('button:has-text("生成选题")')

    // 等待选题生成完成
    await expect(page.locator('.topic-card')).toBeVisible({ timeout: 30000 })

    // 验证至少生成了一个选题
    const topicCount = await page.locator('.topic-card').count()
    expect(topicCount).toBeGreaterThan(0)

    // 5. 生成脚本
    await page.click('.topic-card:first-child')
    await page.click('button:has-text("生成脚本")')

    // 等待脚本生成完成
    await expect(page.locator('text=版本A')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('text=版本B')).toBeVisible({ timeout: 30000 })

    // 验证脚本结构
    await expect(page.locator('text=Hook')).toBeVisible()
    await expect(page.locator('text=场景一')).toBeVisible()
  })

  test('应该能批量选择和导出洞察', async ({ page }) => {
    await page.goto(`/project/${projectId}/insights`)

    // 使用快捷键全选
    await page.keyboard.press('Control+A')

    // 验证选中状态
    const selectedCount = await page.locator('.insight-card.selected').count()
    expect(selectedCount).toBeGreaterThan(0)

    // 导出选中的洞察
    await page.keyboard.press('Control+E')

    // 等待下载
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.xlsx')
  })

  test('应该显示项目时间线', async ({ page }) => {
    await page.goto(`/project/${projectId}`)

    // 切换到时间线tab
    await page.click('text=时间线')

    // 验证时间线记录
    await expect(page.locator('.timeline-item')).toBeVisible()

    // 验证操作类型
    await expect(page.locator('text=创建项目')).toBeVisible()
    await expect(page.locator('text=上传文件')).toBeVisible()
    await expect(page.locator('text=生成洞察')).toBeVisible()
  })
})
