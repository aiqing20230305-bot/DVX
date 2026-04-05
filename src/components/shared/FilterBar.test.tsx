import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from './FilterBar'

describe('FilterBar Component', () => {
  const mockFilters = [
    {
      label: '平台',
      options: [
        { value: 'all', label: '全部' },
        { value: 'douyin', label: '抖音', count: 5 },
      ],
      value: 'all',
      onChange: vi.fn(),
    },
  ]

  it('renders filter options', () => {
    render(<FilterBar filters={mockFilters} />)
    expect(screen.getByText('筛选')).toBeInTheDocument()
    expect(screen.getByText('平台:')).toBeInTheDocument()
    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText(/抖音/)).toBeInTheDocument()
  })

  it('calls onChange when filter selected', () => {
    const handleChange = vi.fn()
    const filters = [{ ...mockFilters[0], onChange: handleChange }]
    render(<FilterBar filters={filters} />)

    // The text is split across elements, so use a regex matcher
    fireEvent.click(screen.getByText(/抖音/))
    expect(handleChange).toHaveBeenCalledWith('douyin')
  })

  it('shows active filter state', () => {
    const activeFilters = [{ ...mockFilters[0], value: 'douyin' }]
    render(<FilterBar filters={activeFilters} />)

    const activeButton = screen.getByText(/抖音/)
    expect(activeButton).toHaveClass('bg-indigo-600')
  })

  it('supports multiple filters', () => {
    const multiFilters = [
      ...mockFilters,
      {
        label: '优先级',
        options: [
          { value: 'all', label: '全部' },
          { value: 'high', label: '高' },
        ],
        value: 'all',
        onChange: vi.fn(),
      },
    ]
    render(<FilterBar filters={multiFilters} />)

    expect(screen.getByText('平台:')).toBeInTheDocument()
    expect(screen.getByText('优先级:')).toBeInTheDocument()
  })
})
