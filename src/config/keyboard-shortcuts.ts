/**
 * 键盘快捷键配置
 * v2.15.0 Phase 2.1: 全局快捷键帮助系统
 */

export interface KeyboardShortcut {
  key: string
  mac: string
  windows: string
  description: string
  category: 'global' | 'scripts' | 'templates' | 'insights' | 'topics' | 'workbench'
}

export const keyboardShortcuts: KeyboardShortcut[] = [
  // 全局快捷键
  {
    key: '?',
    mac: '?',
    windows: '?',
    description: '打开快捷键帮助',
    category: 'global',
  },
  {
    key: 'Escape',
    mac: 'Esc',
    windows: 'Esc',
    description: '关闭弹窗/取消操作',
    category: 'global',
  },

  // Scripts 页面快捷键
  {
    key: 'Cmd+S',
    mac: '⌘S',
    windows: 'Ctrl+S',
    description: '保存为模板',
    category: 'scripts',
  },
  {
    key: 'Cmd+E',
    mac: '⌘E',
    windows: 'Ctrl+E',
    description: '编辑脚本',
    category: 'scripts',
  },
  {
    key: 'Cmd+Shift+E',
    mac: '⌘⇧E',
    windows: 'Ctrl+Shift+E',
    description: '切换导出菜单',
    category: 'scripts',
  },
  {
    key: 'Cmd+Delete',
    mac: '⌘⌫',
    windows: 'Ctrl+Del',
    description: '删除脚本',
    category: 'scripts',
  },
  {
    key: 'Cmd+H',
    mac: '⌘H',
    windows: 'Ctrl+H',
    description: '版本历史',
    category: 'scripts',
  },

  // Templates 页面快捷键
  {
    key: 'Cmd+N',
    mac: '⌘N',
    windows: 'Ctrl+N',
    description: '创建新模板',
    category: 'templates',
  },
  {
    key: 'Cmd+K',
    mac: '⌘K',
    windows: 'Ctrl+K',
    description: '快速搜索',
    category: 'templates',
  },

  // Insights 页面快捷键
  {
    key: 'Cmd+A',
    mac: '⌘A',
    windows: 'Ctrl+A',
    description: '全选洞察',
    category: 'insights',
  },
  {
    key: 'Space',
    mac: 'Space',
    windows: 'Space',
    description: '选择/取消选择',
    category: 'insights',
  },

  // Topics 页面快捷键
  {
    key: 'Cmd+A',
    mac: '⌘A',
    windows: 'Ctrl+A',
    description: '全选选题',
    category: 'topics',
  },
  {
    key: 'Space',
    mac: 'Space',
    windows: 'Space',
    description: '选择/取消选择',
    category: 'topics',
  },

  // Workbench 页面快捷键
  {
    key: 'Cmd+U',
    mac: '⌘U',
    windows: 'Ctrl+U',
    description: '上传文件',
    category: 'workbench',
  },
]

export const categoryLabels: Record<KeyboardShortcut['category'], string> = {
  global: '全局',
  scripts: '脚本创作',
  templates: '模板管理',
  insights: '洞察生成',
  topics: '选题策划',
  workbench: '数据上传',
}

/**
 * 根据平台获取快捷键显示文本
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const isMac = navigator.platform.includes('Mac')
  return isMac ? shortcut.mac : shortcut.windows
}

/**
 * 根据分类获取快捷键
 */
export function getShortcutsByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
  return keyboardShortcuts.filter(s => s.category === category)
}

/**
 * 搜索快捷键
 */
export function searchShortcuts(query: string): KeyboardShortcut[] {
  const lowerQuery = query.toLowerCase()
  return keyboardShortcuts.filter(s =>
    s.description.toLowerCase().includes(lowerQuery) ||
    s.key.toLowerCase().includes(lowerQuery) ||
    s.mac.toLowerCase().includes(lowerQuery) ||
    s.windows.toLowerCase().includes(lowerQuery)
  )
}
