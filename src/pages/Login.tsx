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

    if (!formData.email) {
      newErrors.email = '请输入邮箱'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="请输入密码"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#A3A3A3] hover:text-white cursor-pointer">
                <input type="checkbox" className="rounded" />
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
