import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTestingStore } from '../../store/testing.store.js'
import { Clock, User, CheckCircle, XCircle, PlayCircle } from 'lucide-react'

export function TestingSessions() {
  const navigate = useNavigate()
  const { sessions, loading, fetchSessions } = useTestingStore()

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const formatDuration = (start: number, end: number | null) => {
    if (!end) return '进行中...'
    const duration = end - start
    const minutes = Math.floor(duration / 1000 / 60)
    const seconds = Math.floor((duration / 1000) % 60)
    return `${minutes}分${seconds}秒`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'completed':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'abandoned':
        return 'text-red-400 bg-red-400/10 border-red-400/30'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayCircle size={14} />
      case 'completed':
        return <CheckCircle size={14} />
      case 'abandoned':
        return <XCircle size={14} />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中'
      case 'completed':
        return '已完成'
      case 'abandoned':
        return '已放弃'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">测试会话管理</h1>
          <p className="text-sm text-slate-400 mt-1">查看和管理用户测试会话</p>
        </div>
        <button
          onClick={() => navigate('/testing/start')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          启动新测试
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">总会话数</div>
          <div className="text-2xl font-bold text-slate-100">{sessions.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">进行中</div>
          <div className="text-2xl font-bold text-blue-400">
            {sessions.filter(s => s.status === 'active').length}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">已完成</div>
          <div className="text-2xl font-bold text-green-400">
            {sessions.filter(s => s.status === 'completed').length}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">平均时长</div>
          <div className="text-2xl font-bold text-slate-100">
            {sessions.filter(s => s.end_time).length > 0
              ? Math.floor(
                  sessions
                    .filter(s => s.end_time)
                    .reduce((acc, s) => acc + (s.end_time! - s.start_time), 0) /
                    sessions.filter(s => s.end_time).length /
                    1000 /
                    60
                ) + '分'
              : '-'}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            暂无测试会话
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              onClick={() => navigate(`/testing/session/${session.id}`)}
              className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-indigo-500/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(session.status)}`}>
                    {getStatusIcon(session.status)}
                    {getStatusText(session.status)}
                  </div>
                  <div className="text-slate-300 font-medium">{session.scenario}</div>
                </div>
                <div className="text-sm text-slate-400">
                  {formatTime(session.created_at)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-slate-500" />
                  <span className="text-slate-400">{session.user_name}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500">{session.user_role}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-slate-500" />
                  <span className="text-slate-400">
                    {formatDuration(session.start_time, session.end_time)}
                  </span>
                </div>

                {session.notes && (
                  <div className="text-sm text-slate-500 truncate">
                    备注: {session.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
