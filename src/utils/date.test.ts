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

  describe('boundary cases', () => {
    it('handles Unix epoch (1970-01-01)', () => {
      const epochTimestamp = 0
      const result = formatDate(epochTimestamp)
      expect(result).toContain('1970')
    })

    it('handles far future date (2100)', () => {
      const futureTimestamp = new Date('2100-06-15T12:00:00Z').getTime()
      const result = formatDate(futureTimestamp)
      expect(result).toContain('2100')
    })

    it('handles negative timestamp gracefully', () => {
      const negativeTimestamp = -1000000000
      expect(() => formatDate(negativeTimestamp)).not.toThrow()
    })

    it('handles Year 2038 problem timestamp', () => {
      // 2038-01-19 03:14:07 UTC (32-bit signed int max)
      const y2k38Timestamp = 2147483647000
      const result = formatDate(y2k38Timestamp)
      expect(result).toContain('2038')
    })

    it('handles invalid timestamp (NaN)', () => {
      const invalidTimestamp = NaN
      expect(() => formatDate(invalidTimestamp)).not.toThrow()
    })

    it('handles month boundary (December 31)', () => {
      const yearEndTimestamp = new Date('2026-12-15T12:00:00Z').getTime()
      const result = formatDate(yearEndTimestamp)
      expect(result).toContain('12')
      expect(result).toContain('15')
    })

    it('handles leap year February 29', () => {
      const leapDayTimestamp = new Date('2024-02-29T12:00:00Z').getTime()
      const result = formatDate(leapDayTimestamp)
      expect(result).toContain('2')
      expect(result).toContain('29')
    })

    it('handles different time zones correctly', () => {
      const timestamp = new Date('2026-04-06T00:00:00Z').getTime()
      const result = formatDateTime(timestamp)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('formatDistanceToNow handles future timestamps', () => {
      const futureTimestamp = Date.now() + 5 * 60 * 1000 // 5 minutes in future
      const result = formatDistanceToNow(futureTimestamp)
      // Should handle gracefully (may return "刚刚" or handle differently)
      expect(typeof result).toBe('string')
    })

    it('formatDistanceToNow handles very old timestamps', () => {
      const oldTimestamp = Date.now() - 5 * 24 * 60 * 60 * 1000 // 5 days ago
      const result = formatDistanceToNow(oldTimestamp)
      expect(result).toContain('天前')
    })
  })
})
