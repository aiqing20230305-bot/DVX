import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

export interface Questionnaire {
  id: string
  title: string
  description?: string
  trigger_type: 'manual' | 'timed' | 'event'
  trigger_value?: string
  status: 'active' | 'archived'
  created_at: number
  updated_at: number
}

export interface Question {
  id: string
  questionnaire_id: string
  question_type: 'radio' | 'checkbox' | 'text' | 'rating'
  question_text: string
  options?: string // JSON array
  required: number // 0=optional, 1=required
  order_index: number
  created_at: number
}

export interface QuestionnaireWithQuestions extends Questionnaire {
  questions: Question[]
}

export interface QuestionnaireResponse {
  id: string
  session_id: string
  questionnaire_id: string
  question_id: string
  question_text: string
  question_type: string
  answer: string
  created_at: number
}

export interface QuestionnaireStats {
  questionnaire_id: string
  total_responses: number
  response_rate?: number
  question_stats: {
    question_id: string
    question_text: string
    question_type: string
    answer_distribution?: Record<string, number>
    average_rating?: number
    text_answers?: string[]
  }[]
}

export interface QuestionnaireTrigger {
  id: string
  session_id: string
  questionnaire_id: string
  trigger_rule: string // JSON
  triggered_at: number
  shown: number // 0=not shown, 1=shown
  answered: number // 0=not answered, 1=answered
  response_id?: string
  created_at: number
}

export interface TriggerStats {
  questionnaire_id: string
  total_triggers: number
  shown_count: number
  answered_count: number
  answer_rate: number
}

export class QuestionnaireRepository {
  constructor(private db: Database.Database) {}

  /**
   * Create a new questionnaire
   */
  createQuestionnaire(data: Omit<Questionnaire, 'id' | 'created_at' | 'updated_at'>): Questionnaire {
    const id = randomUUID()
    const now = Date.now()

    const stmt = this.db.prepare(`
      INSERT INTO questionnaires (
        id, title, description, trigger_type, trigger_value, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.title,
      data.description || null,
      data.trigger_type,
      data.trigger_value || null,
      data.status,
      now,
      now
    )

    return {
      id,
      ...data,
      created_at: now,
      updated_at: now
    }
  }

  /**
   * Find all questionnaires
   */
  findAll(filters?: { status?: string }): Questionnaire[] {
    let query = 'SELECT * FROM questionnaires'
    const params: any[] = []

    if (filters?.status) {
      query += ' WHERE status = ?'
      params.push(filters.status)
    }

    query += ' ORDER BY created_at DESC'

    const stmt = this.db.prepare(query)
    return stmt.all(...params) as Questionnaire[]
  }

  /**
   * Find questionnaire by ID
   */
  findById(id: string): Questionnaire | undefined {
    const stmt = this.db.prepare('SELECT * FROM questionnaires WHERE id = ?')
    return stmt.get(id) as Questionnaire | undefined
  }

  /**
   * Find questionnaire with questions
   */
  findByIdWithQuestions(id: string): QuestionnaireWithQuestions | undefined {
    const questionnaire = this.findById(id)
    if (!questionnaire) return undefined

    const questions = this.findQuestionsByQuestionnaireId(id)

    return {
      ...questionnaire,
      questions
    }
  }

  /**
   * Update questionnaire
   */
  updateQuestionnaire(id: string, data: Partial<Omit<Questionnaire, 'id' | 'created_at' | 'updated_at'>>): boolean {
    const now = Date.now()
    const fields: string[] = []
    const values: any[] = []

    if (data.title !== undefined) {
      fields.push('title = ?')
      values.push(data.title)
    }
    if (data.description !== undefined) {
      fields.push('description = ?')
      values.push(data.description)
    }
    if (data.trigger_type !== undefined) {
      fields.push('trigger_type = ?')
      values.push(data.trigger_type)
    }
    if (data.trigger_value !== undefined) {
      fields.push('trigger_value = ?')
      values.push(data.trigger_value)
    }
    if (data.status !== undefined) {
      fields.push('status = ?')
      values.push(data.status)
    }

    if (fields.length === 0) return false

    fields.push('updated_at = ?')
    values.push(now)
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE questionnaires SET ${fields.join(', ')} WHERE id = ?
    `)

    const result = stmt.run(...values)
    return result.changes > 0
  }

