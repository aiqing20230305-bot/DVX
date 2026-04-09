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

const variantClasses: Record<BadgeVariant, string> = {
  // Insight types (light theme - darker text on light background)
  trend: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  competitor: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  gap: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  attribution: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  anomaly: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  // Confidence
  high: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  medium: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  low: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  // Platforms
  douyin: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
  kuaishou: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  xiaohongshu: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  // Generic
  default: 'bg-[#F7F8FA] text-[#646A73] ring-1 ring-[#DEE0E3]',
  secondary: 'bg-[#F2F3F5] text-[#1F2329] ring-1 ring-[#E3E5E8]',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  error: 'bg-red-50 text-red-700 ring-1 ring-red-200',
}

const typeLabels: Partial<Record<BadgeVariant, string>> = {
  trend: '趋势', competitor: '竞品', gap: '机会', attribution: '归因', anomaly: '异常',
  high: '高置信', medium: '中置信', low: '低置信',
  douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书'
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variantClasses[variant],
      className
    ].join(' ')}>
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
