import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopicCard } from './TopicCard'
import { TopicCard as TopicCardType } from '../../types/index'

describe('TopicCard', () => {
  const mockTopic: TopicCardType = {
    id: '1',
    projectId: 'project-1',
    title: '测试选题标题',
    angle: '情感共鸣角度',
    hook: '开场吸引力Hook',
    coreValue: '核心价值主张',
    persona: '25-35岁女性，追求品质生活',
    pain_point: '时间紧张，需要快速解决方案',
    cta: '立即购买，限时优惠',
    platform: 'douyin',
    estimated_duration: 65,
    priority: 3,
    selected: false,
    created_at: Date.now(),
    updated_at: Date.now()
  }

  it('renders basic topic information', () => {
    render(<TopicCard topic={mockTopic} />)

    expect(screen.getByText('测试选题标题')).toBeInTheDocument()
    expect(screen.getByText('情感共鸣角度')).toBeInTheDocument()
    expect(screen.getByText('25-35岁女性，追求品质生活')).toBeInTheDocument()
    expect(screen.getByText('立即购买，限时优惠')).toBeInTheDocument()
  })

  it('renders platform badge', () => {
    render(<TopicCard topic={mockTopic} />)

    // PlatformBadge组件会渲染平台相关内容
    const badge = screen.getByText(/抖音|快手|小红书/i)
    expect(badge).toBeInTheDocument()
  })

  it('formats duration correctly (minutes and seconds)', () => {
    render(<TopicCard topic={mockTopic} />)

    expect(screen.getByText('1分5秒')).toBeInTheDocument()
  })

  it('formats duration correctly (seconds only)', () => {
    const topicWithSecondsOnly = { ...mockTopic, estimated_duration: 45 }
    render(<TopicCard topic={topicWithSecondsOnly} />)

    expect(screen.getByText('45秒')).toBeInTheDocument()
  })

  it('formats duration correctly (full minutes)', () => {
    const topicWithFullMinutes = { ...mockTopic, estimated_duration: 120 }
    render(<TopicCard topic={topicWithFullMinutes} />)

    expect(screen.getByText('2分')).toBeInTheDocument()
  })

  it('shows selected state with CheckSquare icon', () => {
    const { container } = render(
      <TopicCard
        topic={mockTopic}
        selected={true}
        onToggleSelect={vi.fn()}
      />
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('border-indigo-500/60')
  })

  it('calls onToggleSelect when card is clicked', () => {
    const onToggleSelect = vi.fn()
    const { container } = render(
      <TopicCard
        topic={mockTopic}
        onToggleSelect={onToggleSelect}
      />
    )

    const card = container.firstChild as HTMLElement
    fireEvent.click(card)

    expect(onToggleSelect).toHaveBeenCalledWith('1')
  })

  it('renders priority stars correctly', () => {
    render(
      <TopicCard
        topic={mockTopic}
        onPriorityChange={vi.fn()}
      />
    )

    expect(screen.getByText('优先级')).toBeInTheDocument()

    // 应该有5个星星按钮
    const starButtons = screen.getAllByRole('button')
    expect(starButtons).toHaveLength(5)
  })

  it('calls onPriorityChange when star is clicked', () => {
    const onPriorityChange = vi.fn()
    render(
      <TopicCard
        topic={mockTopic}
        onPriorityChange={onPriorityChange}
      />
    )

    const starButtons = screen.getAllByRole('button')
    fireEvent.click(starButtons[4]) // Click 5th star

    expect(onPriorityChange).toHaveBeenCalledWith('1', 5)
  })

  it('stops event propagation when star is clicked', () => {
    const onToggleSelect = vi.fn()
    const onPriorityChange = vi.fn()
    render(
      <TopicCard
        topic={mockTopic}
        onToggleSelect={onToggleSelect}
        onPriorityChange={onPriorityChange}
      />
    )

    const starButtons = screen.getAllByRole('button')
    fireEvent.click(starButtons[2])

    expect(onPriorityChange).toHaveBeenCalledWith('1', 3)
    expect(onToggleSelect).not.toHaveBeenCalled()
  })

  it('applies platform-specific border color', () => {
    const { container, rerender } = render(<TopicCard topic={mockTopic} />)

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('border-pink-800/40')

    const kuaishouTopic = { ...mockTopic, platform: 'kuaishou' }
    rerender(<TopicCard topic={kuaishouTopic} />)
    expect(card).toHaveClass('border-orange-800/40')

    const xiaohongshuTopic = { ...mockTopic, platform: 'xiaohongshu' }
    rerender(<TopicCard topic={xiaohongshuTopic} />)
    expect(card).toHaveClass('border-red-800/40')
  })

  it('does not render priority stars when onPriorityChange is not provided', () => {
    render(<TopicCard topic={mockTopic} />)

    expect(screen.queryByText('优先级')).not.toBeInTheDocument()
  })

  it('does not render selection checkbox when onToggleSelect is not provided', () => {
    const { container } = render(<TopicCard topic={mockTopic} />)

    // 没有onToggleSelect时，不应该有checkbox图标
    const card = container.firstChild as HTMLElement
    expect(card.querySelector('svg')).not.toHaveClass('text-indigo-400')
  })
})
