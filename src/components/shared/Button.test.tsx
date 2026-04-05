import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByText('Click me')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Button size="xs">Extra Small</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-xs')

    rerender(<Button size="sm">Small</Button>)
    expect(button).toHaveClass('text-sm')

    rerender(<Button size="md">Medium</Button>)
    expect(button).toHaveClass('text-sm')

    rerender(<Button size="lg">Large</Button>)
    expect(button).toHaveClass('text-base')
  })

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-indigo-600')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-slate-700')

    rerender(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent')

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-indigo-600/50')
  })

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('handles disabled state correctly', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('cursor-not-allowed')

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders icon correctly', () => {
    const TestIcon = () => <span data-testid="test-icon">📌</span>
    render(<Button icon={<TestIcon />}>With Icon</Button>)

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('With Icon')).toBeInTheDocument()
  })

  it('renders right icon correctly', () => {
    const TestIcon = () => <span data-testid="test-icon-right">→</span>
    render(<Button iconRight={<TestIcon />}>Next</Button>)

    expect(screen.getByTestId('test-icon-right')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })
})
