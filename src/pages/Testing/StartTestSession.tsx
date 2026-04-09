import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTestingStore } from '../../store/testing.store.js'
import { ArrowLeft, PlayCircle } from 'lucide-react'
import { toast } from '../../store/toast.store.js'

const TEST_SCENARIOS = [
  { id: 'scenario1', name: '场景1：新用户初次使用', description: '验证新用户能否独立完成首次任务' },
  { id: 'scenario2', name: '场景2：日常工作流程', description: '测试日常工作效率和满意度' },
  { id: 'scenario3', name: '场景3：高级功能使用', description: '评估高级功能的可发现性和价值' },
  { id: 'scenario4', name: '场景4：批量操作场景', description: '验证批量操作的效率提升' }
]

export function StartTestSession() {
  const navigate = useNavigate()
  const { createSession } = useTestingStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    user_name: '',
    user_role: '',
    user_email: '',
    scenario: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.user_name || !formData.user_role || !formData.scenario) {
      toast.error('请填写必填项', '用户姓名、角色和测试场景为必填项')
      return
    }

    setLoading(true)
    try {
      const session = await createSession({
        user_name: formData.user_name,
        user_role: formData.user_role,
        user_email: formData.user_email || undefined,
        scenario: formData.scenario
      })

      toast.success('测试会话已创建', `会话ID: ${session.id}`)
      navigate(`/testing/session/${session.id}`)
    } catch (error) {
      toast.error('创建失败', '无法创建测试会话，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/testing')}
          className="p-2 hover:bg-[#F7F8FA] rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-[#646A73]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1F2329]">启动测试会话</h1>
          <p className="text-sm text-[#646A73] mt-1">创建新的用户测试会话</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-6 space-y-6">
        {/* User Name */}
        <div>
          <label className="block text-sm font-medium text-[#646A73] mb-2">
            用户姓名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.user_name}
            onChange={e => setFormData({ ...formData, user_name: e.target.value })}
            className="w-full px-4 py-2 bg-[#F2F3F5] border border-[#DEE0E3] rounded-lg text-[#1F2329] focus:outline-none focus:border-[#3370FF]"
            placeholder="请输入用户姓名"
          />
        </div>

        {/* User Role */}
        <div>
          <label className="block text-sm font-medium text-[#646A73] mb-2">
            用户角色 <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.user_role}
            onChange={e => setFormData({ ...formData, user_role: e.target.value })}
            className="w-full px-4 py-2 bg-[#F2F3F5] border border-[#DEE0E3] rounded-lg text-[#1F2329] focus:outline-none focus:border-[#3370FF]"
          >
            <option value="">请选择角色</option>
            <option value="内容策划">内容策划</option>
            <option value="短视频创作者">短视频创作者</option>
            <option value="营销人员">营销人员</option>
            <option value="新媒体运营">新媒体运营</option>
            <option value="产品经理">产品经理</option>
            <option value="其他">其他</option>
          </select>
        </div>

        {/* User Email */}
        <div>
          <label className="block text-sm font-medium text-[#646A73] mb-2">
            用户邮箱（可选）
          </label>
          <input
            type="email"
            value={formData.user_email}
            onChange={e => setFormData({ ...formData, user_email: e.target.value })}
            className="w-full px-4 py-2 bg-[#F2F3F5] border border-[#DEE0E3] rounded-lg text-[#1F2329] focus:outline-none focus:border-[#3370FF]"
            placeholder="用于后续联系（可选）"
          />
        </div>

        {/* Test Scenario */}
        <div>
          <label className="block text-sm font-medium text-[#646A73] mb-3">
            测试场景 <span className="text-red-400">*</span>
          </label>
          <div className="space-y-3">
            {TEST_SCENARIOS.map(scenario => (
              <label
                key={scenario.id}
                className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.scenario === scenario.name
                    ? 'border-[#3370FF] bg-[#3370FF]/10'
                    : 'border-[#DEE0E3] hover:border-[#C9CDD4] bg-[#F2F3F5]/50'
                }`}
              >
                <input
                  type="radio"
                  name="scenario"
                  value={scenario.name}
                  checked={formData.scenario === scenario.name}
                  onChange={e => setFormData({ ...formData, scenario: e.target.value })}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    formData.scenario === scenario.name
                      ? 'border-[#3370FF] bg-[#3370FF]'
                      : 'border-[#C9CDD4]'
                  }`}>
                    {formData.scenario === scenario.name && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-[#1F2329] font-medium mb-1">{scenario.name}</div>
                    <div className="text-[#646A73] text-sm">{scenario.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/testing')}
            className="px-5 py-2.5 bg-[#DEE0E3] hover:bg-[#C9CDD4] text-[#1F2329] rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#3370FF] hover:bg-[#1E4FD9] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayCircle size={18} />
            {loading ? '创建中...' : '开始测试'}
          </button>
        </div>
      </form>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="text-blue-400 font-medium mb-2">💡 测试提示</div>
        <ul className="text-blue-300/80 text-sm space-y-1 list-disc list-inside">
          <li>请确保测试用户信息准确，以便后续分析</li>
          <li>创建会话后，系统将自动记录用户的操作行为</li>
          <li>测试完成后，记得在会话详情页面填写测试笔记</li>
        </ul>
      </div>
    </div>
  )
}
