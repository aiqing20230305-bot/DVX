import { getDb } from '../index.js'
import { randomUUID } from 'crypto'

export interface TestSession {
  id: string
  user_name: string
  user_role: string
  user_email: string | null
  scenario: string
  status: 'active' | 'completed' | 'abandoned'
  start_time: number
  end_time: number | null
  notes: string | null
  created_at: number
  updated_at: number
}

export interface UserAction {
  id: string
  session_id: string
  action_type: 'click' | 'navigate' | 'input' | 'scroll' | 'error' | 'success' | 'confusion'
  page: string
  target: string | null
  details: string | null
  timestamp: number
}

export interface FeedbackResponse {
  id: string
  session_id: string
  question_id: string
  question_text: string
  answer: string
  created_at: number
}

class TestSessionRepository {
  // Test Sessions
  createSession(data: {
    user_name: string
    user_role: string
    user_email?: string
    scenario: string
  }): TestSession {
    const db = getDb()
    const now = Date.now()
    const session: TestSession = {
      id: randomUUID(),
      user_name: data.user_name,
      user_role: data.user_role,
      user_email: data.user_email || null,
      scenario: data.scenario,
      status: 'active',
      start_time: now,
      end_time: null,
      notes: null,
      created_at: now,
      updated_at: now
    }

    db.prepare(`
      INSERT INTO test_sessions (id, user_name, user_role, user_email, scenario, status, start_time, end_time, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      session.user_name,
      session.user_role,
      session.user_email,
      session.scenario,
      session.status,
      session.start_time,
      session.end_time,
      session.notes,
      session.created_at,
      session.updated_at
    )

    return session
  }

  findAll(): TestSession[] {
    const db = getDb()
    return db.prepare('SELECT * FROM test_sessions ORDER BY created_at DESC').all() as TestSession[]
  }

  findById(id: string): TestSession | null {
    const db = getDb()
    return db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(id) as TestSession | null
  }

  updateSession(id: string, data: {
    status?: 'active' | 'completed' | 'abandoned'
    end_time?: number
    notes?: string
  }): void {
    const db = getDb()
    const now = Date.now()
    const updates: string[] = []
    const values: any[] = []

    if (data.status) {
      updates.push('status = ?')
      values.push(data.status)
    }
    if (data.end_time !== undefined) {
      updates.push('end_time = ?')
      values.push(data.end_time)
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?')
      values.push(data.notes)
    }

    updates.push('updated_at = ?')
    values.push(now)
    values.push(id)

    db.prepare(`UPDATE test_sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }

  completeSession(id: string, notes?: string): void {
    this.updateSession(id, {
      status: 'completed',
      end_time: Date.now(),
      notes
    })
  }

  // User Actions
  createAction(data: {
    session_id: string
    action_type: UserAction['action_type']
    page: string
    target?: string
    details?: string
  }): UserAction {
    const db = getDb()
    const action: UserAction = {
      id: randomUUID(),
      session_id: data.session_id,
      action_type: data.action_type,
      page: data.page,
      target: data.target || null,
      details: data.details || null,
      timestamp: Date.now()
    }

    db.prepare(`
      INSERT INTO user_actions (id, session_id, action_type, page, target, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      action.id,
      action.session_id,
      action.action_type,
      action.page,
      action.target,
      action.details,
      action.timestamp
    )

    return action
  }

  findActionsBySession(sessionId: string): UserAction[] {
    const db = getDb()
    return db.prepare('SELECT * FROM user_actions WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId) as UserAction[]
  }

  // Feedback Responses
  createFeedback(data: {
    session_id: string
    question_id: string
    question_text: string
    answer: string
  }): FeedbackResponse {
    const db = getDb()
    const feedback: FeedbackResponse = {
      id: randomUUID(),
      session_id: data.session_id,
      question_id: data.question_id,
      question_text: data.question_text,
      answer: data.answer,
      created_at: Date.now()
    }

    db.prepare(`
      INSERT INTO feedback_responses (id, session_id, question_id, question_text, answer, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      feedback.id,
      feedback.session_id,
      feedback.question_id,
      feedback.question_text,
      feedback.answer,
      feedback.created_at
    )

    return feedback
  }

  findFeedbackBySession(sessionId: string): FeedbackResponse[] {
    const db = getDb()
    return db.prepare('SELECT * FROM feedback_responses WHERE session_id = ? ORDER BY created_at ASC').all(sessionId) as FeedbackResponse[]
  }

  // Statistics
  getSessionStats(sessionId: string): {
    duration: number | null
    actionCount: number
    feedbackCount: number
    pageViews: { [page: string]: number }
    confusionPoints: UserAction[]
  } {
    const session = this.findById(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const actions = this.findActionsBySession(sessionId)
    const feedback = this.findFeedbackBySession(sessionId)

    const duration = session.end_time ? session.end_time - session.start_time : null

    const pageViews: { [page: string]: number } = {}
    actions.forEach(action => {
      if (action.action_type === 'navigate') {
        pageViews[action.page] = (pageViews[action.page] || 0) + 1
      }
    })

    const confusionPoints = actions.filter(action => action.action_type === 'confusion' || action.action_type === 'error')

    return {
      duration,
      actionCount: actions.length,
      feedbackCount: feedback.length,
      pageViews,
      confusionPoints
    }
  }

  // Overall statistics
  getOverallStats(): {
    totalSessions: number
    completedSessions: number
    averageDuration: number
    totalActions: number
    mostVisitedPages: Array<{ page: string; count: number }>
  } {
    const db = getDb()

    const sessions = this.findAll()
    const completedSessions = sessions.filter(s => s.status === 'completed')

    const durations = completedSessions
      .filter(s => s.end_time)
      .map(s => s.end_time! - s.start_time)
    const averageDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0

    const totalActions = db.prepare('SELECT COUNT(*) as count FROM user_actions').get() as { count: number }

    const pageVisits = db.prepare(`
      SELECT page, COUNT(*) as count
      FROM user_actions
      WHERE action_type = 'navigate'
      GROUP BY page
      ORDER BY count DESC
      LIMIT 10
    `).all() as Array<{ page: string; count: number }>

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      averageDuration,
      totalActions: totalActions.count,
      mostVisitedPages: pageVisits
    }
  }

  // Get comprehensive testing report
  getTestingReport(filters?: { start?: number; end?: number }): any {
    const db = getDb()

    // Build session filter
    let sessionFilter = ''
    const params: any[] = []
    if (filters?.start || filters?.end) {
      const conditions: string[] = []
      if (filters.start) {
        conditions.push('start_time >= ?')
        params.push(filters.start)
      }
      if (filters.end) {
        conditions.push('start_time <= ?')
        params.push(filters.end)
      }
      sessionFilter = ' WHERE ' + conditions.join(' AND ')
    }

    // Get sessions with stats
    const sessions = db.prepare(`
      SELECT
        s.*,
        (SELECT COUNT(*) FROM user_actions WHERE session_id = s.id) as action_count,
        (SELECT COUNT(*) FROM feedback_responses WHERE session_id = s.id) as feedback_count
      FROM test_sessions s
      ${sessionFilter}
      ORDER BY s.start_time DESC
    `).all(...params) as any[]

    const sessionsData = sessions.map(s => ({
      id: s.id,
      user_name: s.user_name,
      user_role: s.user_role,
      scenario: s.scenario,
      status: s.status,
      start_time: s.start_time,
      end_time: s.end_time,
      duration: s.end_time ? s.end_time - s.start_time : null,
      action_count: s.action_count,
      feedback_count: s.feedback_count
    }))

    // Calculate overview
    const activeSessions = sessions.filter(s => s.status === 'active').length
    const completedSessions = sessions.filter(s => s.status === 'completed').length
    const durations = sessions.filter(s => s.end_time).map(s => s.end_time - s.start_time)
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
    const totalActions = sessions.reduce((sum, s) => sum + s.action_count, 0)
    const totalFeedback = sessions.reduce((sum, s) => sum + s.feedback_count, 0)

    // Get questionnaires with stats
    const questionnaires = db.prepare(`
      SELECT
        q.*,
        (SELECT COUNT(DISTINCT session_id) FROM feedback_responses WHERE questionnaire_id = q.id) as total_responses
      FROM questionnaires q
      WHERE q.status = 'active'
    `).all() as any[]

    const questionnairesData = questionnaires.map(q => {
      const questions = db.prepare('SELECT * FROM questions WHERE questionnaire_id = ? ORDER BY order_index').all(q.id) as any[]

      return {
        id: q.id,
        title: q.title,
        total_responses: q.total_responses,
        questions: questions.map(question => {
          const responses = db.prepare(`
            SELECT answer FROM feedback_responses
            WHERE questionnaire_id = ? AND question_id = ?
          `).all(q.id, question.id) as any[]

          const stat: any = {
            question_text: question.question_text,
            question_type: question.question_type
          }

          if (question.question_type === 'radio' || question.question_type === 'checkbox') {
            const distribution: Record<string, number> = {}
            responses.forEach(r => {
              distribution[r.answer] = (distribution[r.answer] || 0) + 1
            })
            stat.answer_distribution = distribution
          } else if (question.question_type === 'rating') {
            const ratings = responses.map(r => parseFloat(r.answer)).filter(n => !isNaN(n))
            stat.average_rating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
          } else if (question.question_type === 'text') {
            stat.text_answers = responses.map(r => r.answer)
          }

          return stat
        })
      }
    })

    const questionnaireAnswerRate = questionnaires.length > 0 && sessions.length > 0
      ? Math.round((questionnaires.reduce((sum, q) => sum + q.total_responses, 0) / questionnaires.length / sessions.length) * 100)
      : 0

    // Get actions with user names
    const sessionIds = sessions.map(s => s.id)
    const actions = sessionIds.length > 0 ? db.prepare(`
      SELECT
        ua.*,
        ts.user_name
      FROM user_actions ua
      JOIN test_sessions ts ON ua.session_id = ts.id
      WHERE ua.session_id IN (${sessionIds.map(() => '?').join(',')})
      ORDER BY ua.timestamp DESC
      LIMIT 1000
    `).all(...sessionIds) as any[] : []

    // Get feedback with user names
    const feedback = sessionIds.length > 0 ? db.prepare(`
      SELECT
        fr.*,
        ts.user_name
      FROM feedback_responses fr
      JOIN test_sessions ts ON fr.session_id = ts.id
      WHERE fr.session_id IN (${sessionIds.map(() => '?').join(',')})
      ORDER BY fr.created_at DESC
      LIMIT 500
    `).all(...sessionIds) as any[] : []

    return {
      overview: {
        total_sessions: sessions.length,
        active_sessions: activeSessions,
        completed_sessions: completedSessions,
        avg_duration: avgDuration,
        total_actions: totalActions,
        total_feedback: totalFeedback,
        total_questionnaires: questionnaires.length,
        questionnaire_answer_rate: questionnaireAnswerRate
      },
      sessions: sessionsData,
      questionnaires: questionnairesData,
      actions,
      feedback
    }
  }
}

export const testSessionRepo = new TestSessionRepository()
