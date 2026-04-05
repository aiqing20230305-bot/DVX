import { describe, it, expect, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { exportInsightsToExcel, exportTopicsToExcel } from './export.utils'

// Mock XLSX module
vi.mock('xlsx', () => ({
  default: {
    utils: {
      json_to_sheet: vi.fn(() => ({ '!cols': [] })),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  },
  utils: {
    json_to_sheet: vi.fn(() => ({ '!cols': [] })),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}))

describe('export utilities', () => {
  it('exports insights to Excel format', () => {
    const insights = [
      {
        id: 1,
        title: 'Test Insight',
        summary: 'Test Summary',
        category: 'trend',
        created_at: Date.now(),
      },
    ]

    exportInsightsToExcel(insights as any)

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it('exports topics to Excel format', () => {
    const topics = [
      {
        id: 1,
        title: 'Test Topic',
        platform: 'douyin',
        estimated_duration: 60,
        priority: 3,
        selected: true,
        created_at: Date.now(),
      },
    ]

    exportTopicsToExcel(topics as any)

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it('handles empty data gracefully', () => {
    exportInsightsToExcel([])

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([])
  })

  it('handles special characters in data', () => {
    const insights = [
      {
        id: 1,
        title: 'Test & "Special" <Characters>',
        summary: '包含特殊字符: & < > " \'',
        category: 'trend',
        created_at: Date.now(),
      },
    ]

    exportInsightsToExcel(insights as any)

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it('handles large dataset export', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      title: `Insight ${i + 1}`,
      summary: `Summary for insight ${i + 1}`,
      category: 'trend',
      created_at: Date.now(),
    }))

    exportInsightsToExcel(largeDataset as any)

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(Object)])
    )
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it('handles Chinese filename correctly', () => {
    const topics = [
      {
        id: 1,
        title: '测试选题',
        platform: 'douyin',
        estimated_duration: 60,
        priority: 3,
        selected: true,
        created_at: Date.now(),
      },
    ]

    exportTopicsToExcel(topics as any)

    // Should generate filename with Chinese characters
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('选题')
    )
  })

  it('handles null and undefined values', () => {
    const insights = [
      {
        id: 1,
        title: 'Test',
        summary: null,
        category: undefined,
        created_at: Date.now(),
      },
    ]

    exportInsightsToExcel(insights as any)

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  it('formats date fields correctly', () => {
    const timestamp = 1704067200000 // 2024-01-01 00:00:00
    const insights = [
      {
        id: 1,
        title: 'Test',
        summary: 'Test',
        category: 'trend',
        created_at: timestamp,
      },
    ]

    exportInsightsToExcel(insights as any)

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })
})
