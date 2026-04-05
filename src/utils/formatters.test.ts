import { describe, it, expect } from 'vitest'
import { formatNumber, formatDate, truncateText } from './formatters'

describe('formatNumber', () => {
  it('formats numbers with thousand separators', () => {
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1000000)).toBe('1,000,000')
    expect(formatNumber(999)).toBe('999')
  })

  it('handles zero and negative numbers', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(-1000)).toBe('-1,000')
  })
})

describe('formatDate', () => {
  it('formats date to YYYY-MM-DD', () => {
    const date = new Date('2026-04-06T12:00:00Z')
    expect(formatDate(date)).toBe('2026-04-06')
  })
})

describe('truncateText', () => {
  it('truncates long text', () => {
    const text = 'This is a very long text that needs to be truncated'
    expect(truncateText(text, 10)).toBe('This is a ...')
  })

  it('does not truncate short text', () => {
    const text = 'Short'
    expect(truncateText(text, 10)).toBe('Short')
  })
})
