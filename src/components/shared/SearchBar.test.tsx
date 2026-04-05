import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchBar } from './SearchBar'

describe('SearchBar Component', () => {
  it('renders search input', () => {
    render(<SearchBar value="" onChange={() => {}} />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', '搜索...')
  })

  it('calls onChange when input changes', () => {
    const handleChange = vi.fn()
    render(<SearchBar value="" onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test search' } })

    expect(handleChange).toHaveBeenCalledWith('test search')
  })

  it('clears search when clear button clicked', () => {
    const handleChange = vi.fn()
    render(<SearchBar value="test" onChange={handleChange} />)

    const clearButton = screen.getByTitle('清空')
    fireEvent.click(clearButton)

    expect(handleChange).toHaveBeenCalledWith('')
  })
})
