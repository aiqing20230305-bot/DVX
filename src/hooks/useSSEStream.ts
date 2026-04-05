import { useState, useRef, useCallback } from 'react'

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error'

interface UseSSEStreamOptions<T> {
  onEvent?: (event: string, data: T) => void
  onError?: (message: string) => void
  onDone?: () => void
}

export function useSSEStream<T = unknown>(options: UseSSEStreamOptions<T> = {}) {
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [rawText, setRawText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(async (fetchPromise: Promise<Response>) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    setStatus('connecting')
    setRawText('')
    setError(null)

    try {
      const response = await fetchPromise
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      setStatus('streaming')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (controller.signal.aborted) break

        buffer += decoder.decode(value, { stream: true })
        setRawText(prev => prev + decoder.decode(value, { stream: true }).replace(/^data:.*/gm, ''))

        // Parse SSE messages
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const lines = part.split('\n')
          let eventName = 'message'
          let dataStr = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6).trim()
            }
          }

          if (eventName === 'done') {
            setStatus('done')
            options.onDone?.()
            break
          }

          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr) as T
              if (eventName === 'error') {
                const msg = (parsed as { message?: string })?.message ?? 'Stream error'
                setError(msg)
                setStatus('error')
                options.onError?.(msg)
                return
              }
              options.onEvent?.(eventName, parsed)
            } catch {
              // Non-JSON data, skip
            }
          }
        }
      }

      if (status !== 'error') {
        setStatus('done')
        options.onDone?.()
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setStatus('error')
      options.onError?.(msg)
    }
  }, [options])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
    setRawText('')
    setError(null)
  }, [])

  return { status, rawText, error, start, cancel, reset }
}
