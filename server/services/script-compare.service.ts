import DiffMatchPatch from 'diff-match-patch'
import { scriptHistoryRepo } from '../db/repositories/script-history.repo.js'
import { ScriptSegment } from '../db/repositories/script.repo.js'

const dmp = new DiffMatchPatch()

// v2.23.0: Import Diff type from diff-match-patch
type Diff = [number, string]

/**
 * Diff operation type
 */
export type DiffOperation = 'added' | 'removed' | 'modified' | 'unchanged'

/**
 * Segment-level diff result
 */
export interface SegmentDiff {
  segmentIndex: number
  type: DiffOperation
  oldSegment?: ScriptSegment
  newSegment?: ScriptSegment
  contentDiff?: Diff[]  // Character-level diff for modified segments
  directionDiff?: Diff[] // Character-level diff for shot/direction
}

/**
 * Complete comparison result
 */
export interface ComparisonResult {
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

/**
 * Compare two script versions and return detailed diff
 *
 * @param historyId1 - First version history ID
 * @param historyId2 - Second version history ID
 * @returns ComparisonResult with detailed diff
 */
export function compareScriptVersions(historyId1: string, historyId2: string): ComparisonResult {
  // Get history records
  const history1 = scriptHistoryRepo.findById(historyId1)
  const history2 = scriptHistoryRepo.findById(historyId2)

  if (!history1 || !history2) {
    throw new Error('History record not found')
  }

  if (history1.script_id !== history2.script_id) {
    throw new Error('Cannot compare histories from different scripts')
  }

  // Parse segments
  const segments1: ScriptSegment[] = JSON.parse(history1.segments)
  const segments2: ScriptSegment[] = JSON.parse(history2.segments)

  // Compute diff
  const diff = computeSegmentDiff(segments1, segments2)

  // Compute summary
  const summary = {
    added: diff.filter(d => d.type === 'added').length,
    removed: diff.filter(d => d.type === 'removed').length,
    modified: diff.filter(d => d.type === 'modified').length,
    unchanged: diff.filter(d => d.type === 'unchanged').length
  }

  return {
    version1: {
      id: history1.id,
      version: history1.version,
      script_id: history1.script_id,
      created_at: history1.created_at
    },
    version2: {
      id: history2.id,
      version: history2.version,
      script_id: history2.script_id,
      created_at: history2.created_at
    },
    diff,
    summary
  }
}

/**
 * Compute segment-level diff using LCS (Longest Common Subsequence) algorithm
 *
 * @param segments1 - Segments from version 1
 * @param segments2 - Segments from version 2
 * @returns Array of SegmentDiff
 */
function computeSegmentDiff(segments1: ScriptSegment[], segments2: ScriptSegment[]): SegmentDiff[] {
  const result: SegmentDiff[] = []

  // Use dynamic programming to find LCS (simplified version)
  // For production, consider using a dedicated diff library for arrays

  let i = 0 // pointer for segments1
  let j = 0 // pointer for segments2
  let segmentIndex = 0

  while (i < segments1.length || j < segments2.length) {
    const seg1 = segments1[i]
    const seg2 = segments2[j]

    if (i >= segments1.length) {
      // Remaining segments in segments2 are added
      result.push({
        segmentIndex: segmentIndex++,
        type: 'added',
        newSegment: seg2
      })
      j++
    } else if (j >= segments2.length) {
      // Remaining segments in segments1 are removed
      result.push({
        segmentIndex: segmentIndex++,
        type: 'removed',
        oldSegment: seg1
      })
      i++
    } else if (areSegmentsEqual(seg1, seg2)) {
      // Segments are identical
      result.push({
        segmentIndex: segmentIndex++,
        type: 'unchanged',
        oldSegment: seg1,
        newSegment: seg2
      })
      i++
      j++
    } else {
      // Segments are different
      // Check if this is a modification or add/remove
      const similarity = computeSegmentSimilarity(seg1, seg2)

      if (similarity > 0.5) {
        // Likely a modification
        // v2.23.0: Add type guard for undefined content
        const contentDiff = dmp.diff_main(seg1.content || '', seg2.content || '')
        dmp.diff_cleanupSemantic(contentDiff)

        const directionDiff = dmp.diff_main(seg1.direction || '', seg2.direction || '')
        dmp.diff_cleanupSemantic(directionDiff)

        result.push({
          segmentIndex: segmentIndex++,
          type: 'modified',
          oldSegment: seg1,
          newSegment: seg2,
          contentDiff,
          directionDiff
        })
        i++
        j++
      } else {
        // More likely a remove + add
        // Try to look ahead to see if seg1 appears later in segments2
        const foundIndex = segments2.findIndex((s, idx) => idx > j && areSegmentsEqual(s, seg1))

        if (foundIndex !== -1 && foundIndex - j <= 3) {
          // seg1 appears later, so current seg2 is an addition
          result.push({
            segmentIndex: segmentIndex++,
            type: 'added',
            newSegment: seg2
          })
          j++
        } else {
          // seg1 is removed
          result.push({
            segmentIndex: segmentIndex++,
            type: 'removed',
            oldSegment: seg1
          })
          i++
        }
      }
    }
  }

  return result
}

/**
 * Check if two segments are equal
 */
function areSegmentsEqual(seg1: ScriptSegment, seg2: ScriptSegment): boolean {
  return (
    seg1.type === seg2.type &&
    seg1.content === seg2.content &&
    seg1.direction === seg2.direction &&
    seg1.duration === seg2.duration
  )
}

/**
 * Compute similarity between two segments (0-1 range)
 * Used to distinguish between modification vs remove+add
 */
function computeSegmentSimilarity(seg1: ScriptSegment, seg2: ScriptSegment): number {
  let score = 0
  let maxScore = 0

  // Type match (25%)
  maxScore += 0.25
  if (seg1.type === seg2.type) score += 0.25

  // Content similarity (50%)
  maxScore += 0.5
  // v2.23.0: Add type guard for undefined content
  const contentSimilarity = computeStringSimilarity(seg1.content || '', seg2.content || '')
  score += contentSimilarity * 0.5

  // Direction similarity (15%)
  maxScore += 0.15
  const directionSimilarity = computeStringSimilarity(seg1.direction || '', seg2.direction || '')
  score += directionSimilarity * 0.15

  // Duration similarity (10%)
  maxScore += 0.1
  if (seg1.duration === seg2.duration) score += 0.1

  return score / maxScore
}

/**
 * Compute string similarity using Levenshtein distance
 */
function computeStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1
  if (!str1 || !str2) return 0

  const distance = levenshteinDistance(str1, str2)
  const maxLen = Math.max(str1.length, str2.length)

  return 1 - distance / maxLen
}

/**
 * Compute Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  // Create DP table
  const dp: number[][] = Array(len1 + 1).fill(0).map(() => Array(len2 + 1).fill(0))

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) dp[i][0] = i
  for (let j = 0; j <= len2; j++) dp[0][j] = j

  // Fill DP table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }

  return dp[len1][len2]
}
