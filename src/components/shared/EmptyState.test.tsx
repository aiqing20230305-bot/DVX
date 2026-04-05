import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState Component', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No Data"
        description="There is no data to display"
      />
    )
    expect(screen.getByText('No Data')).toBeInTheDocument()
    expect(screen.getByText('There is no data to display')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const handleClick = vi.fn()
    render(
      <EmptyState
        title="No Data"
        action={{
          label: 'Create New',
          onClick: handleClick,
        }}
      />
    )

    const button = screen.getByText('Create New')
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
