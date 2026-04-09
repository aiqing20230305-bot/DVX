import { test, expect } from '@playwright/test'

test.describe('项目管理', () => {
  test('应该能创建新项目', async ({ page }) => {
    await page.goto('/')

    // 点击新建项目按钮
    await page.click('text=新建项目')

    // 等待模态框出现
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // 选择快消品模板
    await page.click('text=快消品')

    // 填写项目信息
    await page.fill('input[name="name"]', 'E2E测试项目')
    await page.fill('input[name="brand"]', '测试品牌')
    await page.fill('textarea[name="description"]', '这是一个E2E测试项目')

    // 提交表单
    await page.click('button:has-text("创建")')

    // 验证项目创建成功
    await expect(page.locator('text=E2E测试项目')).toBeVisible({ timeout: 10000 })
  })

  test('应该能查看项目详情', async ({ page }) => {
    await page.goto('/')

    // 假设已有项目，点击第一个项目
    await page.click('.project-card:first-child')

    // 验证跳转到项目详情页
    await expect(page).toHaveURL(/\/project\//)

    // 验证项目信息显示
    await expect(page.locator('h1')).toBeVisible()
  })

  test('应该显示项目统计信息', async ({ page }) => {
    await page.goto('/')

    // 点击第一个项目
    await page.click('.project-card:first-child')

    // 等待统计面板加载
    await expect(page.locator('text=文件数')).toBeVisible()
    await expect(page.locator('text=洞察数')).toBeVisible()
    await expect(page.locator('text=选题数')).toBeVisible()
  })
})
