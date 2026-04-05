import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast Component', () => {
  it('renders toast message', () => {
    const toast = {
      id: '1',
      type: 'success' as const,
      title: 'Success!',
      message: 'Operation completed',
    }
    render(<Toast toast={toast} onClose={() => {}} />)
    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Operation completed')).toBeInTheDocument()
  })

  it('applies type variant colors', () => {
    const successToast = {
      id: '1',
      type: 'success' as const,
      title: 'Success',
    }
    const { rerender, container } = render(
      <Toast toast={successToast} onClose={() => {}} />
    )
    expect(container.firstChild).toHaveClass('bg-emerald-900/90')

    const errorToast = {
      id: '2',
      type: 'error' as const,
      title: 'Error',
    }
    rerender(<Toast toast={errorToast} onClose={() => {}} />)
    expect(container.firstChild).toHaveClass('bg-red-900/90')
  })

  it('calls onClose when close button clicked', () => {
    vi.useFakeTimers()
    const handleClose = vi.fn()
    const toast = {
      id: '1',
      type: 'info' as const,
      title: 'Info',
    }
    render(<Toast toast={toast} onClose={handleClose} />)

    const closeButton = screen.getByLabelText('Close notification')
    fireEvent.click(closeButton)

    vi.advanceTimersByTime(300)
    expect(handleClose).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
