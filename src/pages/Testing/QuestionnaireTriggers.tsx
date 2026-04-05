import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuestionnaireStore } from '../../store/questionnaire.store.js'
import { ArrowLeft, Activity, CheckCircle, XCircle, Clock } from 'lucide-react'

export function QuestionnaireTriggers() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentQuestionnaire, triggers, triggerStats, loading, fetchQuestionnaireById, fetchTriggers, fetchTriggerStats } = useQuestionnaireStore()

  useEffect(() => {
    if (id) {
      fetchQuestionnaireById(id)
      fetchTriggers(id)
      fetchTriggerStats(id)
    }
  }, [id, fetchQuestionnaireById, fetchTriggers, fetchTriggerStats])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const parseTriggerRule = (ruleStr: string) => {
    try {
      const rule = JSON.parse(ruleStr)
      return rule.description || `${rule.type} 触发`
    } catch {
      return '未知触发规则'
    }
  }

  if (loading || !currentQuestionnaire) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/testing/questionnaires')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{currentQuestionnaire.title}</h1>
          <p className="text-sm text-slate-400 mt-1">触发历史</p>
        </div>
      </div>

      {/* Stats */}
      {triggerStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-blue-400" />
              <h3 className="text-slate-300 text-sm">总触发次数</h3>
            </div>
            <p className="text-2xl font-bold text-slate-100">{triggerStats.total_triggers}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-green-400" />
              <h3 className="text-slate-300 text-sm">已弹出次数</h3>
            </div>
            <p className="text-2xl font-bold text-slate-100">{triggerStats.shown_count}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-indigo-400" />
              <h3 className="text-slate-300 text-sm">已回答次数</h3>
            </div>
            <p className="text-2xl font-bold text-slate-100">{triggerStats.answered_count}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-yellow-400" />
              <h3 className="text-slate-300 text-sm">回答完成率</h3>
            </div>
            <p className="text-2xl font-bold text-slate-100">{triggerStats.answer_rate}%</p>
          </div>
        </div>
      )}

      {/* Trigger History */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">触发记录</h2>

        {triggers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">暂无触发记录</div>
        ) : (
          <div className="space-y-3">
            {triggers.map((trigger) => (
              <div
                key={trigger.id}
                className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg"
              >
                {/* Status Icon */}
                <div>
                  {trigger.answered === 1 ? (
                    <CheckCircle size={24} className="text-green-500" />
                  ) : trigger.shown === 1 ? (
                    <Clock size={24} className="text-yellow-500" />
                  ) : (
                    <XCircle size={24} className="text-slate-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="text-slate-200 font-medium mb-1">
                    {parseTriggerRule(trigger.trigger_rule)}
                  </div>
                  <div className="text-sm text-slate-500">
                    {formatTime(trigger.triggered_at)}
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {trigger.answered === 1 ? (
                    <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                      已回答
                    </span>
                  ) : trigger.shown === 1 ? (
                    <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded">
                      已弹出
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-slate-700 text-slate-500 text-xs rounded">
                      未弹出
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
