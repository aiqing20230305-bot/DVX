import React, { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { Loader } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ActivityData {
  date: string
  count: number
}

interface ActivityHeatmapProps {
  projectId: string
  days?: number
}

export function ActivityHeatmap({ projectId, days = 30 }: ActivityHeatmapProps) {
  const [activity, setActivity] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivity()
  }, [projectId, days])

  const loadActivity = async () => {
    setLoading(true)
    try {
      const { activity } = await api.get<{ activity: ActivityData[] }>(
        `/project/${projectId}/activity?days=${days}`
      )
      setActivity(activity)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin text-[#3370FF]" size={24} />
      </div>
    )
  }

  if (activity.length === 0) {
    return (
      <div className="text-center text-[#8F959E] py-8">
        暂无活动数据
      </div>
    )
  }

  const chartData = activity.map(item => ({
    date: new Date(item.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
    活动次数: item.count
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0'
            }}
          />
          <Bar dataKey="活动次数" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
