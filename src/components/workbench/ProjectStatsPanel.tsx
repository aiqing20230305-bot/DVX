import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, FileText, PenTool, FileCheck, TrendingUp, CheckCircle2 } from 'lucide-react'
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
      iconColor: 'rgba(251, 191, 36, 1)', // amber-400
      bgColor: 'rgba(251, 191, 36, 0.1)',
      borderColor: 'rgba(251, 191, 36, 0.2)',
      value: insightTotal,
      subValue: insightSelected > 0 ? `已选 ${insightSelected} 条` : '未选择',
      route: '/insights',
      isEmpty: insightTotal === 0,
      progress: insightSelected > 0 && insightTotal > 0 ? (insightSelected / insightTotal) * 100 : 0,
      showProgress: insightTotal > 0,
      trend: insightTotal > 0 ? '+100%' : null
    },
    {
      id: 'topics',
      label: '选题',
      icon: FileText,
      iconColor: 'rgba(59, 130, 246, 1)', // blue-400
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
      value: topicTotal,
      subValue: topicSelected > 0 ? `已选 ${topicSelected} 个` : '未选择',
      route: '/topics',
      isEmpty: topicTotal === 0,
      progress: topicSelected > 0 && topicTotal > 0 ? (topicSelected / topicTotal) * 100 : 0,
      showProgress: topicTotal > 0,
      trend: topicTotal > 0 ? '+100%' : null
    },
    {
      id: 'scripts',
      label: '脚本',
      icon: PenTool,
      iconColor: 'rgba(168, 85, 247, 1)', // purple-400
      bgColor: 'rgba(168, 85, 247, 0.1)',
      borderColor: 'rgba(168, 85, 247, 0.2)',
      value: scriptTotal,
      subValue: uniqueTopicsWithScripts > 0 ? `${uniqueTopicsWithScripts} 个选题` : '未生成',
      route: '/scripts',
      isEmpty: scriptTotal === 0,
      progress: uniqueTopicsWithScripts > 0 && topicTotal > 0 ? (uniqueTopicsWithScripts / topicTotal) * 100 : 0,
      showProgress: topicTotal > 0 && scriptTotal > 0,
      trend: scriptTotal > 0 ? '+100%' : null
    },
    {
      id: 'report',
      label: '报告',
      icon: FileCheck,
      iconColor: 'rgba(16, 185, 129, 1)', // green-400
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.2)',
      value: scriptTotal > 0 ? '可生成' : '待生成',
      subValue: scriptTotal > 0 ? '数据已就绪' : '需先完成脚本',
      route: '/report',
      isEmpty: false,
      isText: true,
      progress: scriptTotal > 0 ? 100 : 0,
      showProgress: scriptTotal > 0,
      isComplete: scriptTotal > 0
    }
  ]

  // Don't show if no data
  if (insightTotal === 0 && topicTotal === 0 && scriptTotal === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        项目进度
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <button
              key={stat.id}
              onClick={() => navigate(stat.route)}
              className="relative p-5 rounded-xl border text-left group transition-all duration-200 hover:transform hover:-translateY-1"
              style={{
                backgroundColor: stat.bgColor,
                borderColor: stat.borderColor
              }}
            >
              {/* Icon with gradient background */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${stat.iconColor}, ${stat.iconColor}88)`
                  }}
                >
                  <Icon size={20} style={{ color: '#FFFFFF' }} />
                </div>
                {/* Trend indicator */}
                {stat.trend && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: stat.iconColor }}>
                    <TrendingUp size={12} />
                    <span className="font-medium">{stat.trend}</span>
                  </div>
                )}
                {/* Complete indicator */}
                {stat.isComplete && (
                  <CheckCircle2 size={16} style={{ color: stat.iconColor }} />
                )}
              </div>

              {/* Label */}
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                {stat.label}
              </div>

              {/* Value */}
              <div className="mb-2">
                {stat.isText ? (
                  <div className="text-lg font-bold" style={{ color: stat.isEmpty ? 'var(--color-text-disabled)' : stat.iconColor }}>
                    {stat.value}
                  </div>
                ) : (
                  <div className="text-3xl font-bold" style={{ color: stat.isEmpty ? 'var(--color-text-disabled)' : 'var(--color-text-primary)' }}>
                    {stat.value}
                  </div>
                )}
              </div>

              {/* Sub value */}
              <div className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                {stat.subValue}
              </div>

              {/* Progress bar */}
              {stat.showProgress && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-elevated-2)' }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${stat.progress}%`,
                        backgroundColor: stat.iconColor
                      }}
                    />
                  </div>
                  <div className="text-xs mt-1.5 font-medium" style={{ color: stat.iconColor }}>
                    {Math.round(stat.progress)}%
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
