import React, { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#3370FF] hover:bg-[#1E4FD9] active:bg-[#3370FF] text-white border border-[#3370FF] hover:border-[#5B8EFF] shadow-sm shadow-[#3370FF]/30 hover:shadow-md hover:shadow-[#3370FF]/40',
  secondary: 'bg-[#F7F8FA] hover:bg-[#F2F3F5] active:bg-[#F7F8FA] text-[#1F2329] border border-[#DEE0E3] hover:border-[#E3E5E8]',
  danger: 'bg-[#EF4444] hover:bg-[#DC2626] active:bg-[#EF4444] text-white border border-[#EF4444] hover:border-[#F87171] shadow-sm shadow-[#EF4444]/30',
  ghost: 'bg-transparent hover:bg-[#F2F3F5] active:bg-[#F7F8FA] text-[#646A73] hover:text-[#1F2329] border border-transparent hover:border-[#DEE0E3]',
  outline: 'bg-transparent hover:bg-[#3370FF]/10 active:bg-[#3370FF]/20 text-[#3370FF] hover:text-[#5B8EFF] border border-[#3370FF]/50 hover:border-[#5B8EFF]'
}

const sizeClasses: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1 rounded-md',
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-5 py-2.5 text-base gap-2.5 rounded-xl'
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

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, 600)
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
        'relative inline-flex items-center justify-center font-medium overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3370FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]',
        'select-none transition-all duration-200',
        // Variant & size
        variantClasses[variant],
        sizeClasses[size],
        // Interactive states
        isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
        className
      ].join(' ')}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute w-2 h-2 bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
            animation: 'button-ripple 600ms ease-out'
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
