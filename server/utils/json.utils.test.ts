import { describe, it, expect } from 'vitest'
import { removeControlCharacters, sanitizeObjectForJSON, safeStringify } from './json.utils'

describe('json.utils', () => {
  describe('removeControlCharacters', () => {
    it('should remove control characters from string', () => {
      const input = 'Hello\u0000\u0001\u0002World'
      const result = removeControlCharacters(input)
      expect(result).toBe('HelloWorld')
    })

    it('should preserve newline, tab, and carriage return', () => {
      const input = 'Line1\nLine2\tTabbed\rCarriage'
      const result = removeControlCharacters(input)
      expect(result).toBe('Line1\nLine2\tTabbed\rCarriage')
    })

    it('should remove DEL and C1 control characters', () => {
      const input = 'Text\u007FMore\u0080Text\u009F'
      const result = removeControlCharacters(input)
      expect(result).toBe('TextMoreText')
    })

    it('should handle empty string', () => {
      expect(removeControlCharacters('')).toBe('')
    })

    it('should handle non-string input', () => {
      expect(removeControlCharacters(null as any)).toBe(null)
      expect(removeControlCharacters(undefined as any)).toBe(undefined)
      expect(removeControlCharacters(123 as any)).toBe(123)
    })

    it('should remove specific problematic characters', () => {
      // U+0000-U+0008, U+000B, U+000C, U+000E-U+001F
      const problematic = '\u0000\u0001\u000B\u000C\u001F'
      const result = removeControlCharacters(problematic)
      expect(result).toBe('')
    })
  })

  describe('sanitizeObjectForJSON', () => {
    it('should sanitize strings in flat object', () => {
      const input = {
        name: 'Test\u0000Name',
        description: 'Desc\u0001ription'
      }
      const result = sanitizeObjectForJSON(input)
      expect(result).toEqual({
        name: 'TestName',
        description: 'Description'
      })
    })

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: 'John\u0000',
          bio: 'Developer\u0001'
        },
        meta: {
          tags: ['tag1\u0002', 'tag2']
        }
      }
      const result = sanitizeObjectForJSON(input)
      expect(result).toEqual({
        user: {
          name: 'John',
          bio: 'Developer'
        },
        meta: {
          tags: ['tag1', 'tag2']
        }
      })
    })

    it('should sanitize arrays', () => {
      const input = ['item1\u0000', 'item2\u0001', 'item3']
      const result = sanitizeObjectForJSON(input)
      expect(result).toEqual(['item1', 'item2', 'item3'])
    })

    it('should handle null and undefined', () => {
      expect(sanitizeObjectForJSON(null)).toBe(null)
      expect(sanitizeObjectForJSON(undefined)).toBe(undefined)
    })

    it('should preserve non-string primitives', () => {
      const input = {
        str: 'text\u0000',
        num: 123,
        bool: true,
        nul: null
      }
      const result = sanitizeObjectForJSON(input)
      expect(result).toEqual({
        str: 'text',
        num: 123,
        bool: true,
        nul: null
      })
    })

    it('should handle complex nested structure', () => {
      const input = {
        html: '<div>Content\u0000</div>',
        data: {
          insights: [
            { title: 'Insight\u0001', summary: 'Summary\u0002' }
          ],
          nested: {
            deep: {
              value: 'deep\u0000value'
            }
          }
        }
      }
      const result = sanitizeObjectForJSON(input)
      expect(result).toEqual({
        html: '<div>Content</div>',
        data: {
          insights: [
            { title: 'Insight', summary: 'Summary' }
          ],
          nested: {
            deep: {
              value: 'deepvalue'
            }
          }
        }
      })
    })
  })

  describe('safeStringify', () => {
    it('should stringify object with control characters removed', () => {
      const input = { text: 'Hello\u0000World' }
      const result = safeStringify(input)
      const parsed = JSON.parse(result)
      expect(parsed).toEqual({ text: 'HelloWorld' })
    })

    it('should produce valid JSON', () => {
      const input = {
        html: '<div>Content\u0000\u0001\u0002</div>',
        data: ['item1\u0000', 'item2']
      }
      const result = safeStringify(input)

      // Should not throw when parsing
      expect(() => JSON.parse(result)).not.toThrow()

      const parsed = JSON.parse(result)
      expect(parsed).toEqual({
        html: '<div>Content</div>',
        data: ['item1', 'item2']
      })
    })

    it('should handle pretty-printing', () => {
      const input = { a: 'test\u0000', b: 123 }
      const result = safeStringify(input, 2)

      expect(result).toContain('\n')
      expect(result).toContain('  ')

      const parsed = JSON.parse(result)
      expect(parsed).toEqual({ a: 'test', b: 123 })
    })

    it('should handle real-world report HTML with control characters', () => {
      const mockHTML = `
        <html>
          <body>
            <div>Report\u0000Content</div>
            <p>Description\u0001\u0002</p>
          </body>
        </html>
      `
      const input = { html: mockHTML }
      const result = safeStringify(input)

      // Should produce valid JSON
      expect(() => JSON.parse(result)).not.toThrow()

      const parsed = JSON.parse(result)
      expect(parsed.html).not.toContain('\u0000')
      expect(parsed.html).not.toContain('\u0001')
      expect(parsed.html).not.toContain('\u0002')
    })
  })

  describe('integration test: report JSON response', () => {
    it('should handle typical report response structure', () => {
      const mockReport = {
        html: `
          <!DOCTYPE html>
          <html>
            <body>
              <h1>Report\u0000Title</h1>
              <p>Some content with\u0001control\u0002chars</p>
              <div>Data: \u001FTest</div>
            </body>
          </html>
        `
      }

      const sanitized = sanitizeObjectForJSON(mockReport)
      const jsonString = JSON.stringify(sanitized)

      // Should not throw
      expect(() => JSON.parse(jsonString)).not.toThrow()

      // Verify control characters are removed
      expect(sanitized.html).not.toContain('\u0000')
      expect(sanitized.html).not.toContain('\u0001')
      expect(sanitized.html).not.toContain('\u0002')
      expect(sanitized.html).not.toContain('\u001F')

      // Verify content is preserved
      expect(sanitized.html).toContain('ReportTitle')
      expect(sanitized.html).toContain('controlchars')
      expect(sanitized.html).toContain('Data: Test')
    })
  })
})
