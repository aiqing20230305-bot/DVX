import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from '../store/toast.store.js'

/**
 * Keyboard shortcuts hook
 *
 * Supported shortcuts:
 * - 1-6: Navigate to pages (Workbench, Insights, Topics, Scripts, Report, KB)
 * - Esc: Go back / Cancel
 * - ?: Show shortcuts help
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when user is typing in input fields
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Page navigation (1-6)
      if (e.key >= '1' && e.key <= '6' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()

        const routes = [
          '/',           // 1: Workbench
          '/insights',   // 2: Insights
          '/topics',     // 3: Topics
          '/scripts',    // 4: Scripts
          '/report',     // 5: Report
          '/kb'          // 6: Knowledge Base
        ]

        const targetRoute = routes[parseInt(e.key) - 1]
        if (targetRoute && location.pathname !== targetRoute) {
          navigate(targetRoute)

          // Show toast feedback
          const pageNames = ['数据工作台', '洞察引擎', '选题策划', '脚本创作', '战略报告', '知识库']
          toast.success('快捷导航', `已切换到 ${pageNames[parseInt(e.key) - 1]}`)
        }
        return
      }

      // Esc: Go back
      if (e.key === 'Escape') {
        // If not on home page, go back
        if (location.pathname !== '/') {
          e.preventDefault()
          navigate(-1)
        }
        return
      }

      // ?: Show shortcuts help
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault()
        showShortcutsHelp()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, location])
}

function showShortcutsHelp() {
  toast.info(
    '键盘快捷键',
    `1-6: 切换页面  |  Esc: 返回  |  ?: 查看此帮助`,
    6000 // Show for 6 seconds
  )
}
