import React, { useState, useMemo } from 'react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useInsightStore } from '../../store/insight.store.js'
import { useTopicStore } from '../../store/topic.store.js'
import { useScriptStore } from '../../store/script.store.js'

const COLORS = {
  douyin: '#FE2C55',
  kuaishou: '#FF6600',
  xiaohongshu: '#FF2442',
  insight: '#F59E0B',
  topic: '#3B82F6',
  script: '#8B5CF6'
}

type TimeRange = '7' | '30' | 'all'

export function DataChartsPanel() {
  const { insights } = useInsightStore()
  const { topics } = useTopicStore()
  const { scripts } = useScriptStore()
  const [timeRange, setTimeRange] = useState<TimeRange>('30')

  // Calculate date range
  const now = Date.now()
  const rangeMs = timeRange === 'all' ? Infinity : parseInt(timeRange) * 24 * 60 * 60 * 1000
  const startTime = now - rangeMs

  // Filter data by time range
  const filteredInsights = insights.filter(i => timeRange === 'all' || i.created_at >= startTime)
  const filteredTopics = topics.filter(t => timeRange === 'all' || t.created_at >= startTime)
  const filteredScripts = scripts.filter(s => timeRange === 'all' || s.created_at >= startTime)

  // Prepare trend data (group by day)
  const trendData = useMemo(() => {
    const dataMap: Record<string, { date: string; insights: number; topics: number; scripts: number }> = {}

    // Get all dates in range
    const days = timeRange === 'all' ? 30 : parseInt(timeRange)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      dataMap[dateStr] = { date: dateStr, insights: 0, topics: 0, scripts: 0 }
    }

    // Count by date
    filteredInsights.forEach(item => {
      const date = new Date(item.created_at)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      if (dataMap[dateStr]) dataMap[dateStr].insights++
    })

    filteredTopics.forEach(item => {
      const date = new Date(item.created_at)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      if (dataMap[dateStr]) dataMap[dateStr].topics++
    })

    filteredScripts.forEach(item => {
      const date = new Date(item.created_at)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
      if (dataMap[dateStr]) dataMap[dateStr].scripts++
    })

    return Object.values(dataMap)
  }, [filteredInsights, filteredTopics, filteredScripts, timeRange, now])

  // Prepare platform distribution data
  const platformData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredTopics.forEach(topic => {
      counts[topic.platform] = (counts[topic.platform] || 0) + 1
    })

    return [
      { name: '抖音', value: counts.douyin || 0, color: COLORS.douyin },
      { name: '快手', value: counts.kuaishou || 0, color: COLORS.kuaishou },
      { name: '小红书', value: counts.xiaohongshu || 0, color: COLORS.xiaohongshu }
    ].filter(item => item.value > 0)
  }, [filteredTopics])

  // Don't show if no data
  if (insights.length === 0 && topics.length === 0 && scripts.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#646A73]">数据统计</h3>
        <div className="flex gap-2">
          {(['7', '30', 'all'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-[#3370FF] text-white'
                  : 'bg-[#F7F8FA] text-[#646A73] hover:bg-[#DEE0E3]'
              }`}
            >
              {range === 'all' ? '全部' : `${range}天`}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend Chart */}
        <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-xl p-4">
          <h4 className="text-sm font-medium text-[#646A73] mb-4">数据生成趋势</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: 8,
                  fontSize: 12
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="insights" stroke={COLORS.insight} name="洞察" strokeWidth={2} />
              <Line type="monotone" dataKey="topics" stroke={COLORS.topic} name="选题" strokeWidth={2} />
              <Line type="monotone" dataKey="scripts" stroke={COLORS.script} name="脚本" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        {platformData.length > 0 && (
          <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-xl p-4">
            <h4 className="text-sm font-medium text-[#646A73] mb-4">平台分布</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
