import React from 'react'
import { Music2, BookOpen, Zap, Play, MessageCircle } from 'lucide-react'

type BadgeVariant =
  | 'trend' | 'competitor' | 'gap' | 'attribution' | 'anomaly'
  | 'high' | 'medium' | 'low'
  | 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili' | 'weibo'
  | 'default' | 'info' | 'success' | 'warning' | 'error' | 'secondary'

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: React.ReactNode
  className?: string
  enablePulse?: boolean  // Phase 3.4: 脉冲动画（用于"new"标签）
  showIcon?: boolean     // Phase 3.4: 显示平台图标
  gradient?: boolean     // Phase 3.4: 使用渐变背景
}

// Phase 3.4: 平台图标映射
const platformIcons: Partial<Record<BadgeVariant, React.ComponentType<{ size?: number; className?: string }>>> = {
  douyin: Music2,       // 抖音 - 音符图标
  kuaishou: Zap,        // 快手 - 闪电图标
  xiaohongshu: BookOpen, // 小红书 - 书本图标
  bilibili: Play,       // B站 - 播放图标
  weibo: MessageCircle  // 微博 - 消息图标
}

// Phase 3.4: 尺寸样式
const sizeClasses: Record<BadgeSize, { padding: string; text: string; iconSize: number; rounded: string }> = {
  xs: { padding: 'px-1.5 py-0.5', text: 'text-[10px]', iconSize: 10, rounded: 'rounded' },
  sm: { padding: 'px-2 py-0.5', text: 'text-xs', iconSize: 12, rounded: 'rounded' },
  md: { padding: 'px-2.5 py-1', text: 'text-xs', iconSize: 14, rounded: 'rounded-md' },
  lg: { padding: 'px-3 py-1.5', text: 'text-sm', iconSize: 16, rounded: 'rounded-md' }
}

// Phase 3.4: 渐变背景（用于平台和优先级badge）
const gradientBackgrounds: Partial<Record<BadgeVariant, string>> = {
  douyin: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15))',    // 粉→紫
  kuaishou: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(251, 191, 36, 0.15))',  // 橙→黄
  xiaohongshu: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(236, 72, 153, 0.15))', // 红→粉
  bilibili: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(236, 72, 153, 0.15))',  // 蓝→粉
  weibo: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(239, 68, 68, 0.15))',      // 橙→红
  high: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.15))',      // 绿色渐变
  medium: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 146, 60, 0.15))',    // 黄橙渐变
  low: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))'          // 红色渐变
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
  bilibili: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60A5FA', ring: 'rgba(59, 130, 246, 0.3)' },
  weibo: { bg: 'rgba(251, 146, 60, 0.1)', text: '#FB923C', ring: 'rgba(251, 146, 60, 0.3)' },
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
  douyin: '抖音', kuaishou: '快手', xiaohongshu: '小红书', bilibili: 'B站', weibo: '微博'
}

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
  enablePulse = false,
  showIcon = false,
  gradient = false
}: BadgeProps) {
  const colors = variantColors[variant] || variantColors.default
  const sizeStyle = sizeClasses[size]
  const Icon = showIcon && variant ? platformIcons[variant] : null
  const gradientBg = gradient && variant ? gradientBackgrounds[variant] : null

  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-medium ring-1',
        sizeStyle.padding,
        sizeStyle.text,
        sizeStyle.rounded,
        enablePulse ? 'ai-badge-new' : '', // Phase 3.4: 脉冲动画（使用globals.css中的ai-badge-pulse）
        className
      ].filter(Boolean).join(' ')}
      style={{
        background: gradientBg || colors.bg,
        color: colors.text,
        borderColor: colors.ring
      }}
    >
      {/* Phase 3.4: 平台图标 */}
      {Icon && <Icon size={sizeStyle.iconSize} />}
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

export function PlatformBadge({ platform, size = 'sm' }: { platform: string; size?: BadgeSize }) {
  return (
    <Badge
      variant={platform as BadgeVariant}
      size={size}
      showIcon={true}     // Phase 3.4: 平台badge默认显示图标
      gradient={true}      // Phase 3.4: 平台badge默认使用渐变背景
    >
      {typeLabels[platform as BadgeVariant] ?? platform}
    </Badge>
  )
}
