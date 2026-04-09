import React, { useEffect, useState } from 'react'
import { FileDown, Calendar, Users, FileText, MousePointer, MessageSquare, TrendingUp, CheckCircle } from 'lucide-react'

const API_BASE = '/api/testing'

interface TestingReport {
  overview: {
    total_sessions: number
    active_sessions: number
    completed_sessions: number
    avg_duration: number
    total_actions: number
    total_feedback: number
    total_questionnaires: number
    questionnaire_answer_rate: number
  }
  sessions: Array<{
    id: string
    user_name: string
    user_role: string
    scenario: string
    status: string
    start_time: number
    end_time: number | null
    duration: number | null
    action_count: number
    feedback_count: number
  }>
  questionnaires: Array<{
    id: string
    title: string
    total_responses: number
    questions: Array<{
      question_text: string
      question_type: string
      answer_distribution?: Record<string, number>
      average_rating?: number
      text_answers?: string[]
    }>
  }>
  actions: Array<{
    session_id: string
    user_name: string
    action_type: string
    page: string
    target?: string
    details?: string
    timestamp: number
  }>
  feedback: Array<{
    session_id: string
    user_name: string
    question_text: string
    answer: string
    created_at: number
  }>
}

export function TestingReport() {
  const [report, setReport] = useState<TestingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  })

  const fetchReport = async (start?: string, end?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (start) params.append('start', new Date(start).getTime().toString())
      if (end) params.append('end', new Date(end).getTime().toString())

      const response = await fetch(`${API_BASE}/report?${params}`)
      const data = await response.json()
      setReport(data.report)
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const handleExport = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      if (dateRange.start) params.append('start', new Date(dateRange.start).getTime().toString())
      if (dateRange.end) params.append('end', new Date(dateRange.end).getTime().toString())

      const response = await fetch(`${API_BASE}/export/excel?${params}`)
      const blob = await response.blob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `测试报告_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleFilter = () => {
    fetchReport(dateRange.start, dateRange.end)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}分${secs}秒`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646A73]">加载中...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-16 text-[#8F959E]">
        暂无数据
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2329]">测试报告</h1>
          <p className="text-sm text-[#646A73] mt-1">查看测试数据统计和导出报告</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 bg-[#3370FF] hover:bg-[#1E4FD9] disabled:bg-[#DEE0E3] disabled:text-[#8F959E] text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <FileDown size={18} />
          {exporting ? '导出中...' : '导出Excel'}
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#646A73]" />
            <span className="text-sm text-[#646A73]">时间范围:</span>
          </div>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-1.5 bg-[#F2F3F5] border border-[#DEE0E3] rounded text-sm text-[#646A73] focus:outline-none focus:border-[#3370FF]"
          />
          <span className="text-[#8F959E]">~</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-1.5 bg-[#F2F3F5] border border-[#DEE0E3] rounded text-sm text-[#646A73] focus:outline-none focus:border-[#3370FF]"
          />
          <button
            onClick={handleFilter}
            className="px-4 py-1.5 bg-[#DEE0E3] hover:bg-[#C9CDD4] text-[#646A73] rounded text-sm transition-colors"
          >
            查询
          </button>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => {
                setDateRange({ start: '', end: '' })
                fetchReport()
              }}
              className="px-4 py-1.5 text-[#8F959E] hover:text-[#646A73] text-sm transition-colors"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div>
        <h2 className="text-lg font-semibold text-[#1F2329] mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-[#5B8EFF]" />
          测试概览
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-blue-400" />
              <div className="text-[#646A73] text-sm">总会话数</div>
            </div>
            <div className="text-3xl font-bold text-[#1F2329]">{report.overview.total_sessions}</div>
            <div className="text-xs text-[#8F959E] mt-1">
              活跃: {report.overview.active_sessions} · 完成: {report.overview.completed_sessions}
            </div>
          </div>

          <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-purple-400" />
              <div className="text-[#646A73] text-sm">问卷数量</div>
            </div>
            <div className="text-3xl font-bold text-[#1F2329]">{report.overview.total_questionnaires}</div>
            <div className="text-xs text-[#8F959E] mt-1">
              回答率: {report.overview.questionnaire_answer_rate}%
            </div>
          </div>

          <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer size={18} className="text-green-400" />
              <div className="text-[#646A73] text-sm">总操作数</div>
            </div>
            <div className="text-3xl font-bold text-[#1F2329]">{report.overview.total_actions}</div>
            <div className="text-xs text-[#8F959E] mt-1">
              平均时长: {formatDuration(report.overview.avg_duration)}
            </div>
          </div>

          <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={18} className="text-yellow-400" />
              <div className="text-[#646A73] text-sm">总反馈数</div>
            </div>
            <div className="text-3xl font-bold text-[#1F2329]">{report.overview.total_feedback}</div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div>
        <h2 className="text-lg font-semibold text-[#1F2329] mb-4 flex items-center gap-2">
          <Users size={20} className="text-[#5B8EFF]" />
          会话列表 ({report.sessions.length})
        </h2>
        <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F2F3F5]/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">场景</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">时长</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">反馈</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEE0E3]">
                {report.sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#8F959E]">
                      暂无会话数据
                    </td>
                  </tr>
                ) : (
                  report.sessions.map(session => (
                    <tr key={session.id} className="hover:bg-[#DEE0E3]/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-[#646A73]">{session.user_name}</td>
                      <td className="px-4 py-3 text-sm text-[#646A73]">{session.user_role}</td>
                      <td className="px-4 py-3 text-sm text-[#646A73]">{session.scenario}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          session.status === 'completed' ? 'bg-green-400/10 text-green-400 border border-green-400/30' :
                          session.status === 'active' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/30' :
                          'bg-red-400/10 text-red-400 border border-red-400/30'
                        }`}>
                          {session.status === 'completed' ? '已完成' : session.status === 'active' ? '进行中' : '已放弃'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#646A73]">
                        {session.duration ? formatDuration(Math.floor(session.duration / 1000)) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#646A73]">{session.action_count}</td>
                      <td className="px-4 py-3 text-sm text-[#646A73]">{session.feedback_count}</td>
                      <td className="px-4 py-3 text-sm text-[#646A73]">{formatTime(session.start_time)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Questionnaires */}
      <div>
        <h2 className="text-lg font-semibold text-[#1F2329] mb-4 flex items-center gap-2">
          <FileText size={20} className="text-[#5B8EFF]" />
          问卷分析 ({report.questionnaires.length})
        </h2>
        <div className="space-y-4">
          {report.questionnaires.length === 0 ? (
            <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-8 text-center text-[#8F959E]">
              暂无问卷数据
            </div>
          ) : (
            report.questionnaires.map(q => (
              <div key={q.id} className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#1F2329]">{q.title}</h3>
                  <div className="text-sm text-[#646A73]">
                    <CheckCircle size={16} className="inline mr-1" />
                    {q.total_responses} 次回答
                  </div>
                </div>
                <div className="space-y-3">
                  {q.questions.map((question, idx) => (
                    <div key={idx} className="bg-[#F2F3F5]/50 rounded p-3">
                      <div className="text-sm text-[#646A73] mb-2">{question.question_text}</div>
                      {question.answer_distribution && (
                        <div className="space-y-1">
                          {Object.entries(question.answer_distribution).map(([option, count]) => {
                            const total = Object.values(question.answer_distribution!).reduce((a, b) => a + b, 0)
                            const percentage = Math.round((count / total) * 100)
                            return (
                              <div key={option} className="flex items-center gap-2">
                                <div className="text-xs text-[#646A73] w-24 truncate">{option}</div>
                                <div className="flex-1 h-5 bg-[#F7F8FA] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#3370FF]"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <div className="text-xs text-[#646A73] w-12 text-right">
                                  {percentage}%
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {question.average_rating !== undefined && (
                        <div className="text-sm text-[#646A73]">
                          平均评分: <span className="text-[#5B8EFF] font-semibold">{question.average_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Actions */}
      <div>
        <h2 className="text-lg font-semibold text-[#1F2329] mb-4 flex items-center gap-2">
          <MousePointer size={20} className="text-[#5B8EFF]" />
          最近行为 (显示前50条)
        </h2>
        <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F2F3F5]/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">页面</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">目标</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#646A73] uppercase">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEE0E3]">
                {report.actions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#8F959E]">
                      暂无行为数据
                    </td>
                  </tr>
                ) : (
                  report.actions.slice(0, 50).map((action, idx) => (
                    <tr key={idx} className="hover:bg-[#DEE0E3]/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-[#646A73]">{action.user_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs bg-[#DEE0E3] text-[#646A73]">
                          {action.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#646A73]">{action.page}</td>
                      <td className="px-4 py-3 text-sm text-[#8F959E]">{action.target || '-'}</td>
                      <td className="px-4 py-3 text-sm text-[#646A73]">{formatTime(action.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div>
        <h2 className="text-lg font-semibold text-[#1F2329] mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-[#5B8EFF]" />
          最近反馈 (显示前30条)
        </h2>
        <div className="space-y-3">
          {report.feedback.length === 0 ? (
            <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-8 text-center text-[#8F959E]">
              暂无反馈数据
            </div>
          ) : (
            report.feedback.slice(0, 30).map((f, idx) => (
              <div key={idx} className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-[#646A73]">
                    <span className="text-[#646A73] font-medium">{f.user_name}</span>
                    <span className="mx-2 text-[#C9CDD4]">·</span>
                    <span>{formatTime(f.created_at)}</span>
                  </div>
                </div>
                <div className="text-sm text-[#646A73] mb-1">{f.question_text}</div>
                <div className="text-sm text-[#1F2329]">{f.answer}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
