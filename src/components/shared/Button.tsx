import React, { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'ai'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  // Primary - Linear Purple (#5E6AD2)
  primary: 'bg-[#5E6AD2] hover:bg-[#7B85DB] active:bg-[#4A55B8] text-white border-none',
  // Secondary - 适配明暗主题（深色文字在浅色背景，浅色文字在深色背景）
  secondary: 'bg-transparent hover:bg-[var(--color-bg-elevated-2)] active:bg-[var(--color-bg-elevated-3)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-border-light)]',
  // Danger
  danger: 'bg-[#EF4444] hover:bg-[#DC2626] active:bg-[#B91C1C] text-white border-none',
  // Ghost - Linear style
  ghost: 'bg-transparent hover:bg-[var(--color-bg-elevated-2)] active:bg-[var(--color-bg-elevated-3)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-none',
  // Outline
  outline: 'bg-transparent hover:bg-[rgba(94,106,210,0.1)] active:bg-[rgba(94,106,210,0.2)] text-[#5E6AD2] hover:text-[#7B85DB] border border-[#5E6AD2]/50 hover:border-[#7B85DB]',
  // AI Gradient - 紫→青渐变
  ai: 'bg-gradient-to-br from-[#5E6AD2] to-[#06B6D4] hover:from-[#7B85DB] hover:to-[#22D3EE] text-white border-none shadow-md shadow-[#5E6AD2]/30'
}

const sizeClasses: Record<Size, string> = {
  // Linear风格：更紧凑的尺寸
  xs: 'px-2.5 py-1 text-xs gap-1 rounded',          // 28px高, 4px圆角
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-md',      // 34px高, 6px圆角
  md: 'px-4 py-2.5 text-sm gap-2 rounded-md',        // 38px高, 6px圆角 ⭐ Linear标准
  lg: 'px-5 py-3 text-base gap-2.5 rounded-lg'       // 46px高, 8px圆角
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  className = '',
  onClick,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  const isDisabled = disabled || loading

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled && buttonRef.current) {
      // Add ripple effect
      const rect = buttonRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()

      setRipples(prev => [...prev, { x, y, id }])

      // Remove ripple after animation (Linear: 300ms快速反馈)
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, 300)
    }

    onClick?.(e)
  }

  return (
    <button
      ref={buttonRef}
      disabled={isDisabled}
      onClick={handleClick}
      className={[
        // Base styles
        'relative inline-flex items-center justify-center font-semibold overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E6AD2] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'select-none transition-all duration-100',
        // Variant & size
        variantClasses[variant],
        sizeClasses[size],
        // Interactive states (Linear风格：NO translateY，只用scale)
        isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer active:scale-[0.98]',
        className
      ].join(' ')}
      {...props}
    >
      {/* Ripple effects (Linear风格：更快的反馈) */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute w-2 h-2 bg-white/20 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
            animation: 'button-ripple 300ms ease-out'
          }}
        />
      ))}

      {/* Content */}
      <span className="relative flex items-center gap-inherit">
        {loading ? (
          <Loader2 className="animate-spinner" size={size === 'lg' ? 18 : size === 'xs' ? 12 : 15} />
        ) : icon}
        {children}
        {!loading && iconRight}
      </span>
    </button>
  )
}
