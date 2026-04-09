import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, FileText, PenTool, FileCheck } from 'lucide-react'
import { useInsightStore } from '../../store/insight.store.js'
import { useTopicStore } from '../../store/topic.store.js'
import { useScriptStore } from '../../store/script.store.js'

export function ProjectStatsPanel() {
  const navigate = useNavigate()
  const { insights, selectedIds: insightSelectedIds } = useInsightStore()
  const { topics, selectedIds: topicSelectedIds } = useTopicStore()
  const { scripts } = useScriptStore()

  // Calculate stats
  const insightTotal = insights.length
  const insightSelected = insightSelectedIds.size
  const topicTotal = topics.length
  const topicSelected = topicSelectedIds.size
  const scriptTotal = scripts.length
  const uniqueTopicsWithScripts = new Set(scripts.map(s => s.topic_id)).size

  const stats = [
    {
      id: 'insights',
      label: '洞察',
      icon: Lightbulb,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      value: insightTotal,
      subValue: insightSelected > 0 ? `已选 ${insightSelected} 条` : '未选择',
      route: '/insights',
      isEmpty: insightTotal === 0
    },
    {
      id: 'topics',
      label: '选题',
      icon: FileText,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      value: topicTotal,
      subValue: topicSelected > 0 ? `已选 ${topicSelected} 个` : '未选择',
      route: '/topics',
      isEmpty: topicTotal === 0
    },
    {
      id: 'scripts',
      label: '脚本',
      icon: PenTool,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      value: scriptTotal,
      subValue: uniqueTopicsWithScripts > 0 ? `${uniqueTopicsWithScripts} 个选题` : '未生成',
      route: '/scripts',
      isEmpty: scriptTotal === 0
    },
    {
      id: 'report',
      label: '报告',
      icon: FileCheck,
      iconColor: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      value: scriptTotal > 0 ? '可生成' : '待生成',
      subValue: scriptTotal > 0 ? '数据已就绪' : '需先完成脚本',
      route: '/report',
      isEmpty: false,
      isText: true
    }
  ]

  // Don't show if no data
  if (insightTotal === 0 && topicTotal === 0 && scriptTotal === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-[#646A73] mb-3">项目进度</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <button
              key={stat.id}
              onClick={() => navigate(stat.route)}
              className={`
                relative p-4 rounded-xl border ${stat.borderColor} ${stat.bgColor}
                hover:bg-[#DEE0E3]/30 transition-all duration-200
                text-left group
              `}
            >
              {/* Icon */}
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={stat.iconColor} />
                <span className="text-xs font-medium text-[#646A73]">{stat.label}</span>
              </div>

              {/* Value */}
              <div className="mb-1">
                {stat.isText ? (
                  <div className={`text-lg font-bold ${stat.isEmpty ? 'text-[#8F959E]' : stat.iconColor}`}>
                    {stat.value}
                  </div>
                ) : (
                  <div className={`text-2xl font-bold ${stat.isEmpty ? 'text-[#8F959E]' : 'text-[#1F2329]'}`}>
                    {stat.value}
                  </div>
                )}
              </div>

              {/* Sub value */}
              <div className="text-xs text-[#8F959E]">
                {stat.subValue}
              </div>

              {/* Hover arrow */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-[#8F959E]">→</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
