import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'
import React from 'react'

// Test component that uses the theme context
function TestComponent() {
  const { theme, toggleTheme, setTheme } = useTheme()

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button data-testid="toggle-button" onClick={toggleTheme}>Toggle Theme</button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>Set Light</button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document.documentElement.getAttribute
    document.documentElement.removeAttribute('data-theme')
  })

  it('should provide default light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('should toggle theme from light to dark', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleButton = screen.getByTestId('toggle-button')

    // Initially light
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')

    // Click toggle
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })
  })

  it('should toggle theme from dark to light', async () => {
    // Set initial theme to dark
    localStorage.setItem('theme-preference', 'dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleButton = screen.getByTestId('toggle-button')

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    // Click toggle
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })
  })

  it('should set theme to specific value using setTheme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const setDarkButton = screen.getByTestId('set-dark')
    const setLightButton = screen.getByTestId('set-light')

    // Set to dark
    fireEvent.click(setDarkButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })

    // Set to light
    fireEvent.click(setLightButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })
  })

  it('should persist theme to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleButton = screen.getByTestId('toggle-button')

    // Toggle to dark
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(localStorage.getItem('theme-preference')).toBe('dark')
    })
  })

  it('should restore theme from localStorage on mount', async () => {
    // Pre-set localStorage
    localStorage.setItem('theme-preference', 'dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })
  })

  it('should apply data-theme attribute to document', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleButton = screen.getByTestId('toggle-button')

    // Toggle to dark
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    // Toggle back to light
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })
  })

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleError.mockRestore()
  })
})
