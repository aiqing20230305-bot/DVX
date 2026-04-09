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
  // Insight types (dark theme - bright text on dark semi-transparent background)
  trend: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', ring: '#3B82F6' },
  competitor: { bg: 'rgba(168, 85, 247, 0.15)', text: '#A78BFA', ring: '#A855F7' },
  gap: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', ring: '#10B981' },
  attribution: { bg: 'rgba(251, 146, 60, 0.15)', text: '#FB923C', ring: '#FB923C' },
  anomaly: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', ring: '#EF4444' },
  // Confidence
  high: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', ring: '#10B981' },
  medium: { bg: 'rgba(251, 191, 36, 0.15)', text: '#FCD34D', ring: '#FBBF24' },
  low: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', ring: '#EF4444' },
  // Platforms
  douyin: { bg: 'rgba(236, 72, 153, 0.15)', text: '#F472B6', ring: '#EC4899' },
  kuaishou: { bg: 'rgba(251, 146, 60, 0.15)', text: '#FB923C', ring: '#FB923C' },
  xiaohongshu: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', ring: '#EF4444' },
  // Generic
  default: { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)', ring: 'var(--color-border)' },
  secondary: { bg: 'var(--color-bg-secondary)', text: 'var(--color-text-primary)', ring: 'var(--color-border-light)' },
  info: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', ring: '#3B82F6' },
  success: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', ring: '#10B981' },
  warning: { bg: 'rgba(251, 191, 36, 0.15)', text: '#FCD34D', ring: '#FBBF24' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', ring: '#EF4444' },
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
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1',
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
