import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useScriptStore } from './script.store'
import { Script } from '../types/index'

describe('scriptStore', () => {
  const mockScript: Script = {
    id: '1',
    projectId: 'project-1',
    topicId: 'topic-1',
    version: 'A',
    segments: [],
    fullText: 'Test Script',
    wordCount: 100,
    created_at: Date.now(),
    updated_at: Date.now()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useScriptStore.setState({
      scripts: [],
      selectedIds: new Set(),
      activeTopicId: null,
      status: 'idle'
    })
  })

  it('initializes with empty state', () => {
    const { scripts, selectedIds, activeTopicId, status } = useScriptStore.getState()
    expect(scripts).toEqual([])
    expect(selectedIds.size).toBe(0)
    expect(activeTopicId).toBeNull()
    expect(status).toBe('idle')
  })

  it('sets scripts', () => {
    const scripts = [mockScript, { ...mockScript, id: '2' }]

    const { setScripts } = useScriptStore.getState()
    setScripts(scripts)

    expect(useScriptStore.getState().scripts).toEqual(scripts)
  })

  it('adds a script', () => {
    const { addScript } = useScriptStore.getState()
    addScript(mockScript)

    const { scripts } = useScriptStore.getState()
    expect(scripts).toHaveLength(1)
    expect(scripts[0]).toEqual(mockScript)
  })

  it('sets active topic', () => {
    const { setActiveTopicId } = useScriptStore.getState()
    setActiveTopicId('topic-1')

    expect(useScriptStore.getState().activeTopicId).toBe('topic-1')
  })

  it('toggles selection', () => {
    useScriptStore.setState({ scripts: [mockScript] })

    const { toggleSelection } = useScriptStore.getState()

    toggleSelection('1')
    expect(useScriptStore.getState().selectedIds.has('1')).toBe(true)

    toggleSelection('1')
    expect(useScriptStore.getState().selectedIds.has('1')).toBe(false)
  })

  it('selects all scripts', () => {
    useScriptStore.setState({
      scripts: [mockScript, { ...mockScript, id: '2' }]
    })

    const { selectAll } = useScriptStore.getState()
    selectAll()

    const { selectedIds } = useScriptStore.getState()
    expect(selectedIds.size).toBe(2)
  })

  it('clears selection', () => {
    useScriptStore.setState({ selectedIds: new Set(['1', '2']) })

    const { clearSelection } = useScriptStore.getState()
    clearSelection()

    expect(useScriptStore.getState().selectedIds.size).toBe(0)
  })

  it('updates a script', () => {
    useScriptStore.setState({ scripts: [mockScript] })

    const { updateScript } = useScriptStore.getState()
    updateScript('1', { fullText: 'Updated Text', wordCount: 150 })

    const { scripts } = useScriptStore.getState()
    expect(scripts[0].fullText).toBe('Updated Text')
    expect(scripts[0].wordCount).toBe(150)
  })

  it('batch deletes scripts', async () => {
    useScriptStore.setState({
      scripts: [mockScript, { ...mockScript, id: '2' }],
      selectedIds: new Set(['1'])
    })

    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    const { batchDelete } = useScriptStore.getState()
    await batchDelete(['1'])

    const { scripts, selectedIds } = useScriptStore.getState()
    expect(scripts).toHaveLength(1)
    expect(scripts[0].id).toBe('2')
    expect(selectedIds.has('1')).toBe(false)
  })

  it('sets status', () => {
    const { setStatus } = useScriptStore.getState()
    setStatus('success')

    expect(useScriptStore.getState().status).toBe('success')
  })
})
