import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useInsightStore } from './insight.store'
import { Insight } from '../types/index'

describe('insightStore', () => {
  const mockInsight: Insight = {
    id: '1',
    projectId: 'project-1',
    type: 'trend',
    title: 'Test Insight',
    summary: 'Test Summary',
    confidence: 0.9,
    source: 'AI Analysis',
    selected: false,
    evidence: ['Evidence 1'],
    created_at: Date.now(),
    updated_at: Date.now()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useInsightStore.setState({
      insights: [],
      selectedIds: new Set(),
      status: 'idle',
      error: null,
      streamBuffer: ''
    })
  })

  it('initializes with empty state', () => {
    const { insights, selectedIds, status, error, streamBuffer } = useInsightStore.getState()
    expect(insights).toEqual([])
    expect(selectedIds.size).toBe(0)
    expect(status).toBe('idle')
    expect(error).toBeNull()
    expect(streamBuffer).toBe('')
  })

  it('sets insights and auto-selects marked insights', () => {
    const insights = [
      mockInsight,
      { ...mockInsight, id: '2', selected: true },
      { ...mockInsight, id: '3', selected: true }
    ]

    const { setInsights } = useInsightStore.getState()
    setInsights(insights)

    const { insights: storeInsights, selectedIds } = useInsightStore.getState()
    expect(storeInsights).toHaveLength(3)
    expect(selectedIds.size).toBe(2)
    expect(selectedIds.has('2')).toBe(true)
    expect(selectedIds.has('3')).toBe(true)
  })

  it('adds an insight', () => {
    const { addInsight } = useInsightStore.getState()
    addInsight(mockInsight)

    const { insights } = useInsightStore.getState()
    expect(insights).toHaveLength(1)
    expect(insights[0]).toEqual(mockInsight)
  })

  it('toggles selection', () => {
    useInsightStore.setState({ insights: [mockInsight] })

    const { toggleSelection } = useInsightStore.getState()

    // Select
    toggleSelection('1')
    expect(useInsightStore.getState().selectedIds.has('1')).toBe(true)

    // Deselect
    toggleSelection('1')
    expect(useInsightStore.getState().selectedIds.has('1')).toBe(false)
  })

  it('selects all insights', () => {
    useInsightStore.setState({
      insights: [
        mockInsight,
        { ...mockInsight, id: '2' },
        { ...mockInsight, id: '3' }
      ]
    })

    const { selectAll } = useInsightStore.getState()
    selectAll()

    const { selectedIds } = useInsightStore.getState()
    expect(selectedIds.size).toBe(3)
    expect(selectedIds.has('1')).toBe(true)
    expect(selectedIds.has('2')).toBe(true)
    expect(selectedIds.has('3')).toBe(true)
  })

  it('clears selection', () => {
    useInsightStore.setState({
      insights: [mockInsight],
      selectedIds: new Set(['1', '2', '3'])
    })

    const { clearSelection } = useInsightStore.getState()
    clearSelection()

    const { selectedIds } = useInsightStore.getState()
    expect(selectedIds.size).toBe(0)
  })

  it('batch updates selected status', async () => {
    useInsightStore.setState({
      insights: [
        mockInsight,
        { ...mockInsight, id: '2' },
        { ...mockInsight, id: '3' }
      ]
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })

    const { batchUpdateSelected } = useInsightStore.getState()
    await batchUpdateSelected(['1', '2'], true)

    expect(global.fetch).toHaveBeenCalledWith('/api/insight/batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['1', '2'], selected: true })
    })

    const { insights } = useInsightStore.getState()
    expect(insights[0].selected).toBe(true)
    expect(insights[1].selected).toBe(true)
    expect(insights[2].selected).toBe(false)
  })

  it('handles batch update error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    })

    const { batchUpdateSelected } = useInsightStore.getState()
    await expect(batchUpdateSelected(['1'], true)).rejects.toThrow('批量更新失败')
  })

  it('batch deletes insights', async () => {
    useInsightStore.setState({
      insights: [
        mockInsight,
        { ...mockInsight, id: '2' },
        { ...mockInsight, id: '3' }
      ],
      selectedIds: new Set(['1', '2'])
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })

    const { batchDelete } = useInsightStore.getState()
    await batchDelete(['1', '2'])

    expect(global.fetch).toHaveBeenCalledWith('/api/insight/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['1', '2'] })
    })

    const { insights, selectedIds } = useInsightStore.getState()
    expect(insights).toHaveLength(1)
    expect(insights[0].id).toBe('3')
    expect(selectedIds.has('1')).toBe(false)
    expect(selectedIds.has('2')).toBe(false)
  })

  it('appends to stream buffer', () => {
    const { appendStream } = useInsightStore.getState()

    appendStream('Hello ')
    appendStream('World')

    const { streamBuffer } = useInsightStore.getState()
    expect(streamBuffer).toBe('Hello World')
  })

  it('sets status to streaming and clears buffer', () => {
    useInsightStore.setState({ streamBuffer: 'old buffer' })

    const { setStatus } = useInsightStore.getState()
    setStatus('streaming')

    const { status, streamBuffer } = useInsightStore.getState()
    expect(status).toBe('streaming')
    expect(streamBuffer).toBe('') // Buffer cleared
  })

  it('sets error status', () => {
    const { setStatus } = useInsightStore.getState()
    setStatus('error', 'Something went wrong')

    const { status, error } = useInsightStore.getState()
    expect(status).toBe('error')
    expect(error).toBe('Something went wrong')
  })

  it('resets store to initial state', () => {
    useInsightStore.setState({
      insights: [mockInsight],
      selectedIds: new Set(['1']),
      status: 'success',
      error: 'Some error',
      streamBuffer: 'Some buffer'
    })

    const { reset } = useInsightStore.getState()
    reset()

    const { insights, selectedIds, status, error, streamBuffer } = useInsightStore.getState()
    expect(insights).toEqual([])
    expect(selectedIds.size).toBe(0)
    expect(status).toBe('idle')
    expect(error).toBeNull()
    expect(streamBuffer).toBe('')
  })
})
