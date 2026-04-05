import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuestionnaireStore } from '../store/questionnaire.store.js'

const API_BASE = 'http://localhost:3001/api/questionnaire'

interface TriggerRule {
  type: 'click' | 'page' | 'duration' | 'sequence'
  selector?: string
  path?: string
  duration?: number
  steps?: string[]
  description?: string
}

interface ActiveQuestionnaire {
  id: string
  title: string
  trigger_rule: TriggerRule
}

interface TriggerEngineOptions {
  enabled?: boolean
  sessionId: string | null
  onTrigger?: (questionnaireId: string) => void
}

/**
 * Trigger Engine Hook
 *
 * Monitors user behavior and automatically triggers questionnaires
 * based on configured rules
 */
export function useTriggerEngine(options: TriggerEngineOptions) {
  const { enabled = true, sessionId, onTrigger } = options
  const location = useLocation()
  const { questionnaires, fetchQuestionnaires } = useQuestionnaireStore()

  const [activeQuestionnaires, setActiveQuestionnaires] = useState<ActiveQuestionnaire[]>([])
  const pageEntryTime = useRef(Date.now())
  const durationTimers = useRef<Record<string, NodeJS.Timeout>>({})

  // Parse trigger rules from questionnaires
  useEffect(() => {
    if (!enabled || !sessionId) return

    const eventQuestionnaires = questionnaires
      .filter(q => q.trigger_type === 'event' && q.status === 'active' && q.trigger_value)
      .map(q => ({
        id: q.id,
        title: q.title,
        trigger_rule: JSON.parse(q.trigger_value!) as TriggerRule
      }))

    setActiveQuestionnaires(eventQuestionnaires)
  }, [questionnaires, enabled, sessionId])

  // Check if questionnaire has been triggered
  const checkTriggered = useCallback(async (questionnaireId: string): Promise<boolean> => {
    if (!sessionId) return true

    // Check localStorage first
    const triggered = localStorage.getItem('questionnaire_triggered')
    const data = triggered ? JSON.parse(triggered) : {}
    if (data[sessionId]?.[questionnaireId]) {
      return true
    }

    // Check server
    try {
      const response = await fetch(
        `${API_BASE}/${questionnaireId}/has-triggered?session_id=${sessionId}`
      )
      const result = await response.json()
      return result.has_triggered
    } catch (error) {
      console.error('Failed to check trigger status:', error)
      return false
    }
  }, [sessionId])

  // Record trigger event
  const recordTrigger = useCallback(async (
    questionnaireId: string,
    triggerRule: TriggerRule,
    shown: boolean
  ) => {
    if (!sessionId) return

    try {
      await fetch(`${API_BASE}/${questionnaireId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          trigger_rule: triggerRule,
          shown
        })
      })

      // Update localStorage
      if (shown) {
        const triggered = localStorage.getItem('questionnaire_triggered')
        const data = triggered ? JSON.parse(triggered) : {}
        if (!data[sessionId]) {
          data[sessionId] = {}
        }
        data[sessionId][questionnaireId] = {
          triggered_at: Date.now(),
          answered: false
        }
        localStorage.setItem('questionnaire_triggered', JSON.stringify(data))
      }
    } catch (error) {
      console.error('Failed to record trigger:', error)
    }
  }, [sessionId])

  // Trigger questionnaire
  const triggerQuestionnaire = useCallback(async (
    questionnaireId: string,
    triggerRule: TriggerRule
  ) => {
    // Check if already triggered
    const hasTriggered = await checkTriggered(questionnaireId)

    if (hasTriggered) {
      // Record trigger but don't show
      await recordTrigger(questionnaireId, triggerRule, false)
      return
    }

    // Record and show
    await recordTrigger(questionnaireId, triggerRule, true)
    onTrigger?.(questionnaireId)
  }, [checkTriggered, recordTrigger, onTrigger])

  // Handle page visit triggers
  useEffect(() => {
    if (!enabled || !sessionId) return

    pageEntryTime.current = Date.now()

    // Check page visit triggers
    activeQuestionnaires.forEach(q => {
      if (q.trigger_rule.type === 'page' && q.trigger_rule.path === location.pathname) {
        triggerQuestionnaire(q.id, q.trigger_rule)
      }
    })

    // Setup duration triggers
    activeQuestionnaires.forEach(q => {
      if (q.trigger_rule.type === 'duration' && q.trigger_rule.path === location.pathname) {
        const duration = (q.trigger_rule.duration || 30) * 1000

        const timer = setTimeout(() => {
          triggerQuestionnaire(q.id, q.trigger_rule)
        }, duration)

        durationTimers.current[q.id] = timer
      }
    })

    // Cleanup
    return () => {
      Object.values(durationTimers.current).forEach(timer => clearTimeout(timer))
      durationTimers.current = {}
    }
  }, [location.pathname, enabled, sessionId, activeQuestionnaires, triggerQuestionnaire])

  // Handle click triggers
  useEffect(() => {
    if (!enabled || !sessionId) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      activeQuestionnaires.forEach(q => {
        if (q.trigger_rule.type === 'click' && q.trigger_rule.selector) {
          // Check if clicked element matches selector
          if (target.matches(q.trigger_rule.selector) || target.closest(q.trigger_rule.selector)) {
            triggerQuestionnaire(q.id, q.trigger_rule)
          }
        }
      })
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [enabled, sessionId, activeQuestionnaires, triggerQuestionnaire])

  // Load active questionnaires
  useEffect(() => {
    if (enabled && sessionId) {
      fetchQuestionnaires({ status: 'active' })
    }
  }, [enabled, sessionId, fetchQuestionnaires])

  return {
    activeQuestionnaires,
    triggerQuestionnaire
  }
}
