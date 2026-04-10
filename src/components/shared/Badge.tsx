import React from 'react'

type BadgeVariant =
  | 'trend' | 'competitor' | 'gap' | 'attribution' | 'anomaly'
  | 'high' | 'medium' | 'low'
  | 'douyin' | 'kuaishou' | 'xiaohongshu'
  | 'default' | 'info' | 'success' | 'warning' | 'error' | 'secondary'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; ring: string }> = {
  // Insight types (dark theme - slightly more subtle backgrounds)
  trend: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60A5FA', ring: 'rgba(59, 130, 246, 0.3)' },
  competitor: { bg: 'rgba(168, 85, 247, 0.1)', text: '#A78BFA', ring: 'rgba(168, 85, 247, 0.3)' },
  gap: { bg: 'rgba(16, 185, 129, 0.1)', text: '#34D399', ring: 'rgba(16, 185, 129, 0.3)' },
  attribution: { bg: 'rgba(251, 146, 60, 0.1)', text: '#FB923C', ring: 'rgba(251, 146, 60, 0.3)' },
  anomaly: { bg: 'rgba(239, 68, 68, 0.1)', text: '#F87171', ring: 'rgba(239, 68, 68, 0.3)' },
  // Confidence
  high: { bg: 'var(--color-success-bg)', text: 'var(--color-success)', ring: 'var(--color-success-border)' },
  medium: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)', ring: 'var(--color-warning-border)' },
  low: { bg: 'var(--color-error-bg)', text: 'var(--color-error)', ring: 'var(--color-error-border)' },
  // Platforms
  douyin: { bg: 'rgba(236, 72, 153, 0.1)', text: '#F472B6', ring: 'rgba(236, 72, 153, 0.3)' },
  kuaishou: { bg: 'rgba(251, 146, 60, 0.1)', text: '#FB923C', ring: 'rgba(251, 146, 60, 0.3)' },
  xiaohongshu: { bg: 'rgba(239, 68, 68, 0.1)', text: '#F87171', ring: 'rgba(239, 68, 68, 0.3)' },
  // Generic
  default: { bg: 'var(--color-bg-elevated-2)', text: 'var(--color-text-secondary)', ring: 'var(--color-border)' },
  secondary: { bg: 'var(--color-bg-elevated-1)', text: 'var(--color-text-primary)', ring: 'var(--color-border)' },
  info: { bg: 'var(--color-info-bg)', text: 'var(--color-info)', ring: 'var(--color-info-border)' },
  success: { bg: 'var(--color-success-bg)', text: 'var(--color-success)', ring: 'var(--color-success-border)' },
  warning: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)', ring: 'var(--color-warning-border)' },
  error: { bg: 'var(--color-error-bg)', text: 'var(--color-error)', ring: 'var(--color-error-border)' },
}

const typeLabels: Partial<Record<BadgeVariant, string>> = {
  trend: '趋势', competitor: '竞品', gap: '机会', attribution: '归因', anomaly: '异常',
  high: '高置信', medium: '中置信', low: '低置信',
  douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书'
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const colors = variantColors[variant]
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1',
        className
      ].join(' ')}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.ring
      }}
    >
      {children}
    </span>
  )
}

export function InsightTypeBadge({ type }: { type: string }) {
  return <Badge variant={type as BadgeVariant}>{typeLabels[type as BadgeVariant] ?? type}</Badge>
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  return <Badge variant={confidence as BadgeVariant}>{typeLabels[confidence as BadgeVariant] ?? confidence}</Badge>
}

export function PlatformBadge({ platform }: { platform: string }) {
  return <Badge variant={platform as BadgeVariant}>{typeLabels[platform as BadgeVariant] ?? platform}</Badge>
}
