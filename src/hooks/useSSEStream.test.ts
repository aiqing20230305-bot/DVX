import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSSEStream } from './useSSEStream'

describe('useSSEStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with idle status', () => {
    const { result } = renderHook(() => useSSEStream())

    expect(result.current.status).toBe('idle')
    expect(result.current.rawText).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('sets connecting status when starting', async () => {
    const { result } = renderHook(() => useSSEStream())

    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: test\n\n'))
          controller.close()
        }
      })
    )

    act(() => {
      result.current.start(Promise.resolve(mockResponse))
    })

    await waitFor(() => {
      expect(result.current.status).toBe('connecting')
    })
  })

  it('handles successful stream', async () => {
    const onEvent = vi.fn()
    const onDone = vi.fn()

    const { result } = renderHook(() =>
      useSSEStream({ onEvent, onDone })
    )

    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"message":"test"}\n\n'))
          controller.enqueue(new TextEncoder().encode('event: done\n\n'))
          controller.close()
        }
      })
    )

    await act(async () => {
      await result.current.start(Promise.resolve(mockResponse))
    })

    await waitFor(() => {
      expect(result.current.status).toBe('done')
    })
    expect(onEvent).toHaveBeenCalled()
    expect(onDone).toHaveBeenCalled()
  })

  it('handles error response', async () => {
    const onError = vi.fn()

    const { result } = renderHook(() =>
      useSSEStream({ onError })
    )

    const mockResponse = new Response(null, {
      status: 500,
      statusText: 'Internal Server Error'
    })

    await act(async () => {
      await result.current.start(Promise.resolve(mockResponse))
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error).toBeTruthy()
    expect(onError).toHaveBeenCalled()
  })

  it('can cancel ongoing stream', async () => {
    const { result } = renderHook(() => useSSEStream())

    const mockResponse = new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode('data: test1\n\n'))
          await new Promise(resolve => setTimeout(resolve, 100))
          controller.enqueue(new TextEncoder().encode('data: test2\n\n'))
          controller.close()
        }
      })
    )

    act(() => {
      result.current.start(Promise.resolve(mockResponse))
    })

    await waitFor(() => {
      expect(result.current.status).toBe('streaming')
    })

    act(() => {
      result.current.cancel()
    })

    expect(result.current.status).toBe('idle')
  })

  it('resets state correctly', async () => {
    const { result } = renderHook(() => useSSEStream())

    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: test\n\n'))
          controller.close()
        }
      })
    )

    await act(async () => {
      await result.current.start(Promise.resolve(mockResponse))
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.rawText).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('parses SSE event names correctly', async () => {
    const onEvent = vi.fn()

    const { result } = renderHook(() =>
      useSSEStream({ onEvent })
    )

    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('event: custom\ndata: {"test":true}\n\n'))
          controller.enqueue(new TextEncoder().encode('event: done\n\n'))
          controller.close()
        }
      })
    )

    await act(async () => {
      await result.current.start(Promise.resolve(mockResponse))
    })

    await waitFor(() => {
      expect(onEvent).toHaveBeenCalledWith('custom', { test: true })
    })
  })

  it('handles error event in stream', async () => {
    const onError = vi.fn()

    const { result } = renderHook(() =>
      useSSEStream({ onError })
    )

    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('event: error\ndata: {"message":"Stream failed"}\n\n'))
          controller.close()
        }
      })
    )

    await act(async () => {
      await result.current.start(Promise.resolve(mockResponse))
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error).toBe('Stream failed')
    expect(onError).toHaveBeenCalledWith('Stream failed')
  })

  it('aborts previous stream when starting new one', async () => {
    const { result } = renderHook(() => useSSEStream())

    const mockResponse1 = new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode('data: test1\n\n'))
          await new Promise(resolve => setTimeout(resolve, 200))
          controller.close()
        }
      })
    )

    const mockResponse2 = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: test2\n\n'))
          controller.close()
        }
      })
    )

    act(() => {
      result.current.start(Promise.resolve(mockResponse1))
    })

    await waitFor(() => {
      expect(result.current.status).not.toBe('idle')
    })

    await act(async () => {
      await result.current.start(Promise.resolve(mockResponse2))
    })

    // Second stream should have started
    expect(result.current.status).not.toBe('idle')
  })

  it('handles non-JSON data gracefully', async () => {
    const onEvent = vi.fn()

    const { result } = renderHook(() =>
      useSSEStream({ onEvent })
    )

    const mockResponse = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: not-json\n\n'))
          controller.enqueue(new TextEncoder().encode('event: done\n\n'))
          controller.close()
        }
      })
    )

    await act(async () => {
      await result.current.start(Promise.resolve(mockResponse))
    })

    await waitFor(() => {
      expect(result.current.status).toBe('done')
    })
    // Should not have called onEvent for invalid JSON
    expect(onEvent).not.toHaveBeenCalled()
  })
})
