import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuestionnaireStore, Question } from '../../store/questionnaire.store.js'
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from '../../store/toast.store.js'

interface QuestionForm {
  question_type: 'radio' | 'checkbox' | 'text' | 'rating'
  question_text: string
  options: string[]
  required: boolean
}

export function QuestionnaireEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = id !== 'new'

  const { currentQuestionnaire, loading, fetchQuestionnaireById, createQuestionnaire, updateQuestionnaire, addQuestion, deleteQuestion } = useQuestionnaireStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<'manual' | 'timed' | 'event'>('manual')
  const [triggerValue, setTriggerValue] = useState('')

  const [questions, setQuestions] = useState<QuestionForm[]>([])
  const [showAddQuestion, setShowAddQuestion] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      fetchQuestionnaireById(id)
    }
  }, [id, isEdit, fetchQuestionnaireById])

  useEffect(() => {
    if (isEdit && currentQuestionnaire) {
      setTitle(currentQuestionnaire.title)
      setDescription(currentQuestionnaire.description || '')
      setTriggerType(currentQuestionnaire.trigger_type)
      setTriggerValue(currentQuestionnaire.trigger_value || '')

      // Convert questions to form format
      const formQuestions: QuestionForm[] = currentQuestionnaire.questions.map(q => ({
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options ? JSON.parse(q.options) : [],
        required: q.required === 1
      }))
      setQuestions(formQuestions)
    }
  }, [isEdit, currentQuestionnaire])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('标题不能为空', '')
      return
    }

    if (questions.length === 0) {
      toast.error('至少添加一个问题', '')
      return
    }

    try {
      if (isEdit && id) {
        // Update existing questionnaire
        await updateQuestionnaire(id, {
          title: title.trim(),
          description: description.trim() || undefined,
          trigger_type: triggerType,
          trigger_value: triggerValue.trim() || undefined
        })

        // Delete all existing questions and re-add (simpler than sync)
        if (currentQuestionnaire) {
          for (const q of currentQuestionnaire.questions) {
            await deleteQuestion(q.id)
          }
        }

        // Add new questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          await addQuestion(id, {
            ...q,
            order_index: i
          })
        }

        toast.success('问卷已更新', '')
      } else {
        // Create new questionnaire
        const newQuestionnaire = await createQuestionnaire({
          title: title.trim(),
          description: description.trim() || undefined,
          trigger_type: triggerType,
          trigger_value: triggerValue.trim() || undefined
        })

        // Add questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i]
          await addQuestion(newQuestionnaire.id, {
            ...q,
            order_index: i
          })
        }

        toast.success('问卷已创建', '')
      }

      navigate('/testing/questionnaires')
    } catch (error) {
      toast.error('保存失败', '请稍后重试')
    }
  }

  const addNewQuestion = () => {
    setQuestions([...questions, {
      question_type: 'radio',
      question_text: '',
      options: ['选项1', '选项2'],
      required: false
    }])
    setShowAddQuestion(false)
  }

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newQuestions = [...questions]
      ;[newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]]
      setQuestions(newQuestions)
    } else if (direction === 'down' && index < questions.length - 1) {
      const newQuestions = [...questions]
      ;[newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]]
      setQuestions(newQuestions)
    }
  }

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions]
    const optionNumber = newQuestions[questionIndex].options.length + 1
    newQuestions[questionIndex].options.push(`选项${optionNumber}`)
    setQuestions(newQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options[optionIndex] = value
    setQuestions(newQuestions)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex)
    setQuestions(newQuestions)
  }

  if (loading && isEdit) {
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
          <h1 className="text-2xl font-bold text-slate-100">
            {isEdit ? '编辑问卷' : '创建问卷'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">配置问卷信息和问题</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            问卷标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如: 用户满意度调查"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            问卷描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简要说明问卷目的..."
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              触发方式
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="manual">手动触发</option>
              <option value="timed">定时触发（未实现）</option>
              <option value="event">事件触发</option>
            </select>
          </div>

          {triggerType === 'event' && (
            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  触发规则类型
                </label>
                <select
                  value={(() => {
                    try {
                      const rule = JSON.parse(triggerValue || '{}')
                      return rule.type || 'click'
                    } catch {
                      return 'click'
                    }
                  })()}
                  onChange={(e) => {
                    const ruleType = e.target.value
                    setTriggerValue(JSON.stringify({
                      type: ruleType,
                      selector: ruleType === 'click' ? 'button' : '',
                      path: ruleType === 'page' ? '/' : '',
                      description: ''
                    }))
                  }}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="click">点击特定元素</option>
                  <option value="page">访问特定页面</option>
                </select>
              </div>

              {(() => {
                try {
                  const rule = JSON.parse(triggerValue || '{}')
                  if (rule.type === 'click') {
                    return (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          元素选择器 (CSS Selector)
                        </label>
                        <input
                          type="text"
                          value={rule.selector || ''}
                          onChange={(e) => {
                            setTriggerValue(JSON.stringify({ ...rule, selector: e.target.value }))
                          }}
                          placeholder="例如: button.generate-insights"
                          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )
                  } else if (rule.type === 'page') {
                    return (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          页面路径
                        </label>
                        <input
                          type="text"
                          value={rule.path || ''}
                          onChange={(e) => {
                            setTriggerValue(JSON.stringify({ ...rule, path: e.target.value }))
                          }}
                          placeholder="例如: /insights"
                          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )
                  }
                  return null
                } catch {
                  return null
                }
              })()}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  规则描述
                </label>
                <input
                  type="text"
                  value={(() => {
                    try {
                      const rule = JSON.parse(triggerValue || '{}')
                      return rule.description || ''
                    } catch {
                      return ''
                    }
                  })()}
                  onChange={(e) => {
                    try {
                      const rule = JSON.parse(triggerValue || '{}')
                      setTriggerValue(JSON.stringify({ ...rule, description: e.target.value }))
                    } catch {
                      setTriggerValue(JSON.stringify({ description: e.target.value }))
                    }
                  }}
                  placeholder="例如: 点击生成洞察按钮后触发"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">问题列表</h2>
          <button
            onClick={addNewQuestion}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm flex items-center gap-1 transition-colors"
          >
            <Plus size={16} />
            添加问题
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            暂无问题，点击"添加问题"开始
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-slate-400 font-medium">{index + 1}.</span>
                      <select
                        value={question.question_type}
                        onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="radio">单选题</option>
                        <option value="checkbox">多选题</option>
                        <option value="text">文本题</option>
                        <option value="rating">评分题</option>
                      </select>
                      <label className="flex items-center gap-1 text-sm text-slate-400">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                          className="rounded"
                        />
                        必答
                      </label>
                    </div>

                    <input
                      type="text"
                      value={question.question_text}
                      onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                      placeholder="输入问题..."
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 mb-2"
                    />

                    {/* Options for radio/checkbox */}
                    {(question.question_type === 'radio' || question.question_type === 'checkbox') && (
                      <div className="space-y-2 ml-6">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <span className="text-slate-500 text-sm">
                              {question.question_type === 'radio' ? '○' : '☐'}
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                            />
                            {question.options.length > 2 && (
                              <button
                                onClick={() => removeOption(index, optionIndex)}
                                className="p-1 hover:bg-red-600/10 text-red-500 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(index)}
                          className="text-sm text-indigo-400 hover:text-indigo-300 ml-6"
                        >
                          + 添加选项
                        </button>
                      </div>
                    )}

                    {/* Hint for other types */}
                    {question.question_type === 'text' && (
                      <p className="text-xs text-slate-500 ml-6">用户将输入文本回答</p>
                    )}
                    {question.question_type === 'rating' && (
                      <p className="text-xs text-slate-500 ml-6">用户将选择1-5星评分</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-700 text-slate-400 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="上移"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                      className="p-1 hover:bg-slate-700 text-slate-400 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="下移"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="p-1 hover:bg-red-600/10 text-red-500 rounded"
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

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => navigate('/testing/questionnaires')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '保存问卷'}
        </button>
      </div>
    </div>
  )
}
