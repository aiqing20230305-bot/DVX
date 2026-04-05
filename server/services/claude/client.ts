import Anthropic from '@anthropic-ai/sdk'
import { config } from '../../config.js'

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: config.anthropicApiKey,
      ...(config.anthropicBaseUrl ? { baseURL: config.anthropicBaseUrl } : {}),
    })
  }
  return _client
}

export interface StreamTextOptions {
  systemPrompt: string
  userContent: Anthropic.MessageParam['content']
  onChunk: (text: string) => void
  onComplete: (fullText: string) => void
  model?: string
  maxTokens?: number
}

export async function streamText(options: StreamTextOptions): Promise<void> {
  const client = getAnthropicClient()
  const { systemPrompt, userContent, onChunk, onComplete, model = config.anthropicModel, maxTokens = 8192 } = options

  let fullText = ''

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }]
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text
      onChunk(event.delta.text)
    }
  }

  onComplete(fullText)
}

export async function generateText(options: Omit<StreamTextOptions, 'onChunk' | 'onComplete'>): Promise<string> {
  const client = getAnthropicClient()
  const { systemPrompt, userContent, model = config.anthropicModel, maxTokens = 8192 } = options

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }]
  })

  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : ''
}
