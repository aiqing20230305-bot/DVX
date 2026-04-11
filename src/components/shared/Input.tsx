import React, { InputHTMLAttributes, forwardRef, useState } from 'react'
import { LucideIcon, AlertCircle } from 'lucide-react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  success?: boolean
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  onRightIconClick?: () => void
  helperText?: string
  size?: 'sm' | 'md' | 'lg'
  borderless?: boolean  // Linear风格无边框输入
  floatingLabel?: boolean  // Phase 3.2: 浮动标签（在focus或有值时向上浮动）
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
      borderless = false,
      floatingLabel = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue)

    // Phase 3.2: 浮动标签激活条件
    const isLabelFloating = floatingLabel && (isFocused || hasValue)

    // 设计系统v2.0 - Linear风格尺寸
    const sizeClasses = {
      sm: 'text-sm py-1.5',           // 34px高
      md: 'text-sm py-2.5',            // 38px高 ⭐ Linear标准
      lg: 'text-base py-3'             // 46px高
    }

    const paddingClasses = {
      left: LeftIcon ? 'pl-9' : (borderless ? 'pl-1' : 'pl-3'),
      right: RightIcon ? 'pr-9' : (borderless ? 'pr-1' : 'pr-3')
    }

    // 背景和边框样式（明亮主题）
    const bgColor = borderless ? 'transparent' : 'var(--color-bg-elevated-1)'
    const borderColor = error
      ? 'var(--color-error)'
      : success
        ? 'var(--color-success)'
        : isFocused
          ? 'var(--color-primary)'
          : 'var(--color-border)'
    const textColor = 'var(--color-text-primary)'
    const placeholderColor = 'var(--color-text-tertiary)'

    return (
      <div className="w-full">
        {/* Input Container (Phase 3.2: 浮动标签需要包含label) */}
        <div className={`relative ${floatingLabel ? 'pt-2' : ''}`}>
          {/* Label - 两种模式 */}
          {label && !floatingLabel && (
            <label
              className="block mb-1.5 text-sm font-medium transition-colors duration-100"
              style={{
                color: error
                  ? 'var(--color-error)'
                  : success
                    ? 'var(--color-success)'
                    : isFocused
                      ? 'var(--color-primary)'
                      : 'var(--color-text-secondary)'
              }}
            >
              {label}
            </label>
          )}

          {/* Floating Label (Phase 3.2) */}
          {label && floatingLabel && (
            <label
              className="absolute left-3 transition-all duration-150 pointer-events-none"
              style={{
                top: isLabelFloating ? '-8px' : '50%',
                transform: isLabelFloating ? 'translateY(0) scale(0.85)' : 'translateY(-50%)',
                transformOrigin: 'left',
                fontSize: isLabelFloating ? '12px' : '14px',
                backgroundColor: isLabelFloating ? 'var(--color-bg-elevated-1)' : 'transparent',
                padding: isLabelFloating ? '0 4px' : '0',
                color: error
                  ? 'var(--color-error)'
                  : isLabelFloating
                    ? 'var(--color-primary)'
                    : 'var(--color-text-tertiary)'
              }}
            >
              {label}
            </label>
          )}
          {/* Left Icon */}
          {LeftIcon && (
            <LeftIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-100"
              style={{
                color: error
                  ? 'var(--color-error)'
                  : success
                    ? 'var(--color-success)'
                    : isFocused
                      ? 'var(--color-primary)'
                      : 'var(--color-text-tertiary)'
              }}
            />
          )}

          {/* Input (设计系统v2.1 - 明亮主题) */}
          <input
            ref={ref}
            disabled={disabled}
            className={`
              w-full ${paddingClasses.left} ${paddingClasses.right} ${sizeClasses[size]}
              ${borderless ? 'border-none border-b rounded-none px-1' : 'border rounded-md'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              focus:outline-none focus:ring-1
              transition-all duration-100
              ${className}
            `}
            style={{
              backgroundColor: bgColor,
              borderColor: borderColor,
              color: textColor,
              ...(isFocused && !borderless
                ? { boxShadow: `0 0 0 1px ${borderColor}` }
                : {})
            }}
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

          {/* Right Icon / Error Icon (Phase 3.2) */}
          {(RightIcon || error) && (
            <button
              type="button"
              onClick={onRightIconClick}
              disabled={disabled || error}
              className={`
                absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-100
                ${onRightIconClick && !error ? 'cursor-pointer' : 'cursor-default'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{
                color: error
                  ? 'var(--color-error)'
                  : success
                    ? 'var(--color-success)'
                    : 'var(--color-text-tertiary)'
              }}
              onMouseEnter={(e) => {
                if (onRightIconClick && !disabled && !error) {
                  e.currentTarget.style.color = 'var(--color-primary-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (onRightIconClick && !disabled && !error) {
                  e.currentTarget.style.color = error
                    ? 'var(--color-error)'
                    : success
                      ? 'var(--color-success)'
                      : 'var(--color-text-tertiary)';
                }
              }}
              tabIndex={-1}
            >
              {error ? <AlertCircle size={16} /> : RightIcon && <RightIcon size={16} />}
            </button>
          )}
        </div>

        {/* Helper Text / Error Message */}
        {(helperText || error) && (
          <p
            className={`mt-1.5 text-xs transition-colors duration-100 ${error ? 'animate-shake' : ''}`}
            style={{
              color: error ? 'var(--color-error)' : 'var(--color-text-tertiary)'
            }}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
