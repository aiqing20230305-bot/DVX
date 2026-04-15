import React, { useState } from 'react'
import { MessageSquare, X, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'

type FeedbackType = 'bug' | 'feature' | 'question' | 'praise' | 'other'

interface FeedbackData {
  type: FeedbackType
  description: string
  page: string
  userAgent: string
  timestamp: string
}

const feedbackTypeOptions: { value: FeedbackType; label: string; description: string }[] = [
  { value: 'bug', label: '🐛 Bug反馈', description: '遇到了错误或问题' },
  { value: 'feature', label: '💡 功能建议', description: '希望增加新功能' },
  { value: 'question', label: '❓ 使用疑问', description: '不确定如何使用' },
  { value: 'praise', label: '👍 表扬鼓励', description: '喜欢某个功能或体验' },
  { value: 'other', label: '💬 其他反馈', description: '其他想说的' }
]

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<FeedbackType>('bug')
  const [description, setDescription] = useState('')
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrorMessage('请填写反馈内容')
      return
    }

    setSubmitStatus('submitting')
    setErrorMessage('')

    const feedbackData: FeedbackData = {
      type: selectedType,
      description: description.trim(),
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      })

      if (!response.ok) {
        throw new Error('提交失败')
      }

      setSubmitStatus('success')

      // 2秒后自动关闭并重置
      setTimeout(() => {
        setIsOpen(false)
        setTimeout(() => {
          setDescription('')
          setSelectedType('bug')
          setSubmitStatus('idle')
        }, 300) // 等待关闭动画完成
      }, 2000)
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : '提交失败，请稍后重试')

      // 3秒后重置状态，允许重试
      setTimeout(() => {
        setSubmitStatus('idle')
        setErrorMessage('')
      }, 3000)
    }
  }

  const handleClose = () => {
    if (submitStatus === 'submitting') return // 提交中不允许关闭
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating Button - Fixed Bottom Right */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="反馈"
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          backgroundColor: '#5E6AD2',
          color: 'white',
          boxShadow: '0 4px 12px rgba(94, 106, 210, 0.4)'
        }}
      >
        <MessageSquare size={24} />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-enter"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-md border rounded-2xl modal-content-enter"
            style={{
              backgroundColor: 'var(--color-bg-elevated-3)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                反馈与建议
              </h2>
              <button
                onClick={handleClose}
                disabled={submitStatus === 'submitting'}
                aria-label="关闭"
                className="p-1.5 rounded-lg transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: 'var(--color-text-tertiary)' }}
                onMouseEnter={(e) => {
                  if (submitStatus !== 'submitting') {
                    e.currentTarget.style.color = 'var(--color-text-primary)'
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-tertiary)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* Success State */}
              {submitStatus === 'success' && (
                <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-scale-in" style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--color-success)'
                  }}>
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    反馈已提交
                  </h3>
                  <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    感谢您的反馈！我们会认真阅读并持续改进。
                  </p>
                </div>
              )}

              {/* Form */}
              {submitStatus !== 'success' && (
                <div className="space-y-4">
                  {/* Type Selection */}
                  <div>
                    <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      反馈类型
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {feedbackTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedType(option.value)}
                          disabled={submitStatus === 'submitting'}
                          className={[
                            'px-4 py-3 rounded-lg text-left transition-all duration-100',
                            'border disabled:opacity-50 disabled:cursor-not-allowed'
                          ].join(' ')}
                          style={{
                            backgroundColor: selectedType === option.value
                              ? 'var(--color-bg-elevated-2)'
                              : 'transparent',
                            borderColor: selectedType === option.value
                              ? '#5E6AD2'
                              : 'var(--color-border)',
                            color: 'var(--color-text-primary)'
                          }}
                        >
                          <div className="font-medium text-sm">{option.label}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      详细描述 <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={submitStatus === 'submitting'}
                      placeholder="请详细描述您的反馈..."
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated-1)',
                        borderColor: errorMessage ? 'var(--color-error)' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                      onFocus={(e) => {
                        if (!errorMessage) {
                          e.currentTarget.style.borderColor = '#5E6AD2'
                        }
                      }}
                      onBlur={(e) => {
                        if (!errorMessage) {
                          e.currentTarget.style.borderColor = 'var(--color-border)'
                        }
                      }}
                    />
                    {errorMessage && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--color-error)' }}>
                        <AlertCircle size={14} />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-elevated-1)' }}>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      💡 提示：详细的反馈能帮助我们更好地理解您的需求
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {submitStatus !== 'success' && (
              <div
                className="px-6 py-4 border-t flex justify-end gap-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  disabled={submitStatus === 'submitting'}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={submitStatus === 'submitting'}
                  icon={<Send size={16} />}
                  disabled={submitStatus === 'submitting'}
                >
                  {submitStatus === 'submitting' ? '提交中...' : '提交反馈'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
