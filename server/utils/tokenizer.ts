/**
 * 中文分词工具
 *
 * 使用nodejieba进行中文分词，提升全文搜索体验
 */

import nodejieba from 'nodejieba'

/**
 * 对文本进行中文分词
 *
 * @param text - 待分词的文本
 * @returns 分词后的文本（空格分隔）
 *
 * @example
 * tokenize('用户需要生成洞察') => '用户 需要 生成 洞察'
 * tokenize('Hello World 你好世界') => 'Hello World 你好 世界'
 */
export function tokenize(text: string): string {
  if (!text || text.trim().length === 0) {
    return ''
  }

  // 使用jieba分词（cut模式：精确分词）
  const words = nodejieba.cut(text)

  // 空格分隔分词结果
  return words.join(' ')
}

/**
 * 对文本进行中文分词（搜索模式）
 *
 * 搜索模式会产生更多的分词结果，适合搜索场景
 *
 * @param text - 待分词的文本
 * @returns 分词后的文本（空格分隔）
 *
 * @example
 * tokenizeForSearch('结婚的和尚未结婚的') => '结婚 的 和 尚未 尚 未 结婚 的'
 */
export function tokenizeForSearch(text: string): string {
  if (!text || text.trim().length === 0) {
    return ''
  }

  // 使用jieba分词（cutForSearch模式：搜索引擎模式）
  const words = nodejieba.cutForSearch(text)

  // 空格分隔分词结果
  return words.join(' ')
}

/**
 * 提取关键词
 *
 * @param text - 待提取的文本
 * @param topK - 返回前K个关键词
 * @returns 关键词列表
 *
 * @example
 * extractKeywords('用户需要生成市场洞察报告', 3) => ['市场', '洞察', '报告']
 */
export function extractKeywords(text: string, topK: number = 5): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  // 使用TF-IDF算法提取关键词
  const keywords = nodejieba.extract(text, topK)

  // 返回关键词列表
  return keywords.map((item: any) => item.word)
}
