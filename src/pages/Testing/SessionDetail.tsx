import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTestingStore } from '../../store/testing.store.js'
import { ArrowLeft, Clock, User, Calendar, MessageSquare, Activity, PlayCircle, StopCircle, FileText } from 'lucide-react'
import { startTestingTracking, stopTestingTracking, isTestingTrackingActive } from '../../hooks/useTestingTracker.js'
import { toast } from '../../store/toast.store.js'
import { QuestionnaireDialog } from '../../components/testing/QuestionnaireDialog.js'
import { useQuestionnaireStore } from '../../store/questionnaire.store.js'
import { useTriggerEngine } from '../../hooks/useTriggerEngine.js'

export function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentSession, actions, feedback, loading, fetchSessionById, fetchActions, fetchFeedback } = useTestingStore()

  useEffect(() => {
    if (id) {
      fetchSessionById(id)
      fetchActions(id)
      fetchFeedback(id)
    }
  }, [id, fetchSessionById, fetchActions, fetchFeedback])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDuration = (start: number, end: number | null) => {
    if (!end) return '进行中...'
    const duration = end - start
    const minutes = Math.floor(duration / 1000 / 60)
    const seconds = Math.floor((duration / 1000) % 60)
    return `${minutes}分${seconds}秒`
  }

  const getActionIcon = (type: string) => {
    const iconClass = "text-slate-500"
    switch (type) {
      case 'navigate':
        return '🔗'
      case 'click':
        return '👆'
      case 'input':
        return '⌨️'
      case 'scroll':
        return '📜'
      case 'error':
        return '❌'
      case 'success':
        return '✅'
      case 'confusion':
        return '❓'
      default:
        return '📌'
    }
  }

  if (loading || !currentSession) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">加载中...</div>
      </div>
    )
  }

  const [isTracking, setIsTracking] = useState(() => {
    const trackingSessionId = localStorage.getItem('testing_session_id')
    return trackingSessionId === id
  })

  const [showQuestionnaireDialog, setShowQuestionnaireDialog] = useState(false)
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null)
  const [showQuestionnaireList, setShowQuestionnaireList] = useState(false)

  const { questionnaires, fetchQuestionnaires } = useQuestionnaireStore()

  useEffect(() => {
    fetchQuestionnaires({ status: 'active' })
  }, [fetchQuestionnaires])

  // Trigger engine - automatically show questionnaires based on user behavior
  useTriggerEngine({
    enabled: isTracking && currentSession?.status === 'active',
    sessionId: id || null,
    onTrigger: (questionnaireId) => {
      setSelectedQuestionnaireId(questionnaireId)
      setShowQuestionnaireDialog(true)
    }
  })

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTestingTracking()
      setIsTracking(false)
      toast.success('追踪已停止', '不再记录用户操作')
    } else {
      if (id) {
        startTestingTracking(id)
        setIsTracking(true)
        toast.success('追踪已启动', '自动记录用户操作')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/testing')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">会话详情</h1>
            <p className="text-sm text-slate-400 mt-1">{currentSession.scenario}</p>
          </div>
        </div>

        {/* Controls */}
        {currentSession.status === 'active' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowQuestionnaireList(!showQuestionnaireList)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <FileText size={18} />
                发送问卷
              </button>

              {showQuestionnaireList && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {questionnaires.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      暂无可用问卷
                    </div>
                  ) : (
                    questionnaires.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          setSelectedQuestionnaireId(q.id)
                          setShowQuestionnaireDialog(true)
                          setShowQuestionnaireList(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 text-sm border-b border-slate-700 last:border-b-0 transition-colors"
                      >
                        {q.title}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleToggleTracking}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                isTracking
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isTracking ? (
                <>
                  <StopCircle size={18} />
                  停止追踪
                </>
              ) : (
                <>
                  <PlayCircle size={18} />
                  启动追踪
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Session Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <User size={16} />
              用户信息
            </div>
            <div className="text-slate-100 font-medium">{currentSession.user_name}</div>
            <div className="text-slate-500 text-sm">{currentSession.user_role}</div>
            {currentSession.user_email && (
              <div className="text-slate-600 text-xs mt-1">{currentSession.user_email}</div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Clock size={16} />
              测试时长
            </div>
            <div className="text-slate-100 font-medium">
              {formatDuration(currentSession.start_time, currentSession.end_time)}
            </div>
            <div className="text-slate-500 text-sm">
              {currentSession.status === 'active' ? '测试中' : '已结束'}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Calendar size={16} />
              开始时间
            </div>
            <div className="text-slate-100 font-medium">
              {new Date(currentSession.start_time).toLocaleString('zh-CN')}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Activity size={16} />
              统计
            </div>
            <div className="text-slate-100 font-medium">{actions.length} 个操作</div>
            <div className="text-slate-500 text-sm">{feedback.length} 条反馈</div>
          </div>
        </div>

        {currentSession.notes && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="text-slate-400 text-sm mb-2">备注</div>
            <div className="text-slate-300">{currentSession.notes}</div>
          </div>
        )}
      </div>

      {/* Actions Timeline */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">操作时间线</h2>
        {actions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">暂无操作记录</div>
        ) : (
          <div className="space-y-3">
            {actions.map((action, index) => (
              <div
                key={action.id}
                className="flex items-start gap-4 p-3 bg-slate-900/50 rounded-lg"
              >
                <div className="text-2xl">{getActionIcon(action.action_type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-slate-300 font-medium">{action.action_type}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 text-sm">{action.page}</span>
                    {action.target && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-500 text-sm">{action.target}</span>
                      </>
                    )}
                  </div>
                  {action.details && (
                    <div className="text-slate-500 text-sm">{action.details}</div>
                  )}
                </div>
                <div className="text-slate-600 text-xs">
                  {formatTime(action.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={20} className="text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-100">用户反馈</h2>
        </div>
        {feedback.length === 0 ? (
          <div className="text-center py-8 text-slate-500">暂无反馈</div>
        ) : (
          <div className="space-y-4">
            {feedback.map(item => (
              <div key={item.id} className="p-4 bg-slate-900/50 rounded-lg">
                <div className="text-slate-300 font-medium mb-2">{item.question_text}</div>
                <div className="text-slate-400">{item.answer}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questionnaire Dialog */}
      {showQuestionnaireDialog && selectedQuestionnaireId && id && (
        <QuestionnaireDialog
          questionnaireId={selectedQuestionnaireId}
          sessionId={id}
          onClose={() => {
            setShowQuestionnaireDialog(false)
            setSelectedQuestionnaireId(null)
          }}
          onSubmit={() => {
            // Refresh feedback list
            fetchFeedback(id)
          }}
        />
      )}
    </div>
  )
}
