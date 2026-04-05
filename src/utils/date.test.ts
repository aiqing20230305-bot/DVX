import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDistanceToNow, formatDate, formatDateTime } from './date'

describe('date utilities', () => {
  beforeEach(() => {
    // Fix the current time for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-06T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatDistanceToNow', () => {
    it('formats recent time as "刚刚"', () => {
      const timestamp = Date.now() - 30 * 1000 // 30 seconds ago
      expect(formatDistanceToNow(timestamp)).toBe('刚刚')
    })

    it('formats minutes ago', () => {
      const timestamp = Date.now() - 5 * 60 * 1000 // 5 minutes ago
      expect(formatDistanceToNow(timestamp)).toBe('5分钟前')
    })

    it('formats hours ago', () => {
      const timestamp = Date.now() - 3 * 60 * 60 * 1000 // 3 hours ago
      expect(formatDistanceToNow(timestamp)).toBe('3小时前')
    })

    it('formats days ago', () => {
      const timestamp = Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
      expect(formatDistanceToNow(timestamp)).toBe('2天前')
    })
  })

  describe('formatDate', () => {
    it('formats date in Chinese locale', () => {
      const timestamp = new Date('2026-04-06T12:00:00Z').getTime()
      const result = formatDate(timestamp)
      expect(result).toContain('2026')
      expect(result).toContain('4')
      expect(result).toContain('6')
    })
  })

  describe('formatDateTime', () => {
    it('formats date and time in Chinese locale', () => {
      const timestamp = new Date('2026-04-06T12:00:00Z').getTime()
      const result = formatDateTime(timestamp)
      expect(result).toContain('2026')
      expect(result).toContain('4')
      expect(result).toContain('6')
    })
  })
})
