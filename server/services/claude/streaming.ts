/**
 * XMLStreamParser
 * Buffers streaming text and emits complete JSON objects when XML tags are closed.
 * e.g., <insight>{...json...}</insight> emits the parsed JSON.
 */
export class XMLStreamParser<T = unknown> {
  private buffer = ''
  private tagName: string
  private onItem: (item: T) => void
  private onError?: (err: Error, raw: string) => void

  constructor(tagName: string, onItem: (item: T) => void, onError?: (err: Error, raw: string) => void) {
    this.tagName = tagName
    this.onItem = onItem
    this.onError = onError
  }

  feed(chunk: string): void {
    this.buffer += chunk
    this.flush()
  }

  private flush(): void {
    const openTag = `<${this.tagName}>`
    const closeTag = `</${this.tagName}>`

    let startIdx = this.buffer.indexOf(openTag)
    while (startIdx !== -1) {
      const endIdx = this.buffer.indexOf(closeTag, startIdx)
      if (endIdx === -1) break

      const jsonStr = this.buffer.slice(startIdx + openTag.length, endIdx).trim()
      try {
        const parsed = JSON.parse(jsonStr) as T
        this.onItem(parsed)
      } catch (err) {
        this.onError?.(err as Error, jsonStr)
      }

      this.buffer = this.buffer.slice(endIdx + closeTag.length)
      startIdx = this.buffer.indexOf(openTag)
    }
  }

  getRemainingBuffer(): string {
    return this.buffer
  }
}
