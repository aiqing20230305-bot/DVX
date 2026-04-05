import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'
type ActiveStep = 'workbench' | 'insights' | 'topics' | 'scripts' | 'report' | 'kb'

interface UIStore {
  theme: Theme
  sidebarCollapsed: boolean
  activeStep: ActiveStep
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setActiveStep: (step: ActiveStep) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      activeStep: 'workbench',

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },

      toggleTheme: () => {
        set(state => {
          const theme: Theme = state.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.classList.toggle('dark', theme === 'dark')
          return { theme }
        })
      },

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setActiveStep: (step) => set({ activeStep: step })
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed })
    }
  )
)
