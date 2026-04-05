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
  primary: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-600 text-white border border-indigo-500 hover:border-indigo-400 shadow-sm shadow-indigo-900/50 hover:shadow-md hover:shadow-indigo-900/60',
  secondary: 'bg-slate-700 hover:bg-slate-600 active:bg-slate-700 text-slate-100 border border-slate-600 hover:border-slate-500',
  danger: 'bg-red-600 hover:bg-red-500 active:bg-red-600 text-white border border-red-500 hover:border-red-400 shadow-sm shadow-red-900/50',
  ghost: 'bg-transparent hover:bg-slate-800/80 active:bg-slate-800 text-slate-300 hover:text-slate-200 border border-transparent hover:border-slate-700',
  outline: 'bg-transparent hover:bg-indigo-600/10 active:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-600/50 hover:border-indigo-500'
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
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
