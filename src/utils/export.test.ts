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
})
