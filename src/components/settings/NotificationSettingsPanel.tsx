import { useState, useEffect } from 'react'
import { useNotificationSettings, UpdateNotificationSettingsInput } from '../../hooks/useNotificationSettings'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { Bell, Mail, MessageSquare, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react'

export function NotificationSettingsPanel() {
  const { settings, loading, error, saving, update, clearError } = useNotificationSettings()

  // 本地状态（用于表单编辑）
  const [localSettings, setLocalSettings] = useState<UpdateNotificationSettingsInput>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 当设置加载完成后，初始化本地状态
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        email_enabled: settings.email_enabled,
        inapp_enabled: settings.inapp_enabled,
        mention_email: settings.mention_email,
        mention_inapp: settings.mention_inapp,
        reply_email: settings.reply_email,
        reply_inapp: settings.reply_inapp,
        approval_email: settings.approval_email,
        approval_inapp: settings.approval_inapp,
        system_email: settings.system_email,
        system_inapp: settings.system_inapp,
        frequency: settings.frequency
      })
    }
  }, [settings])

  // 处理保存
  const handleSave = async () => {
    const success = await update(localSettings)
    if (success) {
      setSuccessMessage('通知设置已保存')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  // 处理开关切换
  const handleToggle = (key: keyof UpdateNotificationSettingsInput) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // 处理频率选择
  const handleFrequencyChange = (frequency: 'realtime' | 'daily' | 'weekly') => {
    setLocalSettings(prev => ({
      ...prev,
      frequency
    }))
  }

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 成功提示 */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* 通知总开关 */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">通知总开关</h3>
        <div className="space-y-4">
          {/* 邮件通知总开关 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">邮件通知</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">接收邮件通知</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.email_enabled ?? false}
                onChange={() => handleToggle('email_enabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 站内通知总开关 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">站内通知</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">接收站内消息提醒</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.inapp_enabled ?? false}
                onChange={() => handleToggle('inapp_enabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* @提及通知 */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          @提及通知
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">邮件通知</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.mention_email ?? false}
                onChange={() => handleToggle('mention_email')}
                disabled={!localSettings.email_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">站内通知</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.mention_inapp ?? false}
                onChange={() => handleToggle('mention_inapp')}
                disabled={!localSettings.inapp_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 回复通知 */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          回复通知
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">邮件通知</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.reply_email ?? false}
                onChange={() => handleToggle('reply_email')}
                disabled={!localSettings.email_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">站内通知</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.reply_inapp ?? false}
                onChange={() => handleToggle('reply_inapp')}
                disabled={!localSettings.inapp_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 审批通知 */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          审批通知
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">邮件通知</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.approval_email ?? false}
                onChange={() => handleToggle('approval_email')}
                disabled={!localSettings.email_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">站内通知</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.approval_inapp ?? false}
                onChange={() => handleToggle('approval_inapp')}
                disabled={!localSettings.inapp_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 系统通知 */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          系统通知
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">邮件通知</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.system_email ?? false}
                onChange={() => handleToggle('system_email')}
                disabled={!localSettings.email_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300">站内通知</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.system_inapp ?? false}
                onChange={() => handleToggle('system_inapp')}
                disabled={!localSettings.inapp_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 通知频率 */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          通知频率
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="frequency"
              value="realtime"
              checked={localSettings.frequency === 'realtime'}
              onChange={() => handleFrequencyChange('realtime')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">实时通知</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">事件发生时立即通知</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="frequency"
              value="daily"
              checked={localSettings.frequency === 'daily'}
              onChange={() => handleFrequencyChange('daily')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">每日摘要</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">每天汇总一次发送（计划中）</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="frequency"
              value="weekly"
              checked={localSettings.frequency === 'weekly'}
              onChange={() => handleFrequencyChange('weekly')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">每周摘要</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">每周汇总一次发送（计划中）</p>
            </div>
          </label>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              保存中...
            </>
          ) : (
            '保存设置'
          )}
        </button>
      </div>
    </div>
  )
}
