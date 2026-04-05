/**
 * localStorage封装工具
 */

const STORAGE_PREFIX = 'super-insight:'

export const storage = {
  /**
   * 获取数据
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key)
      if (item === null) {
        return defaultValue
      }
      return JSON.parse(item) as T
    } catch (error) {
      console.warn(`Failed to get storage key "${key}":`, error)
      return defaultValue
    }
  },

  /**
   * 设置数据
   */
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Failed to set storage key "${key}":`, error)
    }
  },

  /**
   * 删除数据
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch (error) {
      console.warn(`Failed to remove storage key "${key}":`, error)
    }
  },

  /**
   * 清空所有数据
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear storage:', error)
    }
  }
}

/**
 * 筛选器持久化
 */
export interface PageFilters {
  search?: string
  platform?: string
  priority?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const persistFilters = {
  /**
   * 保存筛选器状态
   */
  save(page: string, filters: PageFilters): void {
    storage.set(`filters:${page}`, filters)
  },

  /**
   * 加载筛选器状态
   */
  load(page: string): PageFilters | null {
    return storage.get<PageFilters | null>(`filters:${page}`, null)
  },

  /**
   * 清除筛选器状态
   */
  clear(page: string): void {
    storage.remove(`filters:${page}`)
  },

  /**
   * 清除所有筛选器
   */
  clearAll(): void {
    const pages = ['insights', 'topics', 'scripts']
    pages.forEach(page => storage.remove(`filters:${page}`))
  }
}
