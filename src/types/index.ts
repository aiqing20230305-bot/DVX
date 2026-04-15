export interface Project {
  id: string
  name: string
  description: string
  brand?: string
  category?: string
  target_audience?: string
  campaign?: string
  start_date?: number
  end_date?: number
  status: 'active' | 'archived'
  tags: string[]
  created_at: number
  updated_at: number
}

export interface UploadedFile {
  id: string
  project_id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  file_type: 'market_data' | 'product_info' | 'product_features'
  status: 'uploading' | 'parsing' | 'ready' | 'error'
  parsed_data: string | null
  error_message: string | null
  created_at: number
  updated_at: number
}

export interface ParsedDataExcel {
  type: 'excel'
  sheets: Array<{
    name: string
    headers: string[]
    rows: Record<string, unknown>[]
    summary: {
      rowCount: number
      columnCount: number
      numericColumns: Array<{ name: string; min: number; max: number; avg: number; sum: number }>
    }
  }>
}

export interface ParsedDataPDF {
  type: 'pdf'
  text: string
  sections: Array<{ heading: string; content: string }>
  summary: string
  pageEstimate: number
}

export interface ParsedDataImage {
  type: 'image'
  description: string
  extractedText: string
  dataPoints: Array<{ label: string; value: string }>
  summary: string
}

export interface FrameAnalysis {
  timestamp: string
  scene: string
  shotType: string
  textOverlay: string
  productVisible: boolean
  mood: string
  elements: string[]
}

export interface StoryboardAnalysisResult {
  type: 'excel_storyboard'
  frames: FrameAnalysis[]
  sheetName: string
  frameCount: number
}

export interface ParsedDataVideoAnalysis {
  type: 'video_analysis'
  frames: FrameAnalysis[]
  overallStructure: string
  hookAnalysis: string
  contentNotes: string
}

export interface ParsedDataExcelWithStoryboard extends ParsedDataExcel {
  storyboards?: StoryboardAnalysisResult[]
}

export type ParsedData = ParsedDataExcel | ParsedDataPDF | ParsedDataImage | ParsedDataVideoAnalysis

export interface InsightMetric {
  label: string
  value: string
  trend?: 'up' | 'down' | 'flat'
}

export interface Insight {
  id: string
  project_id: string
  type: 'trend' | 'competitor' | 'gap' | 'attribution' | 'anomaly'
  title: string
  summary: string
  evidence: string[]
  metric?: InsightMetric
  confidence: 'high' | 'medium' | 'low'
  actionable: boolean
  selected: boolean
  quality_score_credibility?: number | null
  quality_score_novelty?: number | null
  quality_score_actionability?: number | null
  quality_score_overall?: number | null
  quality_metadata?: string | null
  created_at: number
  updated_at: number
}

export interface TopicCard {
  id: string
  project_id: string
  title: string
  angle: string
  persona: string
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu'
  estimated_duration: number
  cta: string
  insight_ref: string[]
  priority: number
  selected: boolean
  created_at: number
  updated_at: number
}

export interface ScriptSegment {
  type: 'hook' | 'problem' | 'solution' | 'proof' | 'cta'
  content: string
  duration: number
  direction: string
}

export interface Script {
  id: string
  project_id: string
  topic_id: string
  variant: string
  segments: ScriptSegment[]
  full_text: string
  word_count: number
  created_at: number
  updated_at: number
}

export interface TemplateSegment {
  type: string
  timing: string
  content: string
  direction: string
  duration?: number
}

export interface ScriptTemplate {
  id: string
  name: string
  description: string | null
  category: 'emotion' | 'rational' | 'harvest' | 'custom'
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu'
  segments: TemplateSegment[]
  tags: string[]
  created_by: string | null
  project_id: string | null
  source_script_id: string | null
  usage_count: number
  created_at: number
  updated_at: number
}

export interface TemplateVariables {
  [key: string]: string | number
}

export interface TemplateQueryParams {
  project_id?: string | null
  category?: string
  platform?: string
  search?: string
  limit?: number
  offset?: number
}

export interface TemplateStats {
  totalCount: number
  byCategory: Array<{ category: string; count: number }>
}

export interface KBItem {
  id: string
  type: 'report' | 'template' | 'tone' | 'insight' | 'other'
  title: string
  content: string
  tags: string[]
  project_id: string | null
  created_at: number
  updated_at: number
}

export interface SSEEvent<T = unknown> {
  event: string
  data: T
}

export type AsyncStatus = 'idle' | 'loading' | 'streaming' | 'success' | 'error'
