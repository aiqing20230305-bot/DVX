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
  // Insight types
  trend: 'bg-blue-900/50 text-blue-300 ring-1 ring-blue-700/50',
  competitor: 'bg-purple-900/50 text-purple-300 ring-1 ring-purple-700/50',
  gap: 'bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700/50',
  attribution: 'bg-orange-900/50 text-orange-300 ring-1 ring-orange-700/50',
  anomaly: 'bg-red-900/50 text-red-300 ring-1 ring-red-700/50',
  // Confidence
  high: 'bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700/50',
  medium: 'bg-yellow-900/50 text-yellow-300 ring-1 ring-yellow-700/50',
  low: 'bg-red-900/50 text-red-300 ring-1 ring-red-700/50',
  // Platforms
  douyin: 'bg-pink-900/50 text-pink-300 ring-1 ring-pink-700/50',
  kuaishou: 'bg-orange-900/50 text-orange-300 ring-1 ring-orange-700/50',
  xiaohongshu: 'bg-red-900/50 text-red-300 ring-1 ring-red-700/50',
  // Generic
  default: 'bg-slate-700 text-slate-300 ring-1 ring-slate-600',
  secondary: 'bg-slate-600 text-slate-200 ring-1 ring-slate-500',
  info: 'bg-blue-900/50 text-blue-300 ring-1 ring-blue-700/50',
  success: 'bg-emerald-900/50 text-emerald-300 ring-1 ring-emerald-700/50',
  warning: 'bg-yellow-900/50 text-yellow-300 ring-1 ring-yellow-700/50',
  error: 'bg-red-900/50 text-red-300 ring-1 ring-red-700/50',
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
