import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl'
}

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />
      <div className={[
        'relative w-full border rounded-2xl',
        sizeClasses[size]
      ].join(' ')} style={{
        backgroundColor: 'var(--color-bg-elevated-3)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{
            borderColor: 'var(--color-border)'
          }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all duration-100"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-all duration-100 z-10"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t flex justify-end gap-3" style={{
            borderColor: 'var(--color-border)'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
