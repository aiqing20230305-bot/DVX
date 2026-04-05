import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InsightCard } from './InsightCard'
import { Insight } from '../../types/index'

describe('InsightCard', () => {
  const mockInsight: Insight = {
    id: '1',
    projectId: 'project-1',
    title: '测试洞察标题',
    summary: '这是一个测试洞察的摘要内容',
    type: 'trend',
    confidence: 'high',
    actionable: true,
    metric: {
      label: '增长率',
      value: '+25%',
      trend: 'up'
    },
    evidence: [
      '证据1：数据显示增长趋势明显',
      '证据2：用户反馈积极',
      '证据3：市场表现优异'
    ],
    impact: 'high',
    tags: [],
    selected: false,
    created_at: Date.now(),
    updated_at: Date.now()
  }

  it('renders basic insight information', () => {
    render(<InsightCard insight={mockInsight} />)

    expect(screen.getByText('测试洞察标题')).toBeInTheDocument()
    expect(screen.getByText('这是一个测试洞察的摘要内容')).toBeInTheDocument()
  })

  it('renders type and confidence badges', () => {
    render(<InsightCard insight={mockInsight} />)

    // Type和Confidence通过Badge组件渲染，检查它们被渲染
    const badges = screen.getAllByText(/趋势|高|中|低/i)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('shows actionable badge when insight is actionable', () => {
    render(<InsightCard insight={mockInsight} />)

    expect(screen.getByText('可行动')).toBeInTheDocument()
  })

  it('does not show actionable badge when insight is not actionable', () => {
    const nonActionableInsight = { ...mockInsight, actionable: false }
    render(<InsightCard insight={nonActionableInsight} />)

    expect(screen.queryByText('可行动')).not.toBeInTheDocument()
  })

  it('renders metric with trend icon', () => {
    render(<InsightCard insight={mockInsight} />)

    expect(screen.getByText('增长率')).toBeInTheDocument()
    expect(screen.getByText('+25%')).toBeInTheDocument()
  })

  it('renders evidence list (max 3 items)', () => {
    render(<InsightCard insight={mockInsight} />)

    expect(screen.getByText('支撑证据')).toBeInTheDocument()
    expect(screen.getByText(/证据1：数据显示增长趋势明显/)).toBeInTheDocument()
    expect(screen.getByText(/证据2：用户反馈积极/)).toBeInTheDocument()
    expect(screen.getByText(/证据3：市场表现优异/)).toBeInTheDocument()
  })

  it('shows selected state with CheckSquare icon', () => {
    const { container } = render(
      <InsightCard
        insight={mockInsight}
        selected={true}
        onToggleSelect={vi.fn()}
      />
    )

    // 检查选中状态的样式类
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('border-indigo-500/60')
  })

  it('calls onToggleSelect when card is clicked', () => {
    const onToggleSelect = vi.fn()
    const { container } = render(
      <InsightCard
        insight={mockInsight}
        onToggleSelect={onToggleSelect}
      />
    )

    const card = container.firstChild as HTMLElement
    fireEvent.click(card)

    expect(onToggleSelect).toHaveBeenCalledWith('1')
  })

  it('applies type-specific border color', () => {
    const { container, rerender } = render(<InsightCard insight={mockInsight} />)

    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('border-blue-800/40')

    const competitorInsight = { ...mockInsight, type: 'competitor' }
    rerender(<InsightCard insight={competitorInsight} />)
    expect(card).toHaveClass('border-purple-800/40')
  })

  it('handles insight without metric', () => {
    const insightWithoutMetric = { ...mockInsight, metric: undefined }
    render(<InsightCard insight={insightWithoutMetric} />)

    expect(screen.queryByText('增长率')).not.toBeInTheDocument()
  })

  it('handles insight without evidence', () => {
    const insightWithoutEvidence = { ...mockInsight, evidence: [] }
    render(<InsightCard insight={insightWithoutEvidence} />)

    expect(screen.queryByText('支撑证据')).not.toBeInTheDocument()
  })
})
