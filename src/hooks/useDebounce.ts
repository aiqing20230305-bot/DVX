import { useState, useEffect } from 'react'

/**
 * 防抖Hook - 延迟更新值直到输入停止一段时间
 *
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒），默认300ms
 * @returns 防抖后的值
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('')
 * const debouncedSearchQuery = useDebounce(searchQuery, 300)
 *
 * // 只有当用户停止输入300ms后，debouncedSearchQuery才会更新
 * useEffect(() => {
 *   // 执行搜索
 * }, [debouncedSearchQuery])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
