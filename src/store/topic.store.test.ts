import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTopicStore } from './topic.store'
import { TopicCard } from '../types/index'

describe('topicStore', () => {
  const mockTopic: TopicCard = {
    id: '1',
    projectId: 'project-1',
    title: 'Test Topic',
    angle: 'Test Angle',
    hook: 'Test Hook',
    coreValue: 'Test Value',
    persona: 'Test Persona',
    pain_point: 'Test Pain',
    cta: 'Test CTA',
    platform: 'douyin',
    estimated_duration: 30,
    priority: 2,
    selected: false,
    created_at: Date.now(),
    updated_at: Date.now()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useTopicStore.setState({
      topics: [],
      selectedIds: new Set(),
      status: 'idle',
      error: null
    })
  })

  it('initializes with empty state', () => {
    const { topics, selectedIds, status } = useTopicStore.getState()
    expect(topics).toEqual([])
    expect(selectedIds.size).toBe(0)
    expect(status).toBe('idle')
  })

  it('sets topics and auto-selects marked topics', () => {
    const topics = [
      mockTopic,
      { ...mockTopic, id: '2', selected: true }
    ]

    const { setTopics } = useTopicStore.getState()
    setTopics(topics)

    const { selectedIds } = useTopicStore.getState()
    expect(selectedIds.size).toBe(1)
    expect(selectedIds.has('2')).toBe(true)
  })

  it('adds a topic', () => {
    const { addTopic } = useTopicStore.getState()
    addTopic(mockTopic)

    const { topics } = useTopicStore.getState()
    expect(topics).toHaveLength(1)
    expect(topics[0]).toEqual(mockTopic)
  })

  it('toggles selection', () => {
    useTopicStore.setState({ topics: [mockTopic] })

    const { toggleSelection } = useTopicStore.getState()

    toggleSelection('1')
    expect(useTopicStore.getState().selectedIds.has('1')).toBe(true)

    toggleSelection('1')
    expect(useTopicStore.getState().selectedIds.has('1')).toBe(false)
  })

  it('selects all topics', () => {
    useTopicStore.setState({
      topics: [mockTopic, { ...mockTopic, id: '2' }]
    })

    const { selectAll } = useTopicStore.getState()
    selectAll()

    const { selectedIds } = useTopicStore.getState()
    expect(selectedIds.size).toBe(2)
  })

  it('clears selection', () => {
    useTopicStore.setState({ selectedIds: new Set(['1', '2']) })

    const { clearSelection } = useTopicStore.getState()
    clearSelection()

    expect(useTopicStore.getState().selectedIds.size).toBe(0)
  })

  it('updates topic priority', () => {
    useTopicStore.setState({ topics: [mockTopic] })

    const { updatePriority } = useTopicStore.getState()
    updatePriority('1', 5)

    const { topics } = useTopicStore.getState()
    expect(topics[0].priority).toBe(5)
  })

  it('batch updates selected status', async () => {
    useTopicStore.setState({ topics: [mockTopic, { ...mockTopic, id: '2' }] })

    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    const { batchUpdateSelected } = useTopicStore.getState()
    await batchUpdateSelected(['1'], true)

    const { topics } = useTopicStore.getState()
    expect(topics[0].selected).toBe(true)
  })

  it('batch deletes topics', async () => {
    useTopicStore.setState({
      topics: [mockTopic, { ...mockTopic, id: '2' }],
      selectedIds: new Set(['1'])
    })

    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    const { batchDelete } = useTopicStore.getState()
    await batchDelete(['1'])

    const { topics, selectedIds } = useTopicStore.getState()
    expect(topics).toHaveLength(1)
    expect(topics[0].id).toBe('2')
    expect(selectedIds.has('1')).toBe(false)
  })

  it('resets store to initial state', () => {
    useTopicStore.setState({
      topics: [mockTopic],
      selectedIds: new Set(['1']),
      status: 'success'
    })

    const { reset } = useTopicStore.getState()
    reset()

    const { topics, selectedIds, status } = useTopicStore.getState()
    expect(topics).toEqual([])
    expect(selectedIds.size).toBe(0)
    expect(status).toBe('idle')
  })
})
