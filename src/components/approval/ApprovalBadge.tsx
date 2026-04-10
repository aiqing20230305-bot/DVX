import React from 'react'
import { CheckCircle, XCircle, Clock, Ban } from 'lucide-react'

interface ApprovalBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const config = {
    pending: {
      label: '待审批',
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      icon: Clock
    },
    approved: {
      label: '已通过',
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      icon: CheckCircle
    },
    rejected: {
      label: '已拒绝',
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      icon: XCircle
    },
    cancelled: {
      label: '已撤销',
      color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      icon: Ban
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }

  const { label, color, icon: Icon } = config[status]

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${color}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      <span>{label}</span>
    </span>
  )
}

export default ApprovalBadge
