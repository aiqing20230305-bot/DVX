import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { useProjectStore } from './project.store'
import { api } from '../api/client'
import { Project } from '../types/index'

vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('projectStore', () => {
  const mockProject: Project = {
    id: '1',
    name: 'Test Project',
    description: 'Test Description',
    brand: 'Test Brand',
    category: 'Test Category',
    target_audience: 'Test Audience',
    campaign: 'Test Campaign',
    status: 'active',
    tags: ['test'],
    created_at: Date.now(),
    updated_at: Date.now()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useProjectStore.setState({
      projects: [],
      activeProjectId: null,
      loading: false
    })
  })

  it('initializes with empty state', () => {
    const { projects, activeProjectId, loading } = useProjectStore.getState()
    expect(projects).toEqual([])
    expect(activeProjectId).toBeNull()
    expect(loading).toBe(false)
  })

  it('sets active project', () => {
    const { setActiveProject } = useProjectStore.getState()

    setActiveProject('project-1')

    const { activeProjectId } = useProjectStore.getState()
    expect(activeProjectId).toBe('project-1')
  })

  it('fetches projects successfully', async () => {
    const mockProjects = [mockProject, { ...mockProject, id: '2', name: 'Project 2' }]
    ;(api.get as Mock).mockResolvedValue({ projects: mockProjects })

    const { fetchProjects } = useProjectStore.getState()
    await fetchProjects()

    const { projects, activeProjectId, loading } = useProjectStore.getState()
    expect(api.get).toHaveBeenCalledWith('/project')
    expect(projects).toEqual(mockProjects)
    expect(activeProjectId).toBe('1') // Auto-select first project
    expect(loading).toBe(false)
  })

  it('fetches project by id successfully', async () => {
    useProjectStore.setState({ projects: [mockProject] })
    const updatedProject = { ...mockProject, name: 'Updated Name' }
    ;(api.get as Mock).mockResolvedValue({ project: updatedProject })

    const { fetchProject } = useProjectStore.getState()
    const result = await fetchProject('1')

    expect(api.get).toHaveBeenCalledWith('/project/1')
    expect(result).toEqual(updatedProject)

    const { projects } = useProjectStore.getState()
    expect(projects[0].name).toBe('Updated Name')
  })

  it('handles fetch project error', async () => {
    ;(api.get as Mock).mockRejectedValue(new Error('Not found'))

    const { fetchProject } = useProjectStore.getState()
    const result = await fetchProject('nonexistent')

    expect(result).toBeNull()
  })

  it('adds a project successfully', async () => {
    ;(api.post as Mock).mockResolvedValue({ project: mockProject })

    const { addProject } = useProjectStore.getState()
    const result = await addProject({
      name: 'Test Project',
      description: 'Test Description'
    })

    expect(api.post).toHaveBeenCalledWith('/project', {
      name: 'Test Project',
      description: 'Test Description'
    })
    expect(result).toEqual(mockProject)

    const { projects, activeProjectId } = useProjectStore.getState()
    expect(projects).toHaveLength(1)
    expect(projects[0]).toEqual(mockProject)
    expect(activeProjectId).toBe('1') // Auto-set as active
  })

  it('updates a project successfully', async () => {
    useProjectStore.setState({ projects: [mockProject] })
    const updatedProject = { ...mockProject, name: 'Updated Name' }
    ;(api.put as Mock).mockResolvedValue({ project: updatedProject })

    const { updateProject } = useProjectStore.getState()
    await updateProject('1', { name: 'Updated Name' })

    expect(api.put).toHaveBeenCalledWith('/project/1', { name: 'Updated Name' })

    const { projects } = useProjectStore.getState()
    expect(projects[0].name).toBe('Updated Name')
  })

  it('removes a project successfully', async () => {
    useProjectStore.setState({
      projects: [mockProject, { ...mockProject, id: '2', name: 'Project 2' }],
      activeProjectId: '1'
    })
    ;(api.delete as Mock).mockResolvedValue({})

    const { removeProject } = useProjectStore.getState()
    await removeProject('1')

    expect(api.delete).toHaveBeenCalledWith('/project/1')

    const { projects, activeProjectId } = useProjectStore.getState()
    expect(projects).toHaveLength(1)
    expect(projects[0].id).toBe('2')
    expect(activeProjectId).toBe('2') // Auto-switch to remaining project
  })

  it('clears active project when last project is removed', async () => {
    useProjectStore.setState({
      projects: [mockProject],
      activeProjectId: '1'
    })
    ;(api.delete as Mock).mockResolvedValue({})

    const { removeProject } = useProjectStore.getState()
    await removeProject('1')

    const { projects, activeProjectId } = useProjectStore.getState()
    expect(projects).toHaveLength(0)
    expect(activeProjectId).toBeNull()
  })
})
