import React, { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import {
  Upload, FileCheck, Lightbulb, FileText, PenTool, FileOutput,
  Clock, ChevronDown, Loader, Plus
} from 'lucide-react'
import { formatDistanceToNow } from '../../utils/date.js'

interface Log {
  id: string
  project_id: string | null
  action: string
  details: string | null
  created_at: number
}

interface ProjectTimelineProps {
  projectId: string
  limit?: number
}

const actionIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  create: Plus,
  upload: Upload,
  parse: FileCheck,
  insight: Lightbulb,
  topic: FileText,
  script: PenTool,
  report: FileOutput,
}

const actionColors: Record<string, string> = {
  create: 'text-emerald-400 bg-emerald-900/20',
  upload: 'text-blue-400 bg-blue-900/20',
  parse: 'text-green-400 bg-green-900/20',
  insight: 'text-yellow-400 bg-yellow-900/20',
  topic: 'text-purple-400 bg-purple-900/20',
  script: 'text-pink-400 bg-pink-900/20',
  report: 'text-[#5B8EFF] bg-[#0D3DB8]/20',
}

const actionLabels: Record<string, string> = {
  create: '创建项目',
  upload: '上传文件',
  parse: '解析完成',
  insight: '生成洞察',
  topic: '创建选题',
  script: '生成脚本',
  report: '导出报告',
}

export function ProjectTimeline({ projectId, limit = 50 }: ProjectTimelineProps) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [projectId, limit])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const { logs } = await api.get<{ logs: Log[] }>(`/project/${projectId}/timeline?limit=${limit}`)
      setLogs(logs)
    } finally {
      setLoading(false)
    }
  }

  const displayedLogs = expanded ? logs : logs.slice(0, 10)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin text-[#3370FF]" size={24} />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center text-[#8F959E] py-8">
        暂无活动记录
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {displayedLogs.map((log, index) => {
        const Icon = actionIcons[log.action] || Clock
        const colorClass = actionColors[log.action] || 'text-[#646A73] bg-[#F7F8FA]'
        const label = actionLabels[log.action] || log.action

        return (
          <div key={log.id} className="flex gap-3 relative">
            {/* Timeline line */}
            {index < displayedLogs.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-[#DEE0E3]" />
            )}

            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colorClass} flex items-center justify-center relative z-10`}>
              <Icon size={18} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1F2329]">{label}</div>
                  {log.details && (
                    <div className="text-xs text-[#646A73] mt-0.5 line-clamp-2">{log.details}</div>
                  )}
                </div>
                <div className="text-xs text-[#8F959E] flex-shrink-0">
                  {formatDistanceToNow(log.created_at)}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {logs.length > 10 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#646A73] hover:text-[#1F2329] transition-colors"
        >
          <span>查看更多</span>
          <ChevronDown size={16} />
        </button>
      )}
    </div>
  )
}
