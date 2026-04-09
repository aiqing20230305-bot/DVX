import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  center?: boolean
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32
}

export function LoadingSpinner({ size = 'md', text, center = true }: LoadingSpinnerProps) {
  const content = (
    <div className="inline-flex flex-col items-center gap-3 animate-fade-in">
      <div className="relative">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#3370FF]/20 animate-pulse" />
        {/* Spinner */}
        <Loader2
          size={sizeMap[size]}
          className="animate-spinner text-[#3370FF]"
        />
      </div>
      {text && (
        <p className="text-sm text-[#646A73] animate-pulse">{text}</p>
      )}
    </div>
  )

  if (center) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {content}
      </div>
    )
  }

  return content
}

// Skeleton loader component
interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </>
  )
}

// Card skeleton
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-xl p-4 animate-fade-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-start gap-4">
            <Skeleton className="w-10 h-10 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
