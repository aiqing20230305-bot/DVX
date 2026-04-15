import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { toast } from '../store/toast.store'
import { Input } from '../components/shared/Input'
import { Button } from '../components/shared/Button'
import { LogIn, Sparkles } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    // v2.11.0 Phase 3.2: WCAG 3.3.3 - Provide specific, actionable error messages
    if (!formData.email) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址，格式如：example@company.com'
    }

    if (!formData.password) {
      newErrors.password = '请输入登录密码'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await login(formData.email, formData.password)
      toast.success('登录成功')
      navigate('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-[#5E6AD2]" />
            <h1 className="text-3xl font-bold text-white">超级洞察</h1>
          </div>
          <p className="text-[#A3A3A3]">AI内容策略平台</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">登录</h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#FFFFFF] mb-2">
                邮箱 <span className="text-red-400" aria-label="必填项">*</span>
              </label>
              <Input
                id="login-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="请输入邮箱"
                required
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[#FFFFFF] mb-2">
                密码 <span className="text-red-400" aria-label="必填项">*</span>
              </label>
              <Input
                id="login-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="请输入密码"
                required
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p id="password-error" className="text-red-500 text-sm mt-1" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between">
              <label htmlFor="remember-me" className="flex items-center gap-2 text-sm text-[#A3A3A3] hover:text-white cursor-pointer">
                <input id="remember-me" type="checkbox" className="rounded" />
                记住我
              </label>
              <a href="#" className="text-sm text-[#5E6AD2] hover:text-[#8B85FF]">
                忘记密码？
              </a>
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
                  登录中...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  登录
                </div>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <span className="text-[#A3A3A3]">还没有账号？</span>
            {' '}
            <Link to="/register" className="text-[#5E6AD2] hover:text-[#8B85FF] font-medium">
              立即注册
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
