/**
 * @deprecated Since v2.2.0 - Use useUIStore() from store/ui.store.ts instead
 *
 * Migration Guide:
 * ```tsx
 * // Old (deprecated):
 * import { useTheme } from './contexts/ThemeContext'
 * const { theme, toggleTheme, setTheme } = useTheme()
 *
 * // New (recommended):
 * import { useUIStore } from './store/ui.store'
 * const { theme, toggleTheme, setTheme } = useUIStore()
 * ```
 *
 * This context will be removed in v2.4.0. Please migrate to UIStore.
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'theme-preference'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
      const preferredTheme = savedTheme || 'light'
      setThemeState(preferredTheme)
      document.documentElement.setAttribute('data-theme', preferredTheme)
      setMounted(true)
    }
  }, [])

  // Apply theme to document when it changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
