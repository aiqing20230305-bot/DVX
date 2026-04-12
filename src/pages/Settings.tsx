import { useState } from 'react'
import { NotificationSettingsPanel } from '../components/settings/NotificationSettingsPanel'
import { User, Bell } from 'lucide-react'

type SettingsTab = 'notifications' | 'account'

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications')

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">账号设置</h1>
        <p className="text-gray-600 dark:text-gray-400">管理您的个人设置和偏好</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 mb-8">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Bell className="w-5 h-5" />
          通知设置
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
            activeTab === 'account'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <User className="w-5 h-5" />
          账号信息
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'notifications' && <NotificationSettingsPanel />}
        {activeTab === 'account' && (
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">账号信息</h3>
            <p className="text-gray-600 dark:text-gray-400">账号信息功能即将上线...</p>
          </div>
        )}
      </div>
    </div>
  )
}
