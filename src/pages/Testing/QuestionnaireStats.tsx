import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuestionnaireStore } from '../../store/questionnaire.store.js'
import { ArrowLeft, Users, MessageSquare } from 'lucide-react'

export function QuestionnaireStats() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentQuestionnaire, stats, loading, fetchQuestionnaireById, fetchStats } = useQuestionnaireStore()

  useEffect(() => {
    if (id) {
      fetchQuestionnaireById(id)
      fetchStats(id)
    }
  }, [id, fetchQuestionnaireById, fetchStats])

  if (loading || !currentQuestionnaire || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#646A73]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/testing/questionnaires')}
          className="p-2 hover:bg-[#F7F8FA] rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-[#646A73]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1F2329]">{currentQuestionnaire.title}</h1>
          <p className="text-sm text-[#646A73] mt-1">问卷统计</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-[#5B8EFF]" />
            <h3 className="text-[#646A73] font-medium">总回答数</h3>
          </div>
          <p className="text-3xl font-bold text-[#1F2329]">{stats.total_responses}</p>
        </div>

        <div className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare size={20} className="text-green-400" />
            <h3 className="text-[#646A73] font-medium">问题数量</h3>
          </div>
          <p className="text-3xl font-bold text-[#1F2329]">{currentQuestionnaire.questions.length}</p>
        </div>
      </div>

      {/* Question Stats */}
      <div className="space-y-4">
        {stats.question_stats.map((questionStat, index) => (
          <div key={questionStat.question_id} className="bg-[#F7F8FA] border border-[#DEE0E3] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[#1F2329] mb-4">
              {index + 1}. {questionStat.question_text}
              <span className="text-sm text-[#8F959E] ml-2">
                ({questionStat.question_type === 'radio' ? '单选' :
                  questionStat.question_type === 'checkbox' ? '多选' :
                  questionStat.question_type === 'text' ? '文本' : '评分'})
              </span>
            </h3>

            {/* Radio/Checkbox Distribution */}
            {(questionStat.question_type === 'radio' || questionStat.question_type === 'checkbox') && questionStat.answer_distribution && (
              <div className="space-y-2">
                {Object.entries(questionStat.answer_distribution).map(([option, count]) => {
                  const percentage = stats.total_responses > 0
                    ? Math.round((count / stats.total_responses) * 100)
                    : 0

                  return (
                    <div key={option}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#646A73]">{option}</span>
                        <span className="text-[#646A73]">{count} 人 ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-[#F2F3F5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3370FF] rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rating Average */}
            {questionStat.question_type === 'rating' && questionStat.average_rating !== undefined && (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-[#1F2329]">{questionStat.average_rating}</span>
                  <span className="text-[#646A73]">/ 5.0</span>
                </div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(questionStat.average_rating!)
                          ? 'text-yellow-500'
                          : 'text-[#DEE0E3]'
                      }`}
                    >
                      ★
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Answers */}
            {questionStat.question_type === 'text' && questionStat.text_answers && (
              <div className="space-y-2">
                {questionStat.text_answers.length === 0 ? (
                  <p className="text-[#8F959E] text-sm">暂无回答</p>
                ) : (
                  questionStat.text_answers.map((answer, i) => (
                    <div key={i} className="bg-[#F2F3F5]/50 rounded p-3">
                      <p className="text-[#646A73] text-sm">{answer}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
