import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from './Button.js'

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-900/20 border border-red-700/40 mb-4">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2329] mb-2">出错了</h1>
          <p className="text-[#646A73] text-sm">应用遇到了意外错误，我们已记录此问题</p>
        </div>

        <div className="bg-[#F2F3F5] border border-[#F7F8FA] rounded-xl p-4 mb-6">
          <div className="text-xs text-[#8F959E] mb-2">错误详情</div>
          <div className="text-sm text-red-400 font-mono break-all">
            {error.message || '未知错误'}
          </div>
          {error.stack && (
            <details className="mt-3">
              <summary className="text-xs text-[#C9CDD4] cursor-pointer hover:text-[#8F959E]">
                查看堆栈跟踪
              </summary>
              <pre className="mt-2 text-xs text-[#C9CDD4] overflow-x-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={resetError}
            icon={<RefreshCw size={15} />}
            className="flex-1"
          >
            重试
          </Button>
          <Button
            onClick={handleGoHome}
            variant="secondary"
            icon={<Home size={15} />}
            className="flex-1"
          >
            返回首页
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#C9CDD4]">
            如果问题持续出现，请联系技术支持
          </p>
        </div>
      </div>
    </div>
  )
}
