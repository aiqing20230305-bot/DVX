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
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      // Save current focused element
      previousFocusRef.current = document.activeElement as HTMLElement

      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'

      // Move focus to first interactive element in modal
      setTimeout(() => {
        const firstInteractive = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        firstInteractive?.focus()
      }, 100)
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''

      // Restore focus to previous element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-enter"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      {/* Phase 3.3: backdrop blur 8px + fade-in animation */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)' // Safari support
        }}
      />
      {/* Phase 3.3: Modal content with scale-fade entrance */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-label={!title ? '对话框' : undefined}
        className={[
          'relative w-full border rounded-2xl modal-content-enter',
          sizeClasses[size]
        ].join(' ')}
        style={{
          backgroundColor: 'var(--color-bg-elevated-3)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{
            borderColor: 'var(--color-border)'
          }}>
            <h2 id="modal-title" className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
            <button
              onClick={onClose}
              aria-label="关闭对话框"
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
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            aria-label="关闭对话框"
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
            <X size={18} aria-hidden="true" />
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
