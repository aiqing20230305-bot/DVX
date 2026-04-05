import express from 'express'
import { getDb } from '../db/index.js'
import { QuestionnaireRepository } from '../db/repositories/questionnaire.repo.js'

const router = express.Router()

/**
 * Create a new questionnaire
 * POST /api/questionnaire
 */
router.post('/', (req, res) => {
  try {
    const { title, description, trigger_type = 'manual', trigger_value, status = 'active' } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const validTriggerTypes = ['manual', 'timed', 'event']
    if (!validTriggerTypes.includes(trigger_type)) {
      return res.status(400).json({ error: 'Invalid trigger_type' })
    }

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const questionnaire = repo.createQuestionnaire({
      title: title.trim(),
      description: description?.trim(),
      trigger_type,
      trigger_value: trigger_value?.trim(),
      status
    })

    res.json(questionnaire)
  } catch (error: any) {
    console.error('Error creating questionnaire:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get all questionnaires
 * GET /api/questionnaire
 */
router.get('/', (req, res) => {
  try {
    const { status } = req.query

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const filters: any = {}
    if (status) {
      filters.status = status
    }

    const questionnaires = repo.findAll(filters)
    res.json(questionnaires)
  } catch (error: any) {
    console.error('Error fetching questionnaires:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get questionnaire by ID
 * GET /api/questionnaire/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const questionnaire = repo.findByIdWithQuestions(id)

    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' })
    }

    res.json(questionnaire)
  } catch (error: any) {
    console.error('Error fetching questionnaire:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Update questionnaire
 * PUT /api/questionnaire/:id
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const { title, description, trigger_type, trigger_value, status } = req.body

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const data: any = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description?.trim()
    if (trigger_type !== undefined) data.trigger_type = trigger_type
    if (trigger_value !== undefined) data.trigger_value = trigger_value?.trim()
    if (status !== undefined) data.status = status

    const updated = repo.updateQuestionnaire(id, data)

    if (!updated) {
      return res.status(404).json({ error: 'Questionnaire not found' })
    }

    const questionnaire = repo.findByIdWithQuestions(id)
    res.json(questionnaire)
  } catch (error: any) {
    console.error('Error updating questionnaire:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Delete questionnaire
 * DELETE /api/questionnaire/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const deleted = repo.deleteQuestionnaire(id)

    if (!deleted) {
      return res.status(404).json({ error: 'Questionnaire not found' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting questionnaire:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Add question to questionnaire
 * POST /api/questionnaire/:id/questions
 */
router.post('/:id/questions', (req, res) => {
  try {
    const { id } = req.params
    const { question_type, question_text, options, required = 0, order_index = 0 } = req.body

    if (!question_text || !question_text.trim()) {
      return res.status(400).json({ error: 'Question text is required' })
    }

    const validQuestionTypes = ['radio', 'checkbox', 'text', 'rating']
    if (!validQuestionTypes.includes(question_type)) {
      return res.status(400).json({ error: 'Invalid question_type' })
    }

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    // Verify questionnaire exists
    const questionnaire = repo.findById(id)
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' })
    }

    // Validate options for radio/checkbox
    if ((question_type === 'radio' || question_type === 'checkbox') && !options) {
      return res.status(400).json({ error: 'Options are required for radio/checkbox questions' })
    }

    const question = repo.createQuestion({
      questionnaire_id: id,
      question_type,
      question_text: question_text.trim(),
      options: options ? JSON.stringify(options) : undefined,
      required: required ? 1 : 0,
      order_index
    })

    res.json(question)
  } catch (error: any) {
    console.error('Error creating question:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get questions by questionnaire ID
 * GET /api/questionnaire/:id/questions
 */
router.get('/:id/questions', (req, res) => {
  try {
    const { id } = req.params

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const questions = repo.findQuestionsByQuestionnaireId(id)
    res.json(questions)
  } catch (error: any) {
    console.error('Error fetching questions:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Update question
 * PUT /api/question/:id
 */
router.put('/question/:id', (req, res) => {
  try {
    const { id } = req.params
    const { question_type, question_text, options, required, order_index } = req.body

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const data: any = {}
    if (question_type !== undefined) data.question_type = question_type
    if (question_text !== undefined) data.question_text = question_text.trim()
    if (options !== undefined) data.options = JSON.stringify(options)
    if (required !== undefined) data.required = required ? 1 : 0
    if (order_index !== undefined) data.order_index = order_index

    const updated = repo.updateQuestion(id, data)

    if (!updated) {
      return res.status(404).json({ error: 'Question not found' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error updating question:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Delete question
 * DELETE /api/question/:id
 */
router.delete('/question/:id', (req, res) => {
  try {
    const { id } = req.params

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const deleted = repo.deleteQuestion(id)

    if (!deleted) {
      return res.status(404).json({ error: 'Question not found' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting question:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Submit questionnaire response
 * POST /api/questionnaire/:id/submit
 */
router.post('/:id/submit', (req, res) => {
  try {
    const { id } = req.params
    const { session_id, answers } = req.body

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' })
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'answers array is required' })
    }

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    // Verify questionnaire exists
    const questionnaire = repo.findById(id)
    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' })
    }

    const responses = repo.submitResponse(session_id, id, answers)

    res.json(responses)
  } catch (error: any) {
    console.error('Error submitting questionnaire:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get questionnaire responses
 * GET /api/questionnaire/:id/responses
 */
router.get('/:id/responses', (req, res) => {
  try {
    const { id } = req.params

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const responses = repo.getResponses(id)
    res.json(responses)
  } catch (error: any) {
    console.error('Error fetching responses:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get questionnaire statistics
 * GET /api/questionnaire/:id/stats
 */
router.get('/:id/stats', (req, res) => {
  try {
    const { id } = req.params

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const stats = repo.getStats(id)
    res.json(stats)
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Record a trigger event
 * POST /api/questionnaire/:id/trigger
 */
router.post('/:id/trigger', (req, res) => {
  try {
    const { id } = req.params
    const { session_id, trigger_rule, shown = true } = req.body

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' })
    }

    if (!trigger_rule) {
      return res.status(400).json({ error: 'trigger_rule is required' })
    }

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const trigger = repo.recordTrigger(session_id, id, trigger_rule, shown)
    res.json(trigger)
  } catch (error: any) {
    console.error('Error recording trigger:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Check if questionnaire has been triggered
 * GET /api/questionnaire/:id/has-triggered?session_id=xxx
 */
router.get('/:id/has-triggered', (req, res) => {
  try {
    const { id } = req.params
    const { session_id } = req.query

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' })
    }

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const hasTriggered = repo.hasTriggered(session_id as string, id)
    res.json({ has_triggered: hasTriggered })
  } catch (error: any) {
    console.error('Error checking trigger:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get trigger history
 * GET /api/questionnaire/:id/triggers
 */
router.get('/:id/triggers', (req, res) => {
  try {
    const { id } = req.params

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const triggers = repo.getTriggerHistory(id)
    res.json(triggers)
  } catch (error: any) {
    console.error('Error fetching triggers:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get trigger statistics
 * GET /api/questionnaire/:id/trigger-stats
 */
router.get('/:id/trigger-stats', (req, res) => {
  try {
    const { id } = req.params

    const db = getDb()
    const repo = new QuestionnaireRepository(db)

    const stats = repo.getTriggerStats(id)
    res.json(stats)
  } catch (error: any) {
    console.error('Error fetching trigger stats:', error)
    res.status(500).json({ error: error.message })
  }
})

export { router as questionnaireRouter }
