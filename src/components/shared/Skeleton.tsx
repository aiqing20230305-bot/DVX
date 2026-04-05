import React from 'react'

interface SkeletonProps {
  className?: string
  rows?: number
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton ${className}`} aria-busy="true" />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
