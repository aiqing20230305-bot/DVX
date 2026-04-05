import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToastStore, toast } from './toast.store'

describe('toastStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    useToastStore.setState({ toasts: [] })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('initializes with empty state', () => {
    const { toasts } = useToastStore.getState()
    expect(toasts).toEqual([])
  })

  it('adds a toast with success type', () => {
    toast.success('Success!', 'Operation completed')

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].title).toBe('Success!')
    expect(toasts[0].message).toBe('Operation completed')
  })

  it('adds a toast with error type', () => {
    toast.error('Error!', 'Something went wrong')

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('error')
    expect(toasts[0].title).toBe('Error!')
    expect(toasts[0].message).toBe('Something went wrong')
  })

  it('adds a toast with warning type', () => {
    toast.warning('Warning!', 'Please be careful')

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('warning')
    expect(toasts[0].title).toBe('Warning!')
  })

  it('adds a toast with info type', () => {
    toast.info('Info', 'Here is some information')

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('info')
    expect(toasts[0].title).toBe('Info')
  })

  it('generates unique IDs for toasts', () => {
    toast.success('First')
    toast.success('Second')

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(2)
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })

  it('auto-removes toast after default duration', () => {
    toast.success('Auto Remove')

    let { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)

    vi.advanceTimersByTime(5000)

    toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(0)
  })

  it('auto-removes error toast after extended duration', () => {
    toast.error('Error Toast')

    let { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)

    vi.advanceTimersByTime(7000)

    toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(0)
  })

  it('manually removes toast by ID', () => {
    const { addToast, removeToast } = useToastStore.getState()
    addToast({ type: 'info', title: 'Test' })

    let { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)

    const toastId = toasts[0].id
    removeToast(toastId)

    toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(0)
  })

  it('manages multiple toasts simultaneously', () => {
    toast.success('First')
    toast.error('Second')
    toast.warning('Third')

    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(3)
    expect(toasts[0].title).toBe('First')
    expect(toasts[1].title).toBe('Second')
    expect(toasts[2].title).toBe('Third')
  })

  it('clears all toasts at once', () => {
    toast.success('First')
    toast.error('Second')
    toast.info('Third')

    let { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(3)

    const { clearAll } = useToastStore.getState()
    clearAll()

    toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(0)
  })

  it('respects custom duration', () => {
    toast.success('Custom Duration', undefined, 2000)

    let { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)

    vi.advanceTimersByTime(2000)

    toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(0)
  })

  it('does not auto-remove when duration is 0', () => {
    toast.success('Persistent', undefined, 0)

    let { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)

    vi.advanceTimersByTime(10000)

    toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(1)
  })
})
