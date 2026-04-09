import React, { useState, useRef } from 'react'
import { Zap, CheckCircle2, Loader2, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '../shared/Button.js'
import { toast } from '../../store/toast.store.js'
import { useProjectStore } from '../../store/project.store.js'
import { useInsightStore } from '../../store/insight.store.js'
import { useTopicStore } from '../../store/topic.store.js'
import { useScriptStore } from '../../store/script.store.js'
import { insightApi } from '../../api/insight.api.js'
import { topicApi } from '../../api/topic.api.js'
import { scriptApi } from '../../api/script.api.js'
import { api } from '../../api/client.js'
import { useNavigate } from 'react-router-dom'

type Step = 'insights' | 'topics' | 'scripts' | 'report'
type StepStatus = 'pending' | 'running' | 'completed' | 'error'

interface StepInfo {
  status: StepStatus
  label: string
  count?: number
  error?: string
}

export function AutoGeneratePanel() {
  const navigate = useNavigate()
  const { activeProjectId } = useProjectStore()
  const { insights, setInsights } = useInsightStore()
  const { topics, setTopics } = useTopicStore()
  const { scripts, setScripts } = useScriptStore()

  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [steps, setSteps] = useState<Record<Step, StepInfo>>({
    insights: { status: 'pending', label: '生成洞察' },
    topics: { status: 'pending', label: '生成选题' },
    scripts: { status: 'pending', label: '生成脚本' },
    report: { status: 'pending', label: '生成报告' }
  })
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const cancelledRef = useRef(false)

  const updateStep = (step: Step, updates: Partial<StepInfo>) => {
    setSteps(prev => ({
      ...prev,
      [step]: { ...prev[step], ...updates }
    }))
  }

  const resetState = () => {
    setStatus('idle')
    setSteps({
      insights: { status: 'pending', label: '生成洞察' },
      topics: { status: 'pending', label: '生成选题' },
      scripts: { status: 'pending', label: '生成脚本' },
      report: { status: 'pending', label: '生成报告' }
    })
    setAbortController(null)
    cancelledRef.current = false
  }

  const handleCancel = () => {
    cancelledRef.current = true
    abortController?.abort()
    resetState()
    toast.info('已取消', '生成已取消，可以重新开始')
  }

  const handleGenerate = async () => {
    if (!activeProjectId) {
      toast.error('错误', '请先选择项目')
      return
    }

    // Create abort controller
    const controller = new AbortController()
    setAbortController(controller)
    cancelledRef.current = false

    setStatus('running')
    toast.info('开始生成', '正在自动执行完整工作流...')

    try {
      // Step 1: Generate Insights
      if (cancelledRef.current) return
      updateStep('insights', { status: 'running' })

      const insightsResponse = await insightApi.generateStream(activeProjectId)
      const insightsReader = insightsResponse.body?.getReader()
      const insightsDecoder = new TextDecoder()

      if (insightsReader) {
        let buffer = ''
        while (true) {
          const { done, value } = await insightsReader.read()
          if (done) break

          buffer += insightsDecoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (data.insights) {
                setInsights(data.insights)
              }
            }
          }
        }
      }

      // Refresh insights
      const { insights: freshInsights } = await insightApi.listByProject(activeProjectId)
      setInsights(freshInsights)
      updateStep('insights', { status: 'completed', count: freshInsights.length })

      // Step 2: Generate Topics
      if (cancelledRef.current) return
      updateStep('topics', { status: 'running' })

      const insightIds = freshInsights.map(i => i.id)
      const topicsResponse = await topicApi.generateStream(activeProjectId, insightIds)
      const topicsReader = topicsResponse.body?.getReader()
      const topicsDecoder = new TextDecoder()

      if (topicsReader) {
        let buffer = ''
        while (true) {
          const { done, value } = await topicsReader.read()
          if (done) break

          buffer += topicsDecoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (data.topics) {
                setTopics(data.topics)
              }
            }
          }
        }
      }

      // Refresh topics
      const { topics: freshTopics } = await topicApi.listByProject(activeProjectId)
      setTopics(freshTopics)
      updateStep('topics', { status: 'completed', count: freshTopics.length })

      // Step 3: Generate Scripts (only for top 8 high-priority topics)
      if (cancelledRef.current) return
      updateStep('scripts', { status: 'running' })

      // Select top 8 topics by priority
      const topTopics = freshTopics
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 8)

      // Generate scripts in parallel for better performance
      await Promise.all(
        topTopics.map(async (topic) => {
          try {
            const scriptsResponse = await scriptApi.generateStream(activeProjectId, topic.id)
            const scriptsReader = scriptsResponse.body?.getReader()
            const scriptsDecoder = new TextDecoder()

            if (scriptsReader) {
              let buffer = ''
              while (true) {
                const { done, value } = await scriptsReader.read()
                if (done) break

                buffer += scriptsDecoder.decode(value, { stream: true })
                // Process script stream data
              }
            }
          } catch (error) {
            console.error(`Failed to generate script for topic ${topic.id}:`, error)
          }
        })
      )

      // Refresh scripts
      const { scripts: freshScripts } = await scriptApi.listByProject(activeProjectId)
      setScripts(freshScripts)
      updateStep('scripts', { status: 'completed', count: freshScripts.length })

      // Step 4: Generate Report
      if (cancelledRef.current) return
      updateStep('report', { status: 'running' })

      await api.post('/report/generate', { projectId: activeProjectId })
      updateStep('report', { status: 'completed' })

      // Success
      if (!cancelledRef.current) {
        setStatus('success')
        toast.success('生成完成！', '战略报告已生成，点击"查看报告"查看结果')
      }

    } catch (error) {
      // Check if it's an abort error (user cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        return // Already handled by handleCancel
      }

      // Don't show error if cancelled
      if (cancelledRef.current) {
        return
      }

      console.error('Auto-generate failed:', error)
      setStatus('error')
      toast.error('生成失败', error instanceof Error ? error.message : '请稍后重试')
    } finally {
      setAbortController(null)
    }
  }

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={18} className="text-emerald-400" />
      case 'running':
        return <Loader2 size={18} className="text-[#5B8EFF] animate-spin" />
      case 'error':
        return <XCircle size={18} className="text-red-400" />
      default:
        return <div className="w-[18px] h-[18px] rounded-full border-2 border-[#C9CDD4]" />
    }
  }

  if (status === 'running' || status === 'success' || status === 'error') {
    return (
      <div className="mb-6 bg-[#F7F8FA] border border-[#DEE0E3] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#1F2329]">
            {status === 'success' ? '✅ 生成完成' : status === 'error' ? '❌ 生成失败' : '⚡ 生成进度'}
          </h3>
          {status === 'running' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              icon={<XCircle size={14} />}
            >
              取消
            </Button>
          )}
        </div>

        <div className="space-y-3 mb-5">
          {(Object.entries(steps) as [Step, StepInfo][]).map(([key, step]) => (
            <div key={key} className="flex items-center gap-3">
              {getStepIcon(step.status)}
              <span className={`text-sm ${
                step.status === 'completed' ? 'text-[#646A73]' :
                step.status === 'running' ? 'text-[#5B8EFF]' :
                step.status === 'error' ? 'text-red-600' :
                'text-[#8F959E]'
              }`}>
                {step.label}
                {step.count !== undefined && ` (${step.count})`}
              </span>
            </div>
          ))}
        </div>

        {status === 'success' && (
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/report')}
              className="flex-1"
            >
              查看报告
            </Button>
            <Button
              variant="secondary"
              onClick={resetState}
            >
              重新生成
            </Button>
          </div>
        )}

        {status === 'error' && (
          <Button
            variant="secondary"
            onClick={resetState}
            className="w-full"
          >
            重试
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="mb-6 bg-[#3370FF]/8 border border-[#3370FF]/20 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#3370FF]/15 border border-[#3370FF]/30 flex items-center justify-center">
          <Zap size={24} className="text-[#3370FF]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#1F2329] mb-1">一键生成战略报告</h3>
          <p className="text-sm text-[#646A73] mb-4">
            上传数据后，自动执行完整工作流：洞察生成 → 选题策划 → 脚本创作 → 战略报告
          </p>
          <Button
            size="lg"
            icon={<Zap size={16} />}
            onClick={handleGenerate}
            disabled={!activeProjectId}
          >
            🚀 一键生成
          </Button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#3370FF]/10">
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="text-[#3370FF]/60 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#646A73]">
            生成过程需要几分钟时间，请耐心等待。您可以最小化窗口，完成后会有通知提示。
          </p>
        </div>
      </div>
    </div>
  )
}
