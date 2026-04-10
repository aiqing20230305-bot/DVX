import { kbRepo, KBItem } from '../db/repositories/kb.repo.js'

export interface KBSearchResult {
  id: string
  type: KBItem['type']
  title: string
  content: string
  tags: string[]
  project_id: string | null
  rank: number
  snippet: string
  created_at: number
  updated_at: number
}

export interface KBQueryResponse {
  results: KBSearchResult[]
  total: number
  query: string
  executionTime: number
}

/**
 * Extract relevant snippet from content based on query
 * Returns first 200 characters around the first occurrence of any query term
 */
function extractSnippet(content: string, query: string, maxLength: number = 200): string {
  if (!content) return ''

  // Split query into terms
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)

  // Find first occurrence of any term
  let earliestIndex = -1
  for (const term of terms) {
    const index = content.toLowerCase().indexOf(term)
    if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
      earliestIndex = index
    }
  }

  // If no term found, return start of content
  if (earliestIndex === -1) {
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
  }

  // Extract snippet around the match
  const start = Math.max(0, earliestIndex - 50)
  const end = Math.min(content.length, earliestIndex + maxLength - 50)

  let snippet = content.substring(start, end)

  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'

  return snippet
}

/**
 * Query knowledge base using FTS5 full-text search
 * Returns ranked results with snippets
 */
export function queryKnowledgeBase(
  query: string,
  projectId?: string,
  limit: number = 10
): KBQueryResponse {
  const startTime = Date.now()

  // Use FTS5 search methods
  let rawResults: Array<KBItem & { rank: number }>

  if (projectId) {
    rawResults = kbRepo.ftsSearchByProject(projectId, query, limit)
  } else {
    rawResults = kbRepo.ftsSearch(query, limit)
  }

  // Format results with snippets
  const results: KBSearchResult[] = rawResults.map(item => ({
    id: item.id,
    type: item.type,
    title: item.title,
    content: item.content,
    tags: JSON.parse(item.tags) as string[],
    project_id: item.project_id,
    rank: item.rank,
    snippet: extractSnippet(item.content, query),
    created_at: item.created_at,
    updated_at: item.updated_at
  }))

  const executionTime = Date.now() - startTime

  return {
    results,
    total: results.length,
    query,
    executionTime
  }
}

/**
 * Get related knowledge base items by tags
 * Used for "More like this" suggestions
 */
export function getRelatedKBItems(
  itemId: string,
  projectId?: string,
  limit: number = 5
): KBItem[] {
  const item = kbRepo.findById(itemId)
  if (!item) return []

  const tags = JSON.parse(item.tags) as string[]
  if (tags.length === 0) return []

  // Build FTS5 query from tags
  const query = tags.join(' OR ')

  let results: Array<KBItem & { rank: number }>
  if (projectId) {
    results = kbRepo.ftsSearchByProject(projectId, query, limit + 1)
  } else {
    results = kbRepo.ftsSearch(query, limit + 1)
  }

  // Filter out the original item and remove rank field
  return results
    .filter(r => r.id !== itemId)
    .slice(0, limit)
    .map(({ rank, ...item }) => item)
}
