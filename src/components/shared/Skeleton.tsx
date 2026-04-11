import React from 'react'

/**
 * Skeleton Loading Component (Phase 3.5 - v2.2.0)
 *
 * 统一的加载状态骨架组件，提供5种预设变体
 *
 * @example
 * ```tsx
 * // 文本行
 * <Skeleton variant="text" count={3} />
 *
 * // 标题
 * <Skeleton variant="title" width="60%" />
 *
 * // 卡片
 * <Skeleton variant="card" height="200px" />
 *
 * // 头像
 * <Skeleton variant="avatar" />
 *
 * // 图表
 * <Skeleton variant="chart" height="300px" />
 * ```
 */

type SkeletonVariant = 'text' | 'title' | 'card' | 'avatar' | 'chart'

export interface SkeletonProps {
  /** 骨架变体类型 */
  variant?: SkeletonVariant
  /** 宽度（支持CSS单位或数字） */
  width?: string | number
  /** 高度（支持CSS单位或数字） */
  height?: string | number
  /** 重复数量（用于text列表） */
  count?: number
  /** 自定义类名 */
  className?: string
}

// 变体预设尺寸
const variantStyles: Record<SkeletonVariant, { width: string; height: string; rounded: string }> = {
  text: { width: '100%', height: '16px', rounded: 'rounded' },
  title: { width: '60%', height: '24px', rounded: 'rounded' },
  card: { width: '100%', height: '200px', rounded: 'rounded-lg' },
  avatar: { width: '48px', height: '48px', rounded: 'rounded-full' },
  chart: { width: '100%', height: '300px', rounded: 'rounded-lg' }
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = ''
}: SkeletonProps) {
  const defaultStyle = variantStyles[variant]

  // 解析width/height（支持数字和字符串）
  const finalWidth = width !== undefined
    ? (typeof width === 'number' ? `${width}px` : width)
    : defaultStyle.width

  const finalHeight = height !== undefined
    ? (typeof height === 'number' ? `${height}px` : height)
    : defaultStyle.height

  // 生成多个骨架（用于text列表）
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={[
        'skeleton', // Phase 3.5: 使用globals.css中的shimmer动画
        defaultStyle.rounded,
        className
      ].filter(Boolean).join(' ')}
      style={{
        width: finalWidth,
        height: finalHeight,
        // Phase 3.5: 渐变背景
        background: 'linear-gradient(90deg, var(--color-bg-elevated-1) 25%, var(--color-bg-elevated-2) 50%, var(--color-bg-elevated-1) 75%)',
        backgroundSize: '200% 100%',
        marginBottom: variant === 'text' && count > 1 && i < count - 1 ? '8px' : '0'
      }}
    />
  ))

  return count === 1 ? skeletons[0] : <div className="space-y-2">{skeletons}</div>
}

/**
 * SkeletonGroup - 用于组合多种骨架
 *
 * @example
 * ```tsx
 * <SkeletonGroup>
 *   <Skeleton variant="avatar" />
 *   <div className="flex-1">
 *     <Skeleton variant="title" />
 *     <Skeleton variant="text" count={2} />
 *   </div>
 * </SkeletonGroup>
 * ```
 */
export function SkeletonGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex gap-4 ${className}`}>
      {children}
    </div>
  )
}
