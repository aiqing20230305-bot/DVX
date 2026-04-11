import { describe, it, expect, beforeEach } from 'vitest'
import * as XLSX from 'xlsx'
import {
  parseExcelFile,
  validateInsightData,
  validateTopicData,
  generateInsightTemplate,
  generateTopicTemplate
} from './excel-parser'

describe('excel-parser', () => {
  describe('parseExcelFile', () => {
    it('should parse Excel buffer and return JSON data', () => {
      // Create a simple workbook with test data
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ]
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer

      const result = parseExcelFile(buffer)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ name: 'John', age: '30' }) // Numbers converted to strings
      expect(result[1]).toEqual({ name: 'Jane', age: '25' })
    })

    it('should handle empty Excel file', () => {
      const worksheet = XLSX.utils.aoa_to_sheet([['column1', 'column2']])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer

      const result = parseExcelFile(buffer)

      expect(result).toEqual([])
    })

    it('should use the first sheet if multiple sheets exist', () => {
      const sheet1Data = [{ name: 'First' }]
      const sheet2Data = [{ name: 'Second' }]

      const worksheet1 = XLSX.utils.json_to_sheet(sheet1Data)
      const worksheet2 = XLSX.utils.json_to_sheet(sheet2Data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet1, 'Sheet1')
      XLSX.utils.book_append_sheet(workbook, worksheet2, 'Sheet2')
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer

      const result = parseExcelFile(buffer)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('First')
    })

    it('should handle cells with empty values', () => {
      const data = [
        { category: 'pain_point', content: 'Content 1', source: 'Source 1' },
        { category: 'trend', content: '', source: '' }
      ]
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer

      const result = parseExcelFile(buffer)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ category: 'pain_point', content: 'Content 1', source: 'Source 1' })
      expect(result[1]).toEqual({ category: 'trend', content: '', source: '' })
    })
  })

  describe('validateInsightData', () => {
    it('should validate valid insight data', () => {
      const data = [
        { category: 'pain_point', content: '用户反馈产品复杂', source: '用户调研' },
        { category: 'trend', content: '短视频偏好15秒内容', source: '平台数据' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(2)
      expect(result.invalid).toHaveLength(0)
      expect(result.valid[0]).toEqual({
        category: 'pain_point',
        content: '用户反馈产品复杂',
        source: '用户调研'
      })
    })

    it('should reject rows with missing category', () => {
      const data = [
        { content: '洞察内容', source: '来源' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(1)
      expect(result.invalid[0]).toEqual({
        row: 2, // Excel row number (1-indexed + 1 for header)
        field: 'category',
        message: '缺少必填字段：category'
      })
    })

    it('should reject rows with missing content', () => {
      const data = [
        { category: 'pain_point', source: '来源' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(1)
      expect(result.invalid[0]).toEqual({
        row: 2, // Excel row number (1-indexed + 1 for header)
        field: 'content',
        message: '缺少必填字段：content'
      })
    })

    it('should reject rows with empty category', () => {
      const data = [
        { category: '', content: '洞察内容', source: '来源' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(1)
      expect(result.invalid[0].field).toBe('category')
    })

    it('should reject rows with empty content', () => {
      const data = [
        { category: 'pain_point', content: '', source: '来源' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(1)
      expect(result.invalid[0].field).toBe('content')
    })

    it('should accept rows with missing source (optional field)', () => {
      const data = [
        { category: 'pain_point', content: '洞察内容' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(1)
      expect(result.invalid).toHaveLength(0)
      // Default source is 'Excel导入' when not provided
      expect(result.valid[0].source).toBe('Excel导入')
    })

    it('should accept all valid category values', () => {
      const categories = ['pain_point', 'trend', 'opportunity', 'competitor', 'anomaly']
      const data = categories.map(cat => ({
        category: cat,
        content: `洞察 ${cat}`,
        source: '来源'
      }))

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(5)
      expect(result.invalid).toHaveLength(0)
    })

    it('should handle mixed valid and invalid rows', () => {
      const data = [
        { category: 'pain_point', content: '有效洞察1', source: '来源1' }, // valid - row 2
        { category: '', content: '无效洞察', source: '来源2' },             // invalid: empty category - row 3
        { category: 'trend', content: '有效洞察2', source: '来源3' },       // valid - row 4
        { category: 'opportunity', content: '', source: '来源4' },          // invalid: empty content - row 5
        { category: 'competitor', content: '有效洞察3' }                    // valid: missing source (optional) - row 6
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(3)
      expect(result.invalid).toHaveLength(2)

      // Check invalid row numbers are correct (Excel row numbers: data index + 2)
      expect(result.invalid[0].row).toBe(3) // Second data row
      expect(result.invalid[1].row).toBe(5) // Fourth data row
    })

    it('should provide accurate row numbers for errors', () => {
      const data = [
        { category: 'pain_point', content: '有效1', source: '' },  // Excel row 2 (valid)
        { category: '', content: '无效1', source: '' },             // Excel row 3 (invalid)
        { category: 'trend', content: '有效2', source: '' },        // Excel row 4 (valid)
        { category: 'pain_point', content: '', source: '' }         // Excel row 5 (invalid)
      ]

      const result = validateInsightData(data)

      expect(result.invalid).toHaveLength(2)
      expect(result.invalid[0].row).toBe(3) // Second data row in Excel
      expect(result.invalid[1].row).toBe(5) // Fourth data row in Excel
    })

    it('should handle whitespace-only values as empty', () => {
      const data = [
        { category: '   ', content: 'Content', source: 'Source' },
        { category: 'pain_point', content: '   ', source: 'Source' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(0)
      // First row: whitespace category produces 2 errors (missing + invalid)
      // Second row: whitespace content produces 1 error
      expect(result.invalid).toHaveLength(3)
    })
  })

  describe('validateTopicData', () => {
    it('should validate valid topic data', () => {
      const data = [
        { title: '产品功能演示', angle: '产品卖点型', persona: '年轻白领', platform: 'douyin', estimated_duration: '15', cta: '立即购买' },
        { title: '用户教程', angle: '教程型', persona: '新用户', platform: 'bilibili', estimated_duration: '60', cta: '关注学习' }
      ]

      const result = validateTopicData(data)

      expect(result.valid).toHaveLength(2)
      expect(result.invalid).toHaveLength(0)
    })

    it('should reject rows with missing title', () => {
      const data = [
        { angle: '产品卖点型', persona: '年轻白领', platform: 'douyin' }
      ]

      const result = validateTopicData(data)

      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(1)
      expect(result.invalid[0]).toEqual({
        row: 2, // Excel row number (1-indexed + 1 for header)
        field: 'title',
        message: '缺少必填字段：title'
      })
    })

    it('should reject rows with empty title', () => {
      const data = [
        { title: '', angle: '产品卖点型', persona: '年轻白领', platform: 'douyin' }
      ]

      const result = validateTopicData(data)

      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(1)
      expect(result.invalid[0].field).toBe('title')
    })

    it('should accept rows with only title (all other fields optional)', () => {
      const data = [
        { title: '选题标题' }
      ]

      const result = validateTopicData(data)

      expect(result.valid).toHaveLength(1)
      expect(result.invalid).toHaveLength(0)
      // Check that title is present
      expect(result.valid[0].title).toBe('选题标题')
      // Optional fields are not included if not provided
      expect(result.valid[0]).not.toHaveProperty('angle')
      expect(result.valid[0]).not.toHaveProperty('persona')
    })

    it('should only include non-empty optional fields', () => {
      const data = [
        { title: '选题1', angle: '角度1' }
      ]

      const result = validateTopicData(data)

      // Check that provided fields are present
      expect(result.valid[0].title).toBe('选题1')
      expect(result.valid[0].angle).toBe('角度1')
      // Missing optional fields are not included in the result
      expect(result.valid[0]).not.toHaveProperty('persona')
      expect(result.valid[0]).not.toHaveProperty('platform')
    })

    it('should handle mixed valid and invalid rows', () => {
      const data = [
        { title: '有效选题1', platform: 'douyin' },  // valid - row 2
        { title: '', platform: 'douyin' },             // invalid: empty title - row 3
        { title: '有效选题2' },                        // valid - row 4
        { angle: '角度', platform: 'bilibili' }        // invalid: missing title - row 5
      ]

      const result = validateTopicData(data)

      expect(result.valid).toHaveLength(2)
      expect(result.invalid).toHaveLength(2)
      expect(result.invalid[0].row).toBe(3) // Second data row in Excel
      expect(result.invalid[1].row).toBe(5) // Fourth data row in Excel
    })

    it('should handle whitespace-only title as empty', () => {
      const data = [
        { title: '   ', angle: '角度', persona: '人群' }
      ]

      const result = validateTopicData(data)

      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(1)
      expect(result.invalid[0].field).toBe('title')
    })
  })

  describe('generateInsightTemplate', () => {
    it('should generate a valid Excel buffer', () => {
      const buffer = generateInsightTemplate()

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should generate Excel with correct structure', () => {
      const buffer = generateInsightTemplate()
      const workbook = XLSX.read(buffer, { type: 'buffer' })

      // Should have at least one sheet
      expect(workbook.SheetNames).toHaveLength(1)
      expect(workbook.SheetNames[0]).toBe('Insights')

      // Parse the sheet data
      const sheet = workbook.Sheets['Insights']
      const data = XLSX.utils.sheet_to_json(sheet)

      // Should have sample data rows
      expect(data.length).toBeGreaterThan(0)

      // First row should have the required columns
      const firstRow = data[0] as any
      expect(firstRow).toHaveProperty('category')
      expect(firstRow).toHaveProperty('content')
      expect(firstRow).toHaveProperty('source')
    })

    it('should include sample data with different categories', () => {
      const buffer = generateInsightTemplate()
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets['Insights']
      const data = XLSX.utils.sheet_to_json(sheet) as any[]

      // Should have multiple sample rows
      expect(data.length).toBeGreaterThanOrEqual(3)

      // Check that different categories are present
      const categories = data.map(row => row.category)
      expect(categories).toContain('pain_point')
      expect(categories).toContain('trend')
      expect(categories).toContain('opportunity')
    })
  })

  describe('generateTopicTemplate', () => {
    it('should generate a valid Excel buffer', () => {
      const buffer = generateTopicTemplate()

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should generate Excel with correct structure', () => {
      const buffer = generateTopicTemplate()
      const workbook = XLSX.read(buffer, { type: 'buffer' })

      // Should have at least one sheet
      expect(workbook.SheetNames).toHaveLength(1)
      expect(workbook.SheetNames[0]).toBe('Topics')

      // Parse the sheet data
      const sheet = workbook.Sheets['Topics']
      const data = XLSX.utils.sheet_to_json(sheet)

      // Should have sample data rows
      expect(data.length).toBeGreaterThan(0)

      // First row should have the required columns
      const firstRow = data[0] as any
      expect(firstRow).toHaveProperty('title')
      expect(firstRow).toHaveProperty('angle')
      expect(firstRow).toHaveProperty('persona')
      expect(firstRow).toHaveProperty('platform')
      expect(firstRow).toHaveProperty('estimated_duration')
      expect(firstRow).toHaveProperty('cta')
    })

    it('should include sample data', () => {
      const buffer = generateTopicTemplate()
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets['Topics']
      const data = XLSX.utils.sheet_to_json(sheet) as any[]

      // Should have multiple sample rows
      expect(data.length).toBeGreaterThanOrEqual(2)

      // All rows should have non-empty titles
      data.forEach(row => {
        expect(row.title).toBeTruthy()
      })
    })
  })

  describe('integration: parseExcelFile → validateInsightData', () => {
    it('should parse and validate valid insight template', () => {
      // Generate template
      const templateBuffer = generateInsightTemplate()

      // Parse the template
      const parsedData = parseExcelFile(templateBuffer)

      // Validate the parsed data
      const { valid, invalid } = validateInsightData(parsedData)

      // All sample data in template should be valid
      expect(valid.length).toBeGreaterThan(0)
      expect(invalid.length).toBe(0)
    })
  })

  describe('integration: parseExcelFile → validateTopicData', () => {
    it('should parse and validate valid topic template', () => {
      // Generate template
      const templateBuffer = generateTopicTemplate()

      // Parse the template
      const parsedData = parseExcelFile(templateBuffer)

      // Validate the parsed data
      const { valid, invalid } = validateTopicData(parsedData)

      // All sample data in template should be valid
      expect(valid.length).toBeGreaterThan(0)
      expect(invalid.length).toBe(0)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle very long content strings', () => {
      const longContent = 'A'.repeat(10000)
      const data = [
        { category: 'pain_point', content: longContent, source: '来源' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(1)
      expect(result.valid[0].content).toBe(longContent)
    })

    it('should handle special characters in content', () => {
      const specialChars = '特殊字符：<>&"\'`\n\t\r@#$%^&*()'
      const data = [
        { category: 'trend', content: specialChars, source: '测试' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(1)
      expect(result.valid[0].content).toBe(specialChars)
    })

    it('should handle unicode characters (emoji, Chinese)', () => {
      const data = [
        { category: 'pain_point', content: '😀😁😂 用户反馈 🎉', source: '社交媒体' },
        { title: '💡 创意选题 📱' }
      ]

      const insightResult = validateInsightData([data[0]])
      const topicResult = validateTopicData([data[1]])

      expect(insightResult.valid).toHaveLength(1)
      expect(topicResult.valid).toHaveLength(1)
    })

    it('should handle empty array input', () => {
      const insightResult = validateInsightData([])
      const topicResult = validateTopicData([])

      expect(insightResult.valid).toEqual([])
      expect(insightResult.invalid).toEqual([])
      expect(topicResult.valid).toEqual([])
      expect(topicResult.invalid).toEqual([])
    })

    it('should trim whitespace from field values', () => {
      const data = [
        { category: '  pain_point  ', content: '  洞察内容  ', source: '  来源  ' }
      ]

      const result = validateInsightData(data)

      expect(result.valid).toHaveLength(1)
      expect(result.valid[0].category).toBe('pain_point')
      expect(result.valid[0].content).toBe('洞察内容')
      expect(result.valid[0].source).toBe('来源')
    })
  })
})
