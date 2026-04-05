import React, { useState, useEffect } from 'react'
import { X, Star } from 'lucide-react'
import { useQuestionnaireStore, Question } from '../../store/questionnaire.store.js'
import { toast } from '../../store/toast.store.js'

interface QuestionnaireDialogProps {
  questionnaireId: string
  sessionId: string
  onClose: () => void
  onSubmit?: () => void
}

export function QuestionnaireDialog({ questionnaireId, sessionId, onClose, onSubmit }: QuestionnaireDialogProps) {
  const { currentQuestionnaire, fetchQuestionnaireById, submitQuestionnaire } = useQuestionnaireStore()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuestionnaireById(questionnaireId)
  }, [questionnaireId, fetchQuestionnaireById])

  const handleSubmit = async () => {
    if (!currentQuestionnaire) return

    // Validate required questions
    const requiredQuestions = currentQuestionnaire.questions.filter(q => q.required === 1)
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id] || answers[q.id].trim() === '')

    if (missingAnswers.length > 0) {
      toast.error('请回答所有必答题', '')
      return
    }

    setSubmitting(true)

    try {
      // Convert answers to submission format
      const answerArray = currentQuestionnaire.questions.map(q => ({
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        answer: answers[q.id] || ''
      })).filter(a => a.answer)

      await submitQuestionnaire(questionnaireId, sessionId, answerArray)

      toast.success('提交成功', '感谢您的反馈')
      onSubmit?.()
      onClose()
    } catch (error) {
      toast.error('提交失败', '请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRadioChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentAnswer = answers[questionId] || ''
    const currentOptions = currentAnswer ? currentAnswer.split(',') : []

    let newOptions: string[]
    if (checked) {
      newOptions = [...currentOptions, option]
    } else {
      newOptions = currentOptions.filter(o => o !== option)
    }

    setAnswers({ ...answers, [questionId]: newOptions.join(',') })
  }

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers({ ...answers, [questionId]: rating.toString() })
  }

  if (!currentQuestionnaire) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{currentQuestionnaire.title}</h2>
            {currentQuestionnaire.description && (
              <p className="text-sm text-slate-400 mt-1">{currentQuestionnaire.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentQuestionnaire.questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <label className="block text-slate-200 font-medium">
                {index + 1}. {question.question_text}
                {question.required === 1 && <span className="text-red-500 ml-1">*</span>}
              </label>

              {/* Radio */}
              {question.question_type === 'radio' && (
                <div className="space-y-2 ml-4">
                  {question.options && JSON.parse(question.options).map((option: string) => (
                    <label key={option} className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-slate-100">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleRadioChange(question.id, e.target.value)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {/* Checkbox */}
              {question.question_type === 'checkbox' && (
                <div className="space-y-2 ml-4">
                  {question.options && JSON.parse(question.options).map((option: string) => {
                    const currentOptions = answers[question.id] ? answers[question.id].split(',') : []
                    return (
                      <label key={option} className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-slate-100">
                        <input
                          type="checkbox"
                          checked={currentOptions.includes(option)}
                          onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                          className="text-indigo-600 focus:ring-indigo-500 rounded"
                        />
                        {option}
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Text */}
              {question.question_type === 'text' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleTextChange(question.id, e.target.value)}
                  placeholder="请输入您的回答..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              )}

              {/* Rating */}
              {question.question_type === 'rating' && (
                <div className="flex items-center gap-2 ml-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(question.id, rating)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={32}
                        className={
                          answers[question.id] && parseInt(answers[question.id]) >= rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-slate-600'
                        }
                      />
                    </button>
                  ))}
                  {answers[question.id] && (
                    <span className="text-slate-400 ml-2">{answers[question.id]} 星</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          >
            稍后再说
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交答案'}
          </button>
        </div>
      </div>
    </div>
  )
}
