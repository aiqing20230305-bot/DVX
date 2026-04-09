import React from 'react'

export function FileCardSkeleton() {
  return (
    <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-xl overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 p-4">
        {/* File icon skeleton */}
        <div className="w-10 h-10 rounded-lg bg-[#DEE0E3] flex-shrink-0 animate-pulse" />

        {/* File info skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            {/* File name */}
            <div className="h-4 bg-[#DEE0E3] rounded w-40 animate-pulse" />
            {/* Type badge */}
            <div className="h-5 bg-[#DEE0E3] rounded-full w-16 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            {/* Status */}
            <div className="h-3 bg-[#DEE0E3] rounded w-20 animate-pulse" />
            {/* Size */}
            <div className="h-3 bg-[#DEE0E3] rounded w-12 animate-pulse" />
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 bg-[#DEE0E3] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function FileCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <FileCardSkeleton key={i} />
      ))}
    </div>
  )
}
