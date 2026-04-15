import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

// v2.11.0 Phase 4: Language switcher component
export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'zh-CN', name: '中文' },
    { code: 'en-US', name: 'English' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--color-bg-elevated-2)] text-[var(--color-text-secondary)]"
        aria-label="切换语言 / Change Language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={18} />
        <span className="text-sm">{currentLanguage.name}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 py-2 w-32 rounded-lg shadow-lg z-50"
          style={{
            backgroundColor: 'var(--color-bg-elevated-3)',
            border: '1px solid var(--color-border)'
          }}
          role="menu"
          aria-orientation="vertical"
        >
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={[
                'w-full text-left px-4 py-2 text-sm transition-colors',
                i18n.language === lang.code
                  ? 'bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)]'
                  : 'hover:bg-[var(--color-bg-elevated-2)] text-[var(--color-text-primary)]'
              ].join(' ')}
              role="menuitem"
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
