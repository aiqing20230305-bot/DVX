import React from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ResponsiveContainer } from 'recharts'

// 深色主题配色
const COLORS = ['#635BFF', '#8B85FF', '#FF6B6B', '#FFB74D', '#4CAF50', '#E91E63', '#FF9800', '#9C27B0']

interface ChartProps {
  data: Array<{ name: string; value: number }>
  width?: number
  height?: number
}

/**
 * 洞察分布饼图
 */
export function InsightDistributionChart({ data, width = 400, height = 300 }: ChartProps) {
  return (
    <div style={{ width, height, background: '#1A1A1A', padding: '20px', borderRadius: '8px' }}>
      <h3 style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '10px', textAlign: 'center' }}>
        洞察类型分布
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(entry) => `${entry.name}: ${entry.value}`}
            labelLine={{ stroke: '#A3A3A3' }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#0D0D0D', border: '1px solid #333333', color: '#FFFFFF' }}
          />
          <Legend
            wrapperStyle={{ color: '#A3A3A3' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * 选题优先级柱状图
 */
export function TopicPriorityChart({ data, width = 400, height = 300 }: ChartProps) {
  return (
    <div style={{ width, height, background: '#1A1A1A', padding: '20px', borderRadius: '8px' }}>
      <h3 style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '10px', textAlign: 'center' }}>
        选题优先级分布
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
          <XAxis dataKey="name" stroke="#A3A3A3" />
          <YAxis stroke="#A3A3A3" />
          <Tooltip
            contentStyle={{ background: '#0D0D0D', border: '1px solid #333333', color: '#FFFFFF' }}
          />
          <Bar dataKey="value" fill="#635BFF" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * 时间线活动趋势图
 */
interface TimelineChartProps {
  data: Array<{ date: string; count: number }>
  width?: number
  height?: number
}

export function TimelineActivityChart({ data, width = 600, height = 300 }: TimelineChartProps) {
  return (
    <div style={{ width, height, background: '#1A1A1A', padding: '20px', borderRadius: '8px' }}>
      <h3 style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '10px', textAlign: 'center' }}>
        最近7天活动趋势
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
          <XAxis dataKey="date" stroke="#A3A3A3" />
          <YAxis stroke="#A3A3A3" />
          <Tooltip
            contentStyle={{ background: '#0D0D0D', border: '1px solid #333333', color: '#FFFFFF' }}
          />
          <Line type="monotone" dataKey="count" stroke="#635BFF" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
