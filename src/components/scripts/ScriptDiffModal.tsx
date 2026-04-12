import { useState, useEffect } from 'react'
import { X, GitCompare, Loader2, ChevronDown, ArrowRight, Eye, EyeOff, Download, Plus, Minus, Edit, XCircle, FileText, AlertTriangle, CheckCircle, XOctagon, MessageSquare } from 'lucide-react'
import { Script, ScriptSegment } from '../../types'
import { scriptApi } from '../../api/script.api.js'
import { toast } from '../../store/toast.store.js'
import { generateComparisonPDF, ComparisonData } from '../../utils/pdf-generator.js'

/**
 * Script history summary for version selection
 */
interface ScriptHistory {
  id: string
  version: number
  word_count: number
  created_at: string
}

/**
 * v2.21.0: Comparison history for quick repeat
 */
interface ComparisonHistory {
  id: string // UUID
  scriptId: string
  scriptTitle: string
  version1Id: string
  version1Label: string
  version2Id: string
  version2Label: string
  timestamp: number // Unix timestamp
}

/**
 * v2.22.0: Script annotation for version comparison
 * v2.24.0: Updated to match backend API with user info
 */
interface ScriptAnnotation {
  id: string // UUID
  script_id: string
  version1_id: string
  version2_id: string
  segment_key: string // `${type}-${segmentIndex}`
  annotation_type: 'warning' | 'confirmed' | 'needs_fix' | 'discussing'
  note?: string // Optional note
  user_id: string // v2.24.0: Creator user ID
  is_public: boolean // v2.24.0: Public or private annotation
  created_at: number // Unix timestamp
  updated_at: number // v2.24.0: Last update timestamp
  user?: { // v2.24.0: Optional user info from API
    id: string
    email: string
    name: string
  }
}

/**
 * Diff operation type
 */
type DiffOperation = 'added' | 'removed' | 'modified' | 'unchanged'

/**
 * Segment-level diff result
 */
interface SegmentDiff {
  segmentIndex: number
  type: DiffOperation
  oldSegment?: ScriptSegment
  newSegment?: ScriptSegment
  contentDiff?: Array<[number, string]>  // diff-match-patch format: [operation, text]
  directionDiff?: Array<[number, string]>
}

/**
 * Comparison result from API
 */
interface ComparisonResult {
  version1: {
    id: string
    version: number
    script_id: string
    created_at: number
  }
  version2: {
    id: string
    version: number
    script_id: string
    created_at: number
  }
  diff: SegmentDiff[]
  summary: {
    added: number
    removed: number
    modified: number
    unchanged: number
  }
}

interface ScriptDiffModalProps {
  script: Script
  onClose: () => void
}