  /**
   * Delete questionnaire
   */
  deleteQuestionnaire(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM questionnaires WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  /**
   * Create a question
   */
  createQuestion(data: Omit<Question, 'id' | 'created_at'>): Question {
    const id = randomUUID()
    const now = Date.now()

    const stmt = this.db.prepare(`
      INSERT INTO questions (
        id, questionnaire_id, question_type, question_text, options, required, order_index, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.questionnaire_id,
      data.question_type,
      data.question_text,
      data.options || null,
      data.required,
      data.order_index,
      now
    )

    return {
      id,
      ...data,
      created_at: now
    }
  }

  /**
   * Find questions by questionnaire ID
   */
  findQuestionsByQuestionnaireId(questionnaireId: string): Question[] {
    const stmt = this.db.prepare(`
      SELECT * FROM questions WHERE questionnaire_id = ? ORDER BY order_index ASC
    `)
    return stmt.all(questionnaireId) as Question[]
  }

  /**
   * Update question
   */
  updateQuestion(id: string, data: Partial<Omit<Question, 'id' | 'questionnaire_id' | 'created_at'>>): boolean {
    const fields: string[] = []
    const values: any[] = []

    if (data.question_type !== undefined) {
      fields.push('question_type = ?')
      values.push(data.question_type)
    }
    if (data.question_text !== undefined) {
      fields.push('question_text = ?')
      values.push(data.question_text)
    }
    if (data.options !== undefined) {
      fields.push('options = ?')
      values.push(data.options)
    }
    if (data.required !== undefined) {
      fields.push('required = ?')
      values.push(data.required)
    }
    if (data.order_index !== undefined) {
      fields.push('order_index = ?')
      values.push(data.order_index)
    }

    if (fields.length === 0) return false

    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE questions SET ${fields.join(', ')} WHERE id = ?
    `)

    const result = stmt.run(...values)
    return result.changes > 0
  }

  /**
   * Delete question
   */
  deleteQuestion(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM questions WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  /**
   * Submit questionnaire response
   */
  submitResponse(sessionId: string, questionnaireId: string, answers: Array<{
    question_id: string
    question_text: string
    question_type: string
    answer: string
  }>): QuestionnaireResponse[] {
    const now = Date.now()
    const responses: QuestionnaireResponse[] = []

    const stmt = this.db.prepare(`
      INSERT INTO feedback_responses (
        id, session_id, questionnaire_id, question_id, question_text, question_type, answer, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const answer of answers) {
      const id = randomUUID()
      stmt.run(
        id,
        sessionId,
        questionnaireId,
        answer.question_id,
        answer.question_text,
        answer.question_type,
        answer.answer,
        now
      )

      responses.push({
        id,
        session_id: sessionId,
        questionnaire_id: questionnaireId,
        question_id: answer.question_id,
        question_text: answer.question_text,
        question_type: answer.question_type,
        answer: answer.answer,
        created_at: now
      })
    }

    return responses
  }

  /**
   * Get questionnaire responses
   */
  getResponses(questionnaireId: string): QuestionnaireResponse[] {
    const stmt = this.db.prepare(`
      SELECT * FROM feedback_responses
      WHERE questionnaire_id = ?
      ORDER BY created_at DESC
    `)
    return stmt.all(questionnaireId) as QuestionnaireResponse[]
  }

  /**
   * Get questionnaire statistics
   */
  getStats(questionnaireId: string): QuestionnaireStats {
    // Get total responses (unique sessions)
    const totalStmt = this.db.prepare(`
      SELECT COUNT(DISTINCT session_id) as total
      FROM feedback_responses
      WHERE questionnaire_id = ?
    `)
    const totalResult = totalStmt.get(questionnaireId) as { total: number }

    // Get questions
    const questions = this.findQuestionsByQuestionnaireId(questionnaireId)

    // Get question stats
    const questionStats = questions.map(question => {
      const responsesStmt = this.db.prepare(`
        SELECT answer FROM feedback_responses
        WHERE questionnaire_id = ? AND question_id = ?
      `)
      const responses = responsesStmt.all(questionnaireId, question.id) as { answer: string }[]

      const stat: any = {
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type
      }

      // Calculate stats based on question type
      if (question.question_type === 'radio' || question.question_type === 'checkbox') {
        const distribution: Record<string, number> = {}
        responses.forEach(r => {
          distribution[r.answer] = (distribution[r.answer] || 0) + 1
        })
        stat.answer_distribution = distribution
      } else if (question.question_type === 'rating') {
        const ratings = responses.map(r => parseFloat(r.answer)).filter(n => !isNaN(n))
        const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        stat.average_rating = Math.round(average * 10) / 10
      } else if (question.question_type === 'text') {
        stat.text_answers = responses.map(r => r.answer)
      }

      return stat
    })

    return {
      questionnaire_id: questionnaireId,
      total_responses: totalResult.total,
      question_stats: questionStats
    }
  }

  /**
   * Record a trigger event
   */
  recordTrigger(
    sessionId: string,
    questionnaireId: string,
    triggerRule: object,
    shown: boolean
  ): QuestionnaireTrigger {
    const id = randomUUID()
    const now = Date.now()

    const stmt = this.db.prepare(`
      INSERT INTO questionnaire_triggers (
        id, session_id, questionnaire_id, trigger_rule, triggered_at, shown, answered, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      sessionId,
      questionnaireId,
      JSON.stringify(triggerRule),
      now,
      shown ? 1 : 0,
      0,
      now
    )

    return {
      id,
      session_id: sessionId,
      questionnaire_id: questionnaireId,
      trigger_rule: JSON.stringify(triggerRule),
      triggered_at: now,
      shown: shown ? 1 : 0,
      answered: 0,
      created_at: now
    }
  }

  /**
   * Update trigger as answered
   */
  markTriggerAnswered(triggerId: string, responseId: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE questionnaire_triggers
      SET answered = 1, response_id = ?
      WHERE id = ?
    `)

    const result = stmt.run(responseId, triggerId)
    return result.changes > 0
  }

  /**
   * Check if questionnaire has been triggered in this session
   */
  hasTriggered(sessionId: string, questionnaireId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM questionnaire_triggers
      WHERE session_id = ? AND questionnaire_id = ?
    `)

    const result = stmt.get(sessionId, questionnaireId) as { count: number }
    return result.count > 0
  }

  /**
   * Get trigger history for a questionnaire
   */
  getTriggerHistory(questionnaireId: string): QuestionnaireTrigger[] {
    const stmt = this.db.prepare(`
      SELECT * FROM questionnaire_triggers
      WHERE questionnaire_id = ?
      ORDER BY triggered_at DESC
    `)

    return stmt.all(questionnaireId) as QuestionnaireTrigger[]
  }

  /**
   * Get trigger statistics
   */
  getTriggerStats(questionnaireId: string): TriggerStats {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_triggers,
        SUM(shown) as shown_count,
        SUM(answered) as answered_count
      FROM questionnaire_triggers
      WHERE questionnaire_id = ?
    `)

    const result = stmt.get(questionnaireId) as {
      total_triggers: number
      shown_count: number
      answered_count: number
    }

    const answerRate = result.shown_count > 0
      ? Math.round((result.answered_count / result.shown_count) * 100)
      : 0

    return {
      questionnaire_id: questionnaireId,
      total_triggers: result.total_triggers || 0,
      shown_count: result.shown_count || 0,
      answered_count: result.answered_count || 0,
      answer_rate: answerRate
    }
  }
}
