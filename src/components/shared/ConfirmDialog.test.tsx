import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  }

  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders dialog when open', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
    expect(screen.getByText('确认')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

    const confirmButton = screen.getByText('确认')
    fireEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when backdrop clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    const backdrop = screen.getByText('Confirm Action').closest('.fixed')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(onCancel).toHaveBeenCalledTimes(1)
    }
  })

  it('does not close when dialog content clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    const dialogContent = screen.getByText('Confirm Action').closest('.bg-slate-800')
    if (dialogContent) {
      fireEvent.click(dialogContent)
      expect(onCancel).not.toHaveBeenCalled()
    }
  })

  it('shows danger icon when danger prop is true', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} danger />)

    const dangerIcon = container.querySelector('.text-red-500')
    expect(dangerIcon).toBeInTheDocument()
  })

  it('applies danger styling to confirm button when danger is true', () => {
    render(<ConfirmDialog {...defaultProps} danger />)

    const confirmButton = screen.getByText('确认')
    expect(confirmButton).toHaveClass('bg-red-600')
  })

  it('applies normal styling to confirm button when danger is false', () => {
    render(<ConfirmDialog {...defaultProps} danger={false} />)

    const confirmButton = screen.getByText('确认')
    expect(confirmButton).toHaveClass('bg-indigo-600')
  })

  it('renders title and message correctly', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        title="Delete Project"
        message="This action cannot be undone. Are you sure?"
      />
    )

    expect(screen.getByText('Delete Project')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone. Are you sure?')).toBeInTheDocument()
  })
})
