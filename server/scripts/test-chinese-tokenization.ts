/**
 * 测试中文分词功能
 *
 * 验证tokenize()函数正确分词中文文本
 */

import { tokenize, tokenizeForSearch, extractKeywords } from '../utils/tokenizer.js'

console.log('=== 中文分词测试 ===\n')

// 测试1: 基础分词
console.log('测试1: 基础分词')
const text1 = '用户需要生成市场洞察报告'
const result1 = tokenize(text1)
console.log(`原文: ${text1}`)
console.log(`分词结果: ${result1}`)
console.log(`分词数量: ${result1.split(' ').length}个词\n`)

// 测试2: 搜索模式分词（更细粒度）
console.log('测试2: 搜索模式分词')
const text2 = '结婚的和尚未结婚的人'
const result2 = tokenizeForSearch(text2)
console.log(`原文: ${text2}`)
console.log(`搜索模式分词: ${result2}`)
console.log(`分词数量: ${result2.split(' ').length}个词\n`)

// 测试3: 混合中英文分词
console.log('测试3: 混合中英文分词')
const text3 = '使用Claude API生成AI内容'
const result3 = tokenize(text3)
console.log(`原文: ${text3}`)
console.log(`分词结果: ${result3}`)
console.log(`分词数量: ${result3.split(' ').length}个词\n`)

// 测试4: 关键词提取
console.log('测试4: 关键词提取')
const text4 = '超级洞察是一款基于AI的电商内容策略平台，帮助品牌营销人员快速生成市场洞察、选题策划和脚本创作'
const keywords = extractKeywords(text4, 5)
console.log(`原文: ${text4}`)
console.log(`关键词: ${keywords.join(', ')}\n`)

// 测试5: 空字符串处理
console.log('测试5: 边界情况')
const text5 = ''
const result5 = tokenize(text5)
console.log(`原文: (空字符串)`)
console.log(`分词结果: "${result5}"`)
console.log(`是否正确处理: ${result5 === '' ? '✓' : '✗'}\n`)

console.log('=== 测试完成 ===')
