/**
 * JSON Utility Functions
 *
 * Provides utilities for safe JSON handling, including control character sanitization
 */

/**
 * Remove control characters from a string that would cause JSON parsing errors
 *
 * Control characters (U+0000 through U+001F) must be escaped in JSON strings.
 * This function removes them to prevent "Invalid string: control characters must be escaped" errors.
 *
 * Note: Preserves newline (\n), tab (\t), and carriage return (\r) as they are valid in JSON
 * when properly escaped by JSON.stringify()
 *
 * @param str - The string to sanitize
 * @returns The sanitized string with control characters removed
 */
export function removeControlCharacters(str: string): string {
  if (!str || typeof str !== 'string') return str

  return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
}

/**
 * Recursively sanitize an object by removing control characters from all string values
 *
 * @param obj - The object to sanitize
 * @returns The sanitized object
 */
export function sanitizeObjectForJSON<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj

  if (typeof obj === 'string') {
    return removeControlCharacters(obj) as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectForJSON(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectForJSON(value)
    }

    return sanitized as T
  }

  return obj
}

/**
 * Safe JSON.stringify with control character sanitization
 *
 * @param obj - The object to stringify
 * @param space - Optional spacing for pretty-printing
 * @returns JSON string with control characters removed
 */
export function safeStringify(obj: unknown, space?: string | number): string {
  const sanitized = sanitizeObjectForJSON(obj)
  return JSON.stringify(sanitized, null, space)
}
