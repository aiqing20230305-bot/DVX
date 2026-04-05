import React, { InputHTMLAttributes, forwardRef, useState } from 'react'
import { LucideIcon } from 'lucide-react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  success?: boolean
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  onRightIconClick?: () => void
  helperText?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      helperText,
      size = 'md',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue)

    const sizeClasses = {
      sm: 'text-sm py-1.5',
      md: 'text-sm py-2',
      lg: 'text-base py-2.5'
    }

    const paddingClasses = {
      left: LeftIcon ? 'pl-9' : 'pl-3',
      right: RightIcon ? 'pr-9' : 'pr-3'
    }

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            className={`
              block mb-1.5 text-sm font-medium transition-colors duration-200
              ${error ? 'text-red-400' : success ? 'text-emerald-400' : isFocused ? 'text-indigo-400' : 'text-slate-300'}
            `}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {LeftIcon && (
            <LeftIcon
              size={16}
              className={`
                absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
                ${error ? 'text-red-400' : success ? 'text-emerald-400' : isFocused ? 'text-indigo-400' : 'text-slate-500'}
              `}
            />
          )}

          {/* Input */}
          <input
            ref={ref}
            disabled={disabled}
            className={`
              w-full ${paddingClasses.left} ${paddingClasses.right} ${sizeClasses[size]}
              rounded-lg bg-slate-800 text-slate-200 placeholder-slate-500
              border transition-all duration-200
              ${
                error
                  ? 'border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
                  : success
                    ? 'border-emerald-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              }
              ${isFocused ? 'shadow-lg shadow-indigo-500/10' : 'shadow-sm'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              focus:outline-none
              ${className}
            `}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            onChange={(e) => {
              setHasValue(!!e.target.value)
              props.onChange?.(e)
            }}
            {...props}
          />

          {/* Right Icon */}
          {RightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              disabled={disabled}
              className={`
                absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200
                ${onRightIconClick ? 'cursor-pointer hover:text-indigo-400' : 'cursor-default'}
                ${error ? 'text-red-400' : success ? 'text-emerald-400' : 'text-slate-500'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              tabIndex={-1}
            >
              <RightIcon size={16} />
            </button>
          )}
        </div>

        {/* Helper Text / Error Message */}
        {(helperText || error) && (
          <p
            className={`
              mt-1.5 text-xs transition-colors duration-200
              ${error ? 'text-red-400 animate-shake' : 'text-slate-500'}
            `}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
