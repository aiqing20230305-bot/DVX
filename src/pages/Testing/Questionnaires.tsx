import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuestionnaireStore } from '../../store/questionnaire.store.js'
import { Plus, FileText, Trash2, BarChart, Activity } from 'lucide-react'
import { toast } from '../../store/toast.store.js'

export function Questionnaires() {
  const navigate = useNavigate()
  const { questionnaires, loading, fetchQuestionnaires, deleteQuestionnaire } = useQuestionnaireStore()

  useEffect(() => {
    fetchQuestionnaires({ status: 'active' })
  }, [fetchQuestionnaires])

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`确定要删除问卷"${title}"吗？删除后所有相关问题和回答也会被删除。`)) {
      return
    }

    try {
      await deleteQuestionnaire(id)
      toast.success('删除成功', '问卷已删除')
    } catch (error) {
      toast.error('删除失败', '请稍后重试')
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
          <h1 className="text-2xl font-bold text-slate-100">测试问卷管理</h1>
          <p className="text-sm text-slate-400 mt-1">创建和管理用户测试问卷</p>
        </div>
        <button
          onClick={() => navigate('/testing/questionnaire/new')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          创建问卷
        </button>
      </div>

      {/* Questionnaire List */}
      {questionnaires.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <FileText size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">暂无问卷</h3>
          <p className="text-slate-500 mb-6">创建您的第一个测试问卷</p>
          <button
            onClick={() => navigate('/testing/questionnaire/new')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            创建问卷
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {questionnaires.map((questionnaire) => (
            <div
              key={questionnaire.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">
                    {questionnaire.title}
                  </h3>
                  {questionnaire.description && (
                    <p className="text-slate-400 text-sm mb-3">{questionnaire.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>
                      触发方式: {
                        questionnaire.trigger_type === 'manual' ? '手动' :
                        questionnaire.trigger_type === 'timed' ? '定时' : '事件'
                      }
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(questionnaire.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/testing/questionnaire/${questionnaire.id}/edit`)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => navigate(`/testing/questionnaire/${questionnaire.id}/stats`)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1 transition-colors"
                  >
                    <BarChart size={14} />
                    统计
                  </button>
                  {questionnaire.trigger_type === 'event' && (
                    <button
                      onClick={() => navigate(`/testing/questionnaire/${questionnaire.id}/triggers`)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm flex items-center gap-1 transition-colors"
                    >
                      <Activity size={14} />
                      触发
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(questionnaire.id, questionnaire.title)}
                    className="p-1.5 hover:bg-red-600/10 text-red-500 rounded transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
