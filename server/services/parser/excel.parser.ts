import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'
import { hasStoryboardSheets, extractAndAnalyzeStoryboardImages } from './excel-images.js'
import { StoryboardAnalysisResult } from './vision-analyzer.js'

export interface ExcelParseResult {
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
  storyboards?: StoryboardAnalysisResult[]
}

export async function parseExcel(filePath: string): Promise<ExcelParseResult> {
  const buffer = readFileSync(filePath)
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })

  const sheets = workbook.SheetNames.map(name => {
    const sheet = workbook.Sheets[name]
    if (!sheet) return null

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]

    if (jsonData.length === 0) {
      return { name, headers: [], rows: [], summary: { rowCount: 0, columnCount: 0, numericColumns: [] } }
    }

    const headerRow = jsonData[0] as string[]
    const headers = headerRow.map(h => String(h ?? '').trim()).filter(Boolean)
    const dataRows = jsonData.slice(1).filter(row => (row as unknown[]).some(cell => cell !== ''))

    const rows: Record<string, unknown>[] = dataRows.slice(0, 200).map(row => {
      const obj: Record<string, unknown> = {}
      headers.forEach((header, i) => {
        obj[header] = (row as unknown[])[i]
      })
      return obj
    })

    // Compute numeric column stats
    const numericColumns: Array<{ name: string; min: number; max: number; avg: number; sum: number }> = []
    for (const header of headers) {
      const values = rows.map(r => r[header]).filter(v => typeof v === 'number') as number[]
      if (values.length > rows.length * 0.5 && values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0)
        numericColumns.push({
          name: header,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: sum / values.length,
          sum
        })
      }
    }

    return {
      name,
      headers,
      rows,
      summary: {
        rowCount: dataRows.length,
        columnCount: headers.length,
        numericColumns
      }
    }
  }).filter((s): s is NonNullable<typeof s> => s !== null)

  // Check for storyboard sheets and extract embedded images
  let storyboards: StoryboardAnalysisResult[] | undefined
  const sheetNames = workbook.SheetNames
  if (hasStoryboardSheets(sheetNames)) {
    try {
      console.log('[excel-parser] Detected storyboard sheets, extracting embedded images...')
      storyboards = await extractAndAnalyzeStoryboardImages(filePath, sheetNames)
      if (storyboards.length > 0) {
        console.log(`[excel-parser] Analyzed ${storyboards.reduce((sum, s) => sum + s.frameCount, 0)} storyboard frames`)
      }
    } catch (err) {
      console.error('[excel-parser] Failed to extract storyboard images:', err)
    }
  }

  return { type: 'excel', sheets, storyboards }
}
