import React from 'react'
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
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-600 hover:border-indigo-500 shadow-sm shadow-indigo-900/30',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 hover:border-slate-500',
  danger: 'bg-red-600 hover:bg-red-500 text-white border border-red-600',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-transparent hover:border-slate-700',
  outline: 'bg-transparent hover:bg-slate-800 text-indigo-400 border border-indigo-600 hover:border-indigo-500'
}

const sizeClasses: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2'
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
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 select-none',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]',
        className
      ].join(' ')}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={size === 'lg' ? 18 : 15} /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}
