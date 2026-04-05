import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SortDropdown } from './SortDropdown'

describe('SortDropdown', () => {
  const mockOptions = [
    { value: 'created_at', label: '创建时间' },
    { value: 'updated_at', label: '更新时间' },
    { value: 'priority', label: '优先级' }
  ]

  const defaultProps = {
    options: mockOptions,
    value: 'created_at',
    ascending: true,
    onChange: vi.fn()
  }

  it('renders with current option label', () => {
    render(<SortDropdown {...defaultProps} />)
    expect(screen.getByText('创建时间')).toBeInTheDocument()
  })

  it('shows dropdown when clicked', () => {
    render(<SortDropdown {...defaultProps} />)

    const button = screen.getByText('创建时间')
    fireEvent.click(button)

    expect(screen.getByText('更新时间')).toBeInTheDocument()
    expect(screen.getByText('优先级')).toBeInTheDocument()
  })

  it('closes dropdown when option selected', () => {
    render(<SortDropdown {...defaultProps} />)

    const button = screen.getByText('创建时间')
    fireEvent.click(button)

    const option = screen.getByText('更新时间')
    fireEvent.click(option)

    expect(screen.queryByText('优先级')).not.toBeInTheDocument()
  })

  it('calls onChange with selected option', () => {
    const onChange = vi.fn()
    render(<SortDropdown {...defaultProps} onChange={onChange} />)

    const button = screen.getByText('创建时间')
    fireEvent.click(button)

    const option = screen.getByText('更新时间')
    fireEvent.click(option)

    expect(onChange).toHaveBeenCalledWith('updated_at', true)
  })

  it('shows check icon for current selection', () => {
    const { container } = render(<SortDropdown {...defaultProps} />)

    const button = screen.getByText('创建时间')
    fireEvent.click(button)

    const checkIcon = container.querySelector('.text-indigo-400')
    expect(checkIcon).toBeInTheDocument()
  })

  it('toggles sort direction', () => {
    const onChange = vi.fn()
    render(<SortDropdown {...defaultProps} onChange={onChange} />)

    const button = screen.getByText('创建时间')
    fireEvent.click(button)

    const toggleButton = screen.getByText('升序')
    fireEvent.click(toggleButton)

    expect(onChange).toHaveBeenCalledWith('created_at', false)
  })

  it('displays correct sort direction text', () => {
    const { rerender } = render(<SortDropdown {...defaultProps} ascending={true} />)

    const button = screen.getByText('创建时间')
    fireEvent.click(button)

    expect(screen.getByText('升序')).toBeInTheDocument()

    fireEvent.click(button)
    rerender(<SortDropdown {...defaultProps} ascending={false} />)
    fireEvent.click(button)

    expect(screen.getByText('降序')).toBeInTheDocument()
  })

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <SortDropdown {...defaultProps} />
        <div data-testid="outside">Outside</div>
      </div>
    )

    const button = screen.getByText('创建时间')
    fireEvent.click(button)

    expect(screen.getByText('更新时间')).toBeInTheDocument()

    const outside = screen.getByTestId('outside')
    fireEvent.mouseDown(outside)

    expect(screen.queryByText('更新时间')).not.toBeInTheDocument()
  })

  it('preserves ascending state when changing sort field', () => {
    const onChange = vi.fn()
    render(<SortDropdown {...defaultProps} ascending={false} onChange={onChange} />)

    const button = screen.getByText('创建时间')
    fireEvent.click(button)

    const option = screen.getByText('优先级')
    fireEvent.click(option)

    expect(onChange).toHaveBeenCalledWith('priority', false)
  })
})
