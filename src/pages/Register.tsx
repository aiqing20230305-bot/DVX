import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { toast } from '../store/toast.store'
import { Input } from '../components/shared/Input'
import { Button } from '../components/shared/Button'
import { UserPlus, Sparkles, Check, X } from 'lucide-react'

export function Register() {
  const navigate = useNavigate()
  const { register, loading } = useAuthStore()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPasswordStrength, setShowPasswordStrength] = useState(false)

  // Password strength calculator
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { score: 0, label: '', color: '' }
    if (password.length < 8) return { score: 1, label: '弱', color: 'text-red-500' }

    let score = 1
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 2) return { score, label: '弱', color: 'text-red-500' }
    if (score === 3) return { score, label: '中等', color: 'text-yellow-500' }
    return { score, label: '强', color: 'text-green-500' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name) {
      newErrors.name = '请输入姓名'
    } else if (formData.name.length < 2) {
      newErrors.name = '姓名至少2个字符'
    }

    if (!formData.email) {
      newErrors.email = '请输入邮箱'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少需要8个字符'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await register(formData.email, formData.password, formData.name)
      toast.success('注册成功，正在跳转...')
      // register function will auto-login, so just navigate
      setTimeout(() => navigate('/'), 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-[#635BFF]" />
            <h1 className="text-3xl font-bold text-white">超级洞察</h1>
          </div>
          <p className="text-[#A3A3A3]">AI内容策略平台</p>
        </div>

        {/* Register Card */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">注册</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                姓名
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入姓名"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                邮箱
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="请输入邮箱"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                密码
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setShowPasswordStrength(true)}
                placeholder="请输入密码（至少8个字符）"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}

              {/* Password Strength Indicator */}
              {showPasswordStrength && formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A3A3A3]">密码强度:</span>
                    <span className={`font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i <= passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? 'bg-red-500'
                              : passwordStrength.score === 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-[#333333]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center gap-1 text-[#A3A3A3]">
                      {formData.password.length >= 8 ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-red-500" />
                      )}
                      至少8个字符
                    </div>
                    <div className="flex items-center gap-1 text-[#A3A3A3]">
                      {/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-[#525252]" />
                      )}
                      包含大小写字母（推荐）
                    </div>
                    <div className="flex items-center gap-1 text-[#A3A3A3]">
                      {/\d/.test(formData.password) ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-[#525252]" />
                      )}
                      包含数字（推荐）
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                确认密码
              </label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="请再次输入密码"
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                required
                className="mt-1 rounded"
              />
              <span className="text-sm text-[#A3A3A3]">
                我已阅读并同意
                <a href="#" className="text-[#635BFF] hover:text-[#8B85FF]">服务条款</a>
                和
                <a href="#" className="text-[#635BFF] hover:text-[#8B85FF]">隐私政策</a>
              </span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  注册中...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  注册
                </div>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <span className="text-[#A3A3A3]">已有账号？</span>
            {' '}
            <Link to="/login" className="text-[#635BFF] hover:text-[#8B85FF] font-medium">
              立即登录
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#737373] text-sm mt-8">
          © 2026 特赞科技. All rights reserved.
        </p>
      </div>
    </div>
  )
}
