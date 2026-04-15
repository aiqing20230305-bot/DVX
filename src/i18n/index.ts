import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import zhCN_common from './locales/zh-CN/common.json'
import zhCN_pages from './locales/zh-CN/pages.json'
import zhCN_components from './locales/zh-CN/components.json'
import zhCN_messages from './locales/zh-CN/messages.json'

import enUS_common from './locales/en-US/common.json'
import enUS_pages from './locales/en-US/pages.json'
import enUS_components from './locales/en-US/components.json'
import enUS_messages from './locales/en-US/messages.json'

// v2.11.0 Phase 4: i18n framework integration
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize
  .init({
    resources: {
      'zh-CN': {
        common: zhCN_common,
        pages: zhCN_pages,
        components: zhCN_components,
        messages: zhCN_messages
      },
      'en-US': {
        common: enUS_common,
        pages: enUS_pages,
        components: enUS_components,
        messages: enUS_messages
      }
    },
    fallbackLng: 'zh-CN',
    defaultNS: 'common',
    ns: ['common', 'pages', 'components', 'messages'],

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    interpolation: {
      escapeValue: false // React already protects from XSS
    },

    react: {
      useSuspense: false
    }
  })

export default i18n