export function ScriptDiffModal({ script, onClose }: ScriptDiffModalProps) {
  const [histories, setHistories] = useState<ScriptHistory[]>([])
  const [version1Id, setVersion1Id] = useState<string>('')
  const [version2Id, setVersion2Id] = useState<string>('')
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [showUnchanged, setShowUnchanged] = useState(false) // v2.18.0: Toggle unchanged segments
  const [focusedDiffIndex, setFocusedDiffIndex] = useState<number>(-1) // v2.18.0: Current focused diff for keyboard navigation
  const [showHelpModal, setShowHelpModal] = useState(false) // v2.19.0: Keyboard shortcuts help modal

  // v2.20.0: Diff filter state - Load from localStorage or default to all enabled
  const [diffFilter, setDiffFilter] = useState<{
    added: boolean
    removed: boolean
    modified: boolean
  }>(() => {
    try {
      const saved = localStorage.getItem('diffFilter')
      return saved ? JSON.parse(saved) : { added: true, removed: true, modified: true }
    } catch {
      return { added: true, removed: true, modified: true }
    }
  })

  // v2.21.0: Comparison history state
  const [comparisonHistoryList, setComparisonHistoryList] = useState<ComparisonHistory[]>(() => {
    try {
      const saved = localStorage.getItem('comparisonHistory')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)

  // v2.22.0: Annotations state
  const [annotations, setAnnotations] = useState<ScriptAnnotation[]>([]) // v2.24.0: Load from API instead of localStorage
  const [showAnnotationMenu, setShowAnnotationMenu] = useState<string | null>(null) // segment_key of the item showing menu
  const [annotationNote, setAnnotationNote] = useState('') // v2.23.0: Note input for annotation
  const [loadingAnnotations, setLoadingAnnotations] = useState(false) // v2.24.0: Annotation loading state

  // Load history list
  useEffect(() => {
    loadHistories()
  }, [script.id])

  // v2.20.0: Persist diff filter to localStorage
  useEffect(() => {
    localStorage.setItem('diffFilter', JSON.stringify(diffFilter))
  }, [diffFilter])

  // v2.22.0: Reload annotations when version selection changes
  // v2.24.0: Load from API instead of localStorage
  useEffect(() => {
    if (!version1Id || !version2Id) {
      setAnnotations([])
      return
    }

    loadAnnotations()
  }, [script.id, version1Id, version2Id])

  // v2.24.0: Load annotations from API
  const loadAnnotations = async () => {
    if (!version1Id || !version2Id) return

    try {
      setLoadingAnnotations(true)
      const response = await fetch(
        `http://localhost:3001/api/scripts/${script.id}/annotations?version1_id=${version1Id}&version2_id=${version2Id}&include_private=true`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Failed to load annotations')
      }

      const data = await response.json()
      setAnnotations(data.annotations || [])
    } catch (error) {
      console.error('Failed to load annotations:', error)
      setAnnotations([])
    } finally {
      setLoadingAnnotations(false)
    }
  }

  // v2.20.0: Toggle filter for specific diff type
  const toggleFilter = (type: 'added' | 'removed' | 'modified') => {
    setDiffFilter(prev => ({ ...prev, [type]: !prev[type] }))
  }

  // v2.20.0: Clear all filters (enable all)
  const clearFilter = () => {
    setDiffFilter({ added: true, removed: true, modified: true })
  }

  // v2.20.0: Check if any filter is active (not all enabled)
  const hasActiveFilter = !diffFilter.added || !diffFilter.removed || !diffFilter.modified

  const loadHistories = async () => {
    try {
      setLoading(true)
      const response = await scriptApi.getHistoryList(script.id)
      if (response.histories) {
        setHistories(response.histories)
        // Auto-select last two versions if available
        if (response.histories.length >= 2) {
          setVersion1Id(response.histories[1].id) // Older version
          setVersion2Id(response.histories[0].id) // Newer version
        }
      }
    } catch (error) {
      console.error('Failed to load script histories:', error)
      toast.error('加载历史记录失败')
    } finally {
      setLoading(false)
    }
  }

  // Handle compare
  const handleCompare = async () => {
    if (!version1Id || !version2Id) {
      toast.error('请选择两个版本进行比较')
      return
    }

    if (version1Id === version2Id) {
      toast.error('不能比较相同的版本')
      return
    }

    try {
      setComparing(true)
      const result = await scriptApi.compareVersions(script.id, version1Id, version2Id)
      setComparisonResult(result)

      // v2.21.0: Save comparison to history
      saveComparisonHistory()

      // v2.19.0: Show keyboard shortcuts tip on first use
      const hasSeenTip = localStorage.getItem('hasSeenDiffKeyboardTip')
      if (!hasSeenTip) {
        setTimeout(() => {
          toast.info('提示：按N/P键快速跳转差异，按?查看帮助')
          localStorage.setItem('hasSeenDiffKeyboardTip', 'true')
        }, 500) // Delay to avoid collision with comparison success
      }
    } catch (error) {
      console.error('Failed to compare versions:', error)
      toast.error('比较失败，请重试')
    } finally {
      setComparing(false)
    }
  }

  // v2.18.0/v2.20.0: Keyboard navigation for jumping to next/previous diff
  useEffect(() => {
    if (!comparisonResult) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      // v2.20.0: Get all diff items that pass the filter (both type filter and unchanged filter)
      const changedDiffs = comparisonResult.diff.filter(d => {
        if (d.type === 'unchanged') return false
        return diffFilter[d.type as 'added' | 'removed' | 'modified']
      })
      if (changedDiffs.length === 0) return

      // Handle N (Next) key
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        const nextIndex = focusedDiffIndex === -1 ? 0 : Math.min(focusedDiffIndex + 1, changedDiffs.length - 1)

        if (nextIndex === focusedDiffIndex && focusedDiffIndex === changedDiffs.length - 1) {
          toast.info('已是最后一个差异')
          return
        }

        setFocusedDiffIndex(nextIndex)
        // Scroll to the diff item
        const diffElement = document.querySelector(`[data-diff-index="${nextIndex}"]`)
        if (diffElement) {
          diffElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }

      // Handle P (Previous) key
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        const prevIndex = focusedDiffIndex === -1 ? 0 : Math.max(focusedDiffIndex - 1, 0)

        if (prevIndex === focusedDiffIndex && focusedDiffIndex === 0) {
          toast.info('已是第一个差异')
          return
        }

        setFocusedDiffIndex(prevIndex)
        // Scroll to the diff item
        const diffElement = document.querySelector(`[data-diff-index="${prevIndex}"]`)
        if (diffElement) {
          diffElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }

      // v2.19.0: Handle ? (Help) key
      if (e.key === '?') {
        e.preventDefault()
        setShowHelpModal(true)
      }

      // Handle Esc key
      if (e.key === 'Escape' && showHelpModal) {
        e.preventDefault()
        setShowHelpModal(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [comparisonResult, focusedDiffIndex, showHelpModal, diffFilter])

  // Reset focused index when comparison result changes
  useEffect(() => {
    setFocusedDiffIndex(-1)
  }, [comparisonResult])

  // Render diff text with inline highlighting
  const renderDiffText = (diffs?: Array<[number, string]>) => {
    if (!diffs || diffs.length === 0) return null

    return diffs.map((diff, index) => {
      const [operation, text] = diff
      if (operation === 1) {
        // Addition
        return <mark key={index} className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">{text}</mark>
      } else if (operation === -1) {
        // Deletion
        return <mark key={index} className="bg-red-500/20 text-red-600 dark:text-red-400 line-through">{text}</mark>
      } else {
        // Unchanged
        return <span key={index}>{text}</span>
      }
    })
  }

  // Get version label
  const getVersionLabel = (historyId: string) => {
    const history = histories.find(h => h.id === historyId)
    return history ? `v${history.version}` : ''
  }

  // v2.19.0: Generate Markdown report
  const generateMarkdownReport = () => {
    if (!comparisonResult) return ''

    const scriptTitle = script.topic_title || '未命名脚本'
    const v1Label = getVersionLabel(version1Id)
    const v2Label = getVersionLabel(version2Id)
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    // Header
    let markdown = `# 脚本版本比较报告\n\n`
    markdown += `- **脚本**: ${scriptTitle}\n`
    markdown += `- **版本1**: ${v1Label}\n`
    markdown += `- **版本2**: ${v2Label}\n`
    markdown += `- **比较时间**: ${timestamp}\n\n`
    markdown += `---\n\n`

    // Summary
    markdown += `## 摘要统计\n\n`
    markdown += `| 变更类型 | 数量 |\n`
    markdown += `|---------|------|\n`
    markdown += `| 新增 | ${comparisonResult.summary.added} |\n`
    markdown += `| 删除 | ${comparisonResult.summary.removed} |\n`
    markdown += `| 修改 | ${comparisonResult.summary.modified} |\n`
    markdown += `| 无变化 | ${comparisonResult.summary.unchanged} |\n\n`
    markdown += `---\n\n`

    // Detailed diff
    markdown += `## 详细差异\n\n`
    let diffNumber = 0
    comparisonResult.diff.forEach((item) => {
      if (item.type === 'unchanged') return // Skip unchanged

      diffNumber++
      if (item.type === 'added') {
        markdown += `### ${diffNumber}. [新增] ${item.newSegment?.type} (${item.newSegment?.duration}秒)\n\n`
        markdown += `**内容**:\n${item.newSegment?.content}\n\n`
        if (item.newSegment?.direction) {
          markdown += `**镜头**: ${item.newSegment.direction}\n\n`
        }
      } else if (item.type === 'removed') {
        markdown += `### ${diffNumber}. [删除] ${item.oldSegment?.type} (${item.oldSegment?.duration}秒)\n\n`
        markdown += `**内容**:\n~~${item.oldSegment?.content}~~\n\n`
        if (item.oldSegment?.direction) {
          markdown += `**镜头**: ~~${item.oldSegment.direction}~~\n\n`
        }
      } else if (item.type === 'modified') {
        markdown += `### ${diffNumber}. [修改] ${item.oldSegment?.type}\n\n`
        markdown += `**修改前** (${item.oldSegment?.duration}秒):\n${item.oldSegment?.content}\n\n`
        if (item.oldSegment?.direction) {
          markdown += `**镜头**: ${item.oldSegment.direction}\n\n`
        }
        markdown += `**修改后** (${item.newSegment?.duration}秒):\n${item.newSegment?.content}\n\n`
        if (item.newSegment?.direction) {
          markdown += `**镜头**: ${item.newSegment.direction}\n\n`
        }
      }
      markdown += `---\n\n`
    })

    // Footer
    markdown += `\n*报告由超级洞察自动生成*\n`

    return markdown
  }

  // v2.20.0 Phase 2: Sanitize filename to avoid special characters
  const sanitizeFilename = (filename: string): string => {
    // Replace file system reserved characters with underscore
    let safe = filename.replace(/[/\\:*?"<>|]/g, '_')

    // Merge consecutive underscores
    safe = safe.replace(/_+/g, '_')

    // Remove leading/trailing underscores
    safe = safe.replace(/^_+|_+$/g, '')

    // Limit length to 200 characters (Windows max is 255)
    if (safe.length > 200) {
      safe = safe.slice(0, 200)
    }

    return safe
  }

  // v2.19.0: Download Markdown file
  const downloadMarkdown = () => {
    try {
      const content = generateMarkdownReport()
      if (!content) {
        toast.error('无法生成报告')
        return
      }

      const scriptTitle = sanitizeFilename(script.topic_title || '未命名脚本')
      const v1Label = sanitizeFilename(getVersionLabel(version1Id))
      const v2Label = sanitizeFilename(getVersionLabel(version2Id))
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-').replace('T', '_')
      const filename = `${scriptTitle}_${v1Label}-${v2Label}_比较报告_${timestamp}.md`

      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      toast.success('报告已下载', filename)
    } catch (error) {
      console.error('Failed to download markdown:', error)
      toast.error('下载失败，请重试')
    }
  }

  // v2.21.0: Download PDF file
  const downloadPDF = () => {
    try {
      if (!comparisonResult) {
        toast.error('没有可用的比较结果')
        return
      }

      // Prepare comparison data for PDF generator
      const pdfData: ComparisonData = {
        scriptTitle: script.topic_title || '未命名脚本',
        version1: {
          id: version1Id,
          label: getVersionLabel(version1Id),
          createdAt: histories.find(h => h.id === version1Id)?.created_at
        },
        version2: {
          id: version2Id,
          label: getVersionLabel(version2Id),
          createdAt: histories.find(h => h.id === version2Id)?.created_at
        },
        diff: comparisonResult.diff.map(item => ({
          key: `${item.segmentIndex}`,
          type: item.type,
          content: item.newSegment?.content,
          voiceover: item.newSegment?.voiceover,
          oldContent: item.oldSegment?.content,
          oldVoiceover: item.oldSegment?.voiceover
        })),
        stats: {
          added: comparisonResult.summary.added,
          removed: comparisonResult.summary.removed,
          modified: comparisonResult.summary.modified,
          unchanged: comparisonResult.summary.unchanged,
          total: comparisonResult.diff.length
        }
      }

      // Generate filename
      const scriptTitle = sanitizeFilename(script.topic_title || '未命名脚本')
      const v1Label = sanitizeFilename(getVersionLabel(version1Id))
      const v2Label = sanitizeFilename(getVersionLabel(version2Id))
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-').replace('T', '_')
      const filename = `${scriptTitle}_${v1Label}-${v2Label}_比较报告_${timestamp}.pdf`

      // Generate and download PDF
      generateComparisonPDF(pdfData, filename)

      toast.success('PDF报告已下载', filename)
    } catch (error) {
      console.error('Failed to download PDF:', error)
      toast.error('PDF生成失败，请重试')
    }
  }

  // v2.21.0: Save comparison to history
  const saveComparisonHistory = () => {
    if (!version1Id || !version2Id) return

    const newRecord: ComparisonHistory = {
      id: crypto.randomUUID(),
      scriptId: script.id,
      scriptTitle: script.topic_title || '未命名脚本',
      version1Id,
      version1Label: getVersionLabel(version1Id),
      version2Id,
      version2Label: getVersionLabel(version2Id),
      timestamp: Date.now()
    }

    const updatedHistory = [...comparisonHistoryList]

    // Check if same comparison exists (de-duplicate)
    const existingIndex = updatedHistory.findIndex(h =>
      h.scriptId === script.id &&
      h.version1Id === version1Id &&
      h.version2Id === version2Id
    )

    if (existingIndex >= 0) {
      // Remove old record
      updatedHistory.splice(existingIndex, 1)
    }

    // Add to front
    updatedHistory.unshift(newRecord)

    // Limit to 10 records
    if (updatedHistory.length > 10) {
      updatedHistory.pop()
    }

    // Update state and localStorage
    setComparisonHistoryList(updatedHistory)
    localStorage.setItem('comparisonHistory', JSON.stringify(updatedHistory))
  }

  // v2.21.0: Repeat comparison from history
  const repeatComparison = (historyId: string) => {
    const record = comparisonHistoryList.find(h => h.id === historyId)
    if (!record) return

    // Set versions
    setVersion1Id(record.version1Id)
    setVersion2Id(record.version2Id)

    // Close dropdown
    setShowHistoryDropdown(false)

    // Auto-trigger comparison after state update
    setTimeout(() => {
      handleCompare()
    }, 100)
  }

  // v2.21.0: Clear all comparison history
  const clearComparisonHistory = () => {
    setComparisonHistoryList([])
    localStorage.removeItem('comparisonHistory')
    setShowHistoryDropdown(false)
    toast.success('历史记录已清除')
  }

  // v2.22.0: Add annotation
  // v2.24.0: Save to API instead of localStorage
  const addAnnotation = async (segmentKey: string, annotationType: ScriptAnnotation['annotation_type'], note?: string) => {
    if (!version1Id || !version2Id) return

    try {
      const response = await fetch(
        `http://localhost:3001/api/scripts/${script.id}/annotations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            version1_id: version1Id,
            version2_id: version2Id,
            segment_key: segmentKey,
            annotation_type: annotationType,
            note,
            is_public: true // Default to public
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create annotation')
      }

      const newAnnotation: ScriptAnnotation = await response.json()

      // Update local state
      setAnnotations(prev => [...prev, newAnnotation])

      // Close menu
      setShowAnnotationMenu(null)

      // Show toast
      const labels = {
        warning: '需要注意',
        confirmed: '已确认',
        needs_fix: '需要修改',
        discussing: '讨论中'
      }
      toast.success('标注已添加', labels[annotationType])
    } catch (error) {
      console.error('Failed to save annotation:', error)
      toast.error('标注保存失败')
    }
  }

  // v2.22.0: Remove annotation
  // v2.24.0: Delete from API instead of localStorage
  const removeAnnotation = async (annotationId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/annotations/${annotationId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete annotation')
      }

      // Update local state
      setAnnotations(prev => prev.filter(a => a.id !== annotationId))

      toast.success('标注已删除')
    } catch (error) {
      console.error('Failed to remove annotation:', error)
      toast.error('标注删除失败')
    }
  }

  // v2.22.0: Get annotations for a specific segment
  const getAnnotationsForSegment = (segmentKey: string): ScriptAnnotation[] => {
    return annotations.filter(a => a.segment_key === segmentKey)
  }

  // v2.22.0: Annotation type config (icon, label, color)
  const annotationConfig: Record<ScriptAnnotation['annotation_type'], { icon: typeof AlertTriangle; label: string; color: string; bgColor: string }> = {
    warning: { icon: AlertTriangle, label: '需要注意', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
    confirmed: { icon: CheckCircle, label: '已确认', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30' },
    needs_fix: { icon: XOctagon, label: '需要修改', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
    discussing: { icon: MessageSquare, label: '讨论中', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-2xl w-[90vw] max-w-[1400px] h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
          <div className="flex items-center gap-3">
            <GitCompare className="text-[#3370FF]" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-[#1F2329] dark:text-white">版本比较</h2>
              <p className="text-sm text-[#8F959E]">{script.topic_title || '未命名脚本'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors"
          >
            <X size={20} className="text-[#8F959E]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Version Selector */}
          <div className="px-6 py-4 border-b border-[#DEE0E3] dark:border-[#2D2D2D] bg-[#F7F8FA] dark:bg-[#0F0F0F]">
            <div className="flex items-center gap-4">
              {/* Version 1 Selector */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#646A73] dark:text-[#C9CDD4] mb-2">
                  版本 1 (旧)
                </label>
                <div className="relative">
                  <select
                    value={version1Id}
                    onChange={(e) => setVersion1Id(e.target.value)}
                    disabled={loading || comparing}
                    className="w-full px-4 py-2 pr-10 rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] bg-white dark:bg-[#0A0A0A] text-[#1F2329] dark:text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#3370FF]/20"
                  >
                    <option value="">选择版本</option>
                    {histories.map(history => (
                      <option key={history.id} value={history.id}>
                        版本 v{history.version} - {history.word_count}字
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F959E] pointer-events-none" />
                </div>
              </div>

              <ArrowRight size={20} className="text-[#8F959E] flex-shrink-0 mt-6" />

              {/* Version 2 Selector */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#646A73] dark:text-[#C9CDD4] mb-2">
                  版本 2 (新)
                </label>
                <div className="relative">
                  <select
                    value={version2Id}
                    onChange={(e) => setVersion2Id(e.target.value)}
                    disabled={loading || comparing}
                    className="w-full px-4 py-2 pr-10 rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] bg-white dark:bg-[#0A0A0A] text-[#1F2329] dark:text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#3370FF]/20"
                  >
                    <option value="">选择版本</option>
                    {histories.map(history => (
                      <option key={history.id} value={history.id}>
                        版本 v{history.version} - {history.word_count}字
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F959E] pointer-events-none" />
                </div>
              </div>

              {/* Compare Button */}
              <button
                onClick={handleCompare}
                disabled={!version1Id || !version2Id || comparing}
                className="px-6 py-2 mt-6 rounded-lg bg-[#3370FF] text-white hover:bg-[#2960F0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {comparing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>比较中...</span>
                  </>
                ) : (
                  <>
                    <GitCompare size={16} />
                    <span>开始比较</span>
                  </>
                )}
              </button>

              {/* v2.21.0: Comparison History Dropdown */}
              {comparisonHistoryList.length > 0 && (
                <div className="relative mt-6">
                  <button
                    onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                    className="px-4 py-2 rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] text-[#646A73] dark:text-[#C9CDD4] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors flex items-center gap-2 text-sm"
                  >
                    <span>历史记录</span>
                    <ChevronDown size={14} className={`transition-transform ${showHistoryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showHistoryDropdown && (
                    <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-[#0A0A0A] rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] shadow-xl z-10 max-h-[400px] overflow-y-auto">
                      <div className="p-3 border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#1F2329] dark:text-white">最近比较</span>
                          <button
                            onClick={clearComparisonHistory}
                            className="text-xs text-[#8F959E] hover:text-[#3370FF] transition-colors"
                          >
                            清除全部
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        {comparisonHistoryList.map((record) => (
                          <button
                            key={record.id}
                            onClick={() => repeatComparison(record.id)}
                            className="w-full p-3 rounded-lg hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors text-left"
                          >
                            <div className="flex items-start gap-2">
                              <GitCompare size={14} className="text-[#3370FF] mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[#1F2329] dark:text-white truncate">
                                  {record.scriptTitle}
                                </div>
                                <div className="text-xs text-[#8F959E] mt-1">
                                  {record.version1Label} → {record.version2Label}
                                </div>
                                <div className="text-xs text-[#8F959E] mt-1">
                                  {new Date(record.timestamp).toLocaleString('zh-CN', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comparison Result */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3370FF]"></div>
              </div>
            ) : !comparisonResult ? (
              <div className="flex flex-col items-center justify-center h-full text-[#8F959E]">
                <GitCompare size={64} className="mb-4 opacity-20" />
                <p className="text-lg">选择两个版本并点击"开始比较"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-[#F7F8FA] dark:bg-[#0F0F0F] border border-[#DEE0E3] dark:border-[#2D2D2D]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#646A73] dark:text-[#C9CDD4]">
                      {getVersionLabel(version1Id)}
                    </span>
                    <ArrowRight size={16} className="text-[#8F959E]" />
                    <span className="text-sm font-semibold text-[#646A73] dark:text-[#C9CDD4]">
                      {getVersionLabel(version2Id)}
                    </span>
                  </div>

                  {/* v2.20.0: Diff type filter buttons */}
                  <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#0A0A0A] rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D]">
                    <button
                      onClick={() => toggleFilter('added')}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        diffFilter.added
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'text-[#8F959E] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F]'
                      }`}
                    >
                      <Plus size={12} />
                      <span>新增</span>
                    </button>
                    <button
                      onClick={() => toggleFilter('removed')}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        diffFilter.removed
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'text-[#8F959E] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F]'
                      }`}
                    >
                      <Minus size={12} />
                      <span>删除</span>
                    </button>
                    <button
                      onClick={() => toggleFilter('modified')}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        diffFilter.modified
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          : 'text-[#8F959E] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F]'
                      }`}
                    >
                      <Edit size={12} />
                      <span>修改</span>
                    </button>
                  </div>

                  {/* v2.20.0: Clear filter button (only show if any filter is active) */}
                  {hasActiveFilter && (
                    <button
                      onClick={clearFilter}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#8F959E] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors"
                    >
                      <XCircle size={12} />
                      <span>清除筛选</span>
                    </button>
                  )}

                  <div className="flex-1" />
                  <div className="flex items-center gap-6 text-sm">
                    {comparisonResult.summary.added > 0 && (
                      <div className={`flex items-center gap-2 ${!diffFilter.added ? 'opacity-40' : ''}`}>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          +{comparisonResult.summary.added}
                        </span>
                        <span className="text-[#8F959E]">新增</span>
                      </div>
                    )}
                    {comparisonResult.summary.removed > 0 && (
                      <div className={`flex items-center gap-2 ${!diffFilter.removed ? 'opacity-40' : ''}`}>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          -{comparisonResult.summary.removed}
                        </span>
                        <span className="text-[#8F959E]">删除</span>
                      </div>
                    )}
                    {comparisonResult.summary.modified > 0 && (
                      <div className={`flex items-center gap-2 ${!diffFilter.modified ? 'opacity-40' : ''}`}>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                          ~{comparisonResult.summary.modified}
                        </span>
                        <span className="text-[#8F959E]">修改</span>
                      </div>
                    )}
                    {comparisonResult.summary.unchanged > 0 && (
                      <div className={`flex items-center gap-2 ${!showUnchanged ? 'opacity-40' : ''}`}>
                        <span className="font-semibold text-[#646A73] dark:text-[#C9CDD4]">
                          {comparisonResult.summary.unchanged}
                        </span>
                        <span className="text-[#8F959E]">无变化</span>
                      </div>
                    )}
                  </div>
                  {/* v2.18.0: Toggle unchanged segments button */}
                  {comparisonResult.summary.unchanged > 0 && (
                    <button
                      onClick={() => setShowUnchanged(!showUnchanged)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] text-[#646A73] dark:text-[#C9CDD4] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors text-sm"
                    >
                      {showUnchanged ? (
                        <>
                          <EyeOff size={14} />
                          <span>仅显示差异</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          <span>显示全部</span>
                        </>
                      )}
                    </button>
                  )}
                  {/* v2.19.0: Export Markdown report button */}
                  <button
                    onClick={downloadMarkdown}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] text-[#646A73] dark:text-[#C9CDD4] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors text-sm"
                  >
                    <Download size={14} />
                    <span>导出Markdown</span>
                  </button>
                  {/* v2.21.0: Export PDF report button */}
                  <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] text-[#646A73] dark:text-[#C9CDD4] hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors text-sm"
                  >
                    <FileText size={14} />
                    <span>导出PDF</span>
                  </button>
                </div>

                {/* Diff Items */}
                <div className="space-y-4">
                  {comparisonResult.diff
                    .filter(item => {
                      // v2.18.0/v2.20.0: Filter by unchanged and type filter
                      if (item.type === 'unchanged') return showUnchanged
                      return diffFilter[item.type as 'added' | 'removed' | 'modified']
                    })
                    .map((item, displayIndex) => {
                    // v2.18.0/v2.20.0: For keyboard navigation, calculate index in filtered array
                    const allChangedDiffs = comparisonResult.diff.filter(d => {
                      if (d.type === 'unchanged') return false
                      return diffFilter[d.type as 'added' | 'removed' | 'modified']
                    })
                    const changedDiffIndex = allChangedDiffs.findIndex(d => d === item)
                    const isFocused = changedDiffIndex === focusedDiffIndex && changedDiffIndex !== -1
                    const focusedClass = isFocused ? 'ring-2 ring-[#3370FF] shadow-lg transition-all duration-300' : ''
                    if (item.type === 'unchanged') {
                      // Collapsed unchanged items
                      return (
                        <div key={displayIndex} className="flex gap-4">
                          <div className="flex-1 p-4 rounded-lg border border-[#DEE0E3] dark:border-[#2D2D2D] bg-white dark:bg-[#0A0A0A]">
                            <div className="text-xs font-semibold text-[#8F959E] mb-2">
                              {item.oldSegment?.type} - {item.oldSegment?.duration}秒
                            </div>
                            <p className="text-sm text-[#646A73] dark:text-[#C9CDD4]">
                              {item.oldSegment?.content}
                            </p>
                          </div>
                        </div>
                      )
                    } else if (item.type === 'added') {
                      const segmentKey = `${item.type}-${item.segmentIndex}`
                      const segmentAnnotations = getAnnotationsForSegment(segmentKey)
                      const isMenuOpen = showAnnotationMenu === segmentKey
                      return (
                        <div key={displayIndex} className="flex gap-4" data-diff-index={changedDiffIndex}>
                          <div className="flex-1" />
                          <div className={`relative flex-1 p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 ${focusedClass}`}>
                            {/* v2.22.0: Annotation button */}
                            <div className="absolute top-2 right-2 flex items-center gap-2">
                              {segmentAnnotations.map(annotation => {
                                const config = annotationConfig[annotation.annotation_type]
                                const Icon = config.icon
                                // v2.24.0: Add author info to title
                                const authorInfo = annotation.user ? `\n作者: ${annotation.user.name}` : ''
                                return (
                                  <button
                                    key={annotation.id}
                                    onClick={() => removeAnnotation(annotation.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all hover:scale-105 ${config.color} ${config.bgColor}`}
                                    title={`${config.label}${annotation.note ? `: ${annotation.note}` : ''}${authorInfo}\n点击删除`}
                                  >
                                    <Icon size={12} />
                                    <span>{config.label}</span>
                                  </button>
                                )
                              })}
                              <div className="relative">
                                <button
                                  onClick={() => setShowAnnotationMenu(isMenuOpen ? null : segmentKey)}
                                  className="p-1.5 rounded-md bg-white dark:bg-[#1F1F1F] border border-[#DEE0E3] dark:border-[#2D2D2D] hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D] transition-colors"
                                  title="添加标注"
                                >
                                  <Plus size={14} className="text-[#646A73] dark:text-[#C9CDD4]" />
                                </button>
                                {/* v2.22.0 + v2.23.0: Annotation menu with note input */}
                                {isMenuOpen && (
                                  <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#1F1F1F] border border-[#DEE0E3] dark:border-[#2D2D2D] rounded-lg shadow-lg overflow-hidden z-10">
                                    {/* v2.23.0: Note input field */}
                                    <div className="p-3 border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
                                      <textarea
                                        value={annotationNote}
                                        onChange={(e) => setAnnotationNote(e.target.value)}
                                        placeholder="添加备注（可选，最多200字）"
                                        maxLength={200}
                                        className="w-full px-2 py-1.5 text-xs border border-[#DEE0E3] dark:border-[#2D2D2D] rounded bg-[#F2F3F5] dark:bg-[#0A0A0A] text-[#1F2329] dark:text-white placeholder-[#8F959E] dark:placeholder-[#646A73] focus:outline-none focus:border-[#5E6AD2] resize-none"
                                        rows={2}
                                      />
                                      {annotationNote.length > 0 && (
                                        <div className="text-xs text-[#646A73] dark:text-[#8F959E] mt-1">
                                          {annotationNote.length}/200 字符
                                        </div>
                                      )}
                                    </div>
                                    {/* Annotation type buttons */}
                                    {Object.entries(annotationConfig).map(([type, config]) => {
                                      const Icon = config.icon
                                      return (
                                        <button
                                          key={type}
                                          onClick={() => {
                                            addAnnotation(segmentKey, type as ScriptAnnotation['annotation_type'], annotationNote || undefined)
                                            setAnnotationNote('') // Clear note after adding
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D] transition-colors"
                                        >
                                          <Icon size={14} className={config.color} />
                                          <span className="text-[#1F2329] dark:text-white">{config.label}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                新增
                              </span>
                              <span className="text-xs text-[#8F959E]">
                                {item.newSegment?.type} - {item.newSegment?.duration}秒
                              </span>
                            </div>
                            <p className="text-sm text-[#1F2329] dark:text-white">
                              {item.newSegment?.content}
                            </p>
                            {item.newSegment?.direction && (
                              <p className="text-xs text-[#8F959E] mt-2">
                                镜头: {item.newSegment.direction}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    } else if (item.type === 'removed') {
                      const segmentKey = `${item.type}-${item.segmentIndex}`
                      const segmentAnnotations = getAnnotationsForSegment(segmentKey)
                      const isMenuOpen = showAnnotationMenu === segmentKey
                      return (
                        <div key={displayIndex} className="flex gap-4" data-diff-index={changedDiffIndex}>
                          <div className={`relative flex-1 p-4 rounded-lg border-2 border-red-500/30 bg-red-500/5 ${focusedClass}`}>
                            {/* v2.22.0: Annotation button */}
                            <div className="absolute top-2 right-2 flex items-center gap-2">
                              {segmentAnnotations.map(annotation => {
                                const config = annotationConfig[annotation.annotation_type]
                                const Icon = config.icon
                                // v2.24.0: Add author info to title
                                const authorInfo = annotation.user ? `\n作者: ${annotation.user.name}` : ''
                                return (
                                  <button
                                    key={annotation.id}
                                    onClick={() => removeAnnotation(annotation.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all hover:scale-105 ${config.color} ${config.bgColor}`}
                                    title={`${config.label}${annotation.note ? `: ${annotation.note}` : ''}${authorInfo}\n点击删除`}
                                  >
                                    <Icon size={12} />
                                    <span>{config.label}</span>
                                  </button>
                                )
                              })}
                              <div className="relative">
                                <button
                                  onClick={() => setShowAnnotationMenu(isMenuOpen ? null : segmentKey)}
                                  className="p-1.5 rounded-md bg-white dark:bg-[#1F1F1F] border border-[#DEE0E3] dark:border-[#2D2D2D] hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D] transition-colors"
                                  title="添加标注"
                                >
                                  <Plus size={14} className="text-[#646A73] dark:text-[#C9CDD4]" />
                                </button>
                                {/* v2.22.0 + v2.23.0: Annotation menu with note input */}
                                {isMenuOpen && (
                                  <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#1F1F1F] border border-[#DEE0E3] dark:border-[#2D2D2D] rounded-lg shadow-lg overflow-hidden z-10">
                                    {/* v2.23.0: Note input field */}
                                    <div className="p-3 border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
                                      <textarea
                                        value={annotationNote}
                                        onChange={(e) => setAnnotationNote(e.target.value)}
                                        placeholder="添加备注（可选，最多200字）"
                                        maxLength={200}
                                        className="w-full px-2 py-1.5 text-xs border border-[#DEE0E3] dark:border-[#2D2D2D] rounded bg-[#F2F3F5] dark:bg-[#0A0A0A] text-[#1F2329] dark:text-white placeholder-[#8F959E] dark:placeholder-[#646A73] focus:outline-none focus:border-[#5E6AD2] resize-none"
                                        rows={2}
                                      />
                                      {annotationNote.length > 0 && (
                                        <div className="text-xs text-[#646A73] dark:text-[#8F959E] mt-1">
                                          {annotationNote.length}/200 字符
                                        </div>
                                      )}
                                    </div>
                                    {/* Annotation type buttons */}
                                    {Object.entries(annotationConfig).map(([type, config]) => {
                                      const Icon = config.icon
                                      return (
                                        <button
                                          key={type}
                                          onClick={() => {
                                            addAnnotation(segmentKey, type as ScriptAnnotation['annotation_type'], annotationNote || undefined)
                                            setAnnotationNote('') // Clear note after adding
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D] transition-colors"
                                        >
                                          <Icon size={14} className={config.color} />
                                          <span className="text-[#1F2329] dark:text-white">{config.label}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                删除
                              </span>
                              <span className="text-xs text-[#8F959E]">
                                {item.oldSegment?.type} - {item.oldSegment?.duration}秒
                              </span>
                            </div>
                            <p className="text-sm text-[#1F2329] dark:text-white line-through opacity-70">
                              {item.oldSegment?.content}
                            </p>
                            {item.oldSegment?.direction && (
                              <p className="text-xs text-[#8F959E] mt-2 line-through opacity-70">
                                镜头: {item.oldSegment.direction}
                              </p>
                            )}
                          </div>
                          <div className="flex-1" />
                        </div>
                      )
                    } else if (item.type === 'modified') {
                      const segmentKey = `${item.type}-${item.segmentIndex}`
                      const segmentAnnotations = getAnnotationsForSegment(segmentKey)
                      const isMenuOpen = showAnnotationMenu === segmentKey
                      return (
                        <div key={displayIndex} className="flex gap-4" data-diff-index={changedDiffIndex}>
                          {/* Old version */}
                          <div className={`flex-1 p-4 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5 ${focusedClass}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                                修改前
                              </span>
                              <span className="text-xs text-[#8F959E]">
                                {item.oldSegment?.type} - {item.oldSegment?.duration}秒
                              </span>
                            </div>
                            <p className="text-sm text-[#1F2329] dark:text-white">
                              {renderDiffText(item.contentDiff) || item.oldSegment?.content}
                            </p>
                            {item.oldSegment?.direction && (
                              <p className="text-xs text-[#8F959E] mt-2">
                                镜头: {renderDiffText(item.directionDiff) || item.oldSegment.direction}
                              </p>
                            )}
                          </div>
                          {/* New version */}
                          <div className={`relative flex-1 p-4 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5 ${focusedClass}`}>
                            {/* v2.22.0: Annotation button */}
                            <div className="absolute top-2 right-2 flex items-center gap-2">
                              {segmentAnnotations.map(annotation => {
                                const config = annotationConfig[annotation.annotation_type]
                                const Icon = config.icon
                                // v2.24.0: Add author info to title
                                const authorInfo = annotation.user ? `\n作者: ${annotation.user.name}` : ''
                                return (
                                  <button
                                    key={annotation.id}
                                    onClick={() => removeAnnotation(annotation.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all hover:scale-105 ${config.color} ${config.bgColor}`}
                                    title={`${config.label}${annotation.note ? `: ${annotation.note}` : ''}${authorInfo}\n点击删除`}
                                  >
                                    <Icon size={12} />
                                    <span>{config.label}</span>
                                  </button>
                                )
                              })}
                              <div className="relative">
                                <button
                                  onClick={() => setShowAnnotationMenu(isMenuOpen ? null : segmentKey)}
                                  className="p-1.5 rounded-md bg-white dark:bg-[#1F1F1F] border border-[#DEE0E3] dark:border-[#2D2D2D] hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D] transition-colors"
                                  title="添加标注"
                                >
                                  <Plus size={14} className="text-[#646A73] dark:text-[#C9CDD4]" />
                                </button>
                                {/* v2.22.0 + v2.23.0: Annotation menu with note input */}
                                {isMenuOpen && (
                                  <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#1F1F1F] border border-[#DEE0E3] dark:border-[#2D2D2D] rounded-lg shadow-lg overflow-hidden z-10">
                                    {/* v2.23.0: Note input field */}
                                    <div className="p-3 border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
                                      <textarea
                                        value={annotationNote}
                                        onChange={(e) => setAnnotationNote(e.target.value)}
                                        placeholder="添加备注（可选，最多200字）"
                                        maxLength={200}
                                        className="w-full px-2 py-1.5 text-xs border border-[#DEE0E3] dark:border-[#2D2D2D] rounded bg-[#F2F3F5] dark:bg-[#0A0A0A] text-[#1F2329] dark:text-white placeholder-[#8F959E] dark:placeholder-[#646A73] focus:outline-none focus:border-[#5E6AD2] resize-none"
                                        rows={2}
                                      />
                                      {annotationNote.length > 0 && (
                                        <div className="text-xs text-[#646A73] dark:text-[#8F959E] mt-1">
                                          {annotationNote.length}/200 字符
                                        </div>
                                      )}
                                    </div>
                                    {/* Annotation type buttons */}
                                    {Object.entries(annotationConfig).map(([type, config]) => {
                                      const Icon = config.icon
                                      return (
                                        <button
                                          key={type}
                                          onClick={() => {
                                            addAnnotation(segmentKey, type as ScriptAnnotation['annotation_type'], annotationNote || undefined)
                                            setAnnotationNote('') // Clear note after adding
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F2F3F5] dark:hover:bg-[#2D2D2D] transition-colors"
                                        >
                                          <Icon size={14} className={config.color} />
                                          <span className="text-[#1F2329] dark:text-white">{config.label}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                                修改后
                              </span>
                              <span className="text-xs text-[#8F959E]">
                                {item.newSegment?.type} - {item.newSegment?.duration}秒
                              </span>
                            </div>
                            <p className="text-sm text-[#1F2329] dark:text-white">
                              {renderDiffText(item.contentDiff) || item.newSegment?.content}
                            </p>
                            {item.newSegment?.direction && (
                              <p className="text-xs text-[#8F959E] mt-2">
                                镜头: {renderDiffText(item.directionDiff) || item.newSegment.direction}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* v2.19.0: Keyboard Shortcuts Help Modal */}
      {showHelpModal && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0A0A0A] rounded-lg shadow-xl p-6 w-[600px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1F2329] dark:text-white">
                ⌨️ 键盘快捷键
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 rounded-lg hover:bg-[#F2F3F5] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X size={20} className="text-[#8F959E]" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
                    <th className="py-2 px-4 text-sm font-semibold text-[#646A73] dark:text-[#C9CDD4]">
                      快捷键
                    </th>
                    <th className="py-2 px-4 text-sm font-semibold text-[#646A73] dark:text-[#C9CDD4]">
                      功能
                    </th>
                    <th className="py-2 px-4 text-sm font-semibold text-[#646A73] dark:text-[#C9CDD4]">
                      说明
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
                    <td className="py-3 px-4">
                      <kbd className="px-2 py-1 rounded bg-[#F2F3F5] dark:bg-[#1F1F1F] text-sm font-mono text-[#1F2329] dark:text-white border border-[#DEE0E3] dark:border-[#2D2D2D]">
                        N
                      </kbd>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#1F2329] dark:text-white">
                      下一个差异
                    </td>
                    <td className="py-3 px-4 text-sm text-[#8F959E]">
                      跳转到下一个有差异的分镜并高亮
                    </td>
                  </tr>
                  <tr className="border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
                    <td className="py-3 px-4">
                      <kbd className="px-2 py-1 rounded bg-[#F2F3F5] dark:bg-[#1F1F1F] text-sm font-mono text-[#1F2329] dark:text-white border border-[#DEE0E3] dark:border-[#2D2D2D]">
                        P
                      </kbd>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#1F2329] dark:text-white">
                      上一个差异
                    </td>
                    <td className="py-3 px-4 text-sm text-[#8F959E]">
                      跳转到上一个有差异的分镜并高亮
                    </td>
                  </tr>
                  <tr className="border-b border-[#DEE0E3] dark:border-[#2D2D2D]">
                    <td className="py-3 px-4">
                      <kbd className="px-2 py-1 rounded bg-[#F2F3F5] dark:bg-[#1F1F1F] text-sm font-mono text-[#1F2329] dark:text-white border border-[#DEE0E3] dark:border-[#2D2D2D]">
                        ?
                      </kbd>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#1F2329] dark:text-white">
                      显示帮助
                    </td>
                    <td className="py-3 px-4 text-sm text-[#8F959E]">
                      显示本快捷键列表
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">
                      <kbd className="px-2 py-1 rounded bg-[#F2F3F5] dark:bg-[#1F1F1F] text-sm font-mono text-[#1F2329] dark:text-white border border-[#DEE0E3] dark:border-[#2D2D2D]">
                        Esc
                      </kbd>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#1F2329] dark:text-white">
                      关闭
                    </td>
                    <td className="py-3 px-4 text-sm text-[#8F959E]">
                      关闭帮助或Modal
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-lg bg-[#3370FF] text-white hover:bg-[#2960F0] transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
