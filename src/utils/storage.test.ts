import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { storage, persistFilters } from './storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('basic operations', () => {
    it('sets and gets string value', () => {
      storage.set('test', 'hello')
      expect(storage.get('test', '')).toBe('hello')
    })

    it('sets and gets object value', () => {
      const obj = { name: 'test', value: 123 }
      storage.set('obj', obj)
      expect(storage.get('obj', {})).toEqual(obj)
    })

    it('returns default value when key not found', () => {
      expect(storage.get('nonexistent', 'default')).toBe('default')
      expect(storage.get('missing', { fallback: true })).toEqual({ fallback: true })
    })

    it('removes value by key', () => {
      storage.set('temp', 'value')
      expect(storage.get('temp', null)).toBe('value')

      storage.remove('temp')
      expect(storage.get('temp', null)).toBeNull()
    })
  })

  describe('error handling', () => {
    it('handles JSON parse error gracefully', () => {
      // Manually set invalid JSON
      localStorage.setItem('super-insight:invalid', 'not-json{')

      const result = storage.get('invalid', 'fallback')
      expect(result).toBe('fallback')
    })

    it('handles localStorage.setItem quota error', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError')
      })

      // Should not throw, just warn
      expect(() => storage.set('test', 'value')).not.toThrow()

      setItemSpy.mockRestore()
    })
  })

  describe('clear functionality', () => {
    it('clears all prefixed keys', () => {
      storage.set('key1', 'value1')
      storage.set('key2', 'value2')
      localStorage.setItem('other-key', 'other-value')

      storage.clear()

      expect(storage.get('key1', null)).toBeNull()
      expect(storage.get('key2', null)).toBeNull()
      expect(localStorage.getItem('other-key')).toBe('other-value')
    })
  })

  describe('prefix isolation', () => {
    it('only operates on prefixed keys', () => {
      localStorage.setItem('unprefixed', 'value')

      expect(storage.get('unprefixed', 'default')).toBe('default')

      storage.remove('unprefixed')
      expect(localStorage.getItem('unprefixed')).toBe('value')
    })
  })
})

describe('persistFilters', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('save and load', () => {
    it('saves and loads filters for a page', () => {
      const filters = {
        search: 'test search',
        platform: 'douyin',
        priority: 'high',
        sortBy: 'created_at',
        sortOrder: 'asc' as const
      }

      persistFilters.save('insights', filters)
      const loaded = persistFilters.load('insights')

      expect(loaded).toEqual(filters)
    })

    it('returns null when filters not found', () => {
      const result = persistFilters.load('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('clear functionality', () => {
    it('clears filters for a specific page', () => {
      persistFilters.save('insights', { search: 'test' })
      persistFilters.save('topics', { search: 'other' })

      persistFilters.clear('insights')

      expect(persistFilters.load('insights')).toBeNull()
      expect(persistFilters.load('topics')).toEqual({ search: 'other' })
    })

    it('clears all page filters', () => {
      persistFilters.save('insights', { search: 'test1' })
      persistFilters.save('topics', { search: 'test2' })
      persistFilters.save('scripts', { search: 'test3' })

      persistFilters.clearAll()

      expect(persistFilters.load('insights')).toBeNull()
      expect(persistFilters.load('topics')).toBeNull()
      expect(persistFilters.load('scripts')).toBeNull()
    })
  })

  describe('data structure', () => {
    it('saves all filter properties', () => {
      const filters = {
        search: 'keyword',
        platform: 'douyin',
        priority: 'high',
        status: 'active',
        sortBy: 'priority',
        sortOrder: 'desc' as const
      }

      persistFilters.save('topics', filters)
      const loaded = persistFilters.load('topics')

      expect(loaded).toHaveProperty('search', 'keyword')
      expect(loaded).toHaveProperty('platform', 'douyin')
      expect(loaded).toHaveProperty('priority', 'high')
      expect(loaded).toHaveProperty('status', 'active')
      expect(loaded).toHaveProperty('sortBy', 'priority')
      expect(loaded).toHaveProperty('sortOrder', 'desc')
    })

    it('handles partial filter data', () => {
      const partial = { search: 'test' }
      persistFilters.save('insights', partial)

      const loaded = persistFilters.load('insights')
      expect(loaded).toEqual({ search: 'test' })
    })
  })
})
