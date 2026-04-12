// v2.20.0 Phase 3.2: 测试数据生成工具
// 生成完整测试数据：项目 → 洞察 → 选题 → 脚本 → 版本历史

import { projectRepo } from '../db/repositories/project.repo.js'
import { insightRepo } from '../db/repositories/insight.repo.js'
import { topicRepo } from '../db/repositories/topic.repo.js'
import { scriptRepo, ScriptSegment } from '../db/repositories/script.repo.js'
import { scriptHistoryRepo } from '../db/repositories/script-history.repo.js'

/**
 * 生成测试用的分镜segments
 */
function generateTestSegments(count: number): ScriptSegment[] {
  return Array.from({ length: count }, (_, i) => ({
    type: ['opening', 'scene', 'product', 'closing'][i % 4],
    content: `分镜内容 ${i + 1}：这是测试场景的详细描述`,
    voiceover: `旁白文案 ${i + 1}：这是测试旁白`,
    duration: 3,
    shot: '中景',
    direction: '测试镜头指导',
  }))
}

/**
 * 主函数：生成完整测试数据
 */
async function seedTestData() {
  console.log('🌱 开始生成测试数据...\n')

  try {
    // 1. 创建测试项目
    console.log('📁 Step 1: 创建测试项目')
    const project = projectRepo.create({
      name: '测试项目-多芬洗发水',
      description: '完整测试数据 - 包含洞察/选题/脚本/版本历史',
      brand: '多芬',
      category: '快消品',
      target_audience: '25-35岁女性消费者',
      tags: ['测试', '快消品', 'E2E']
    })
    console.log(`✅ 项目创建成功 (ID: ${project.id})\n`)

    // 2. 生成洞察数据（10条）
    console.log('💡 Step 2: 生成洞察数据 (10条)')
    const insights = []
    const insightTypes: Array<'trend' | 'gap' | 'competitor'> = ['trend', 'gap', 'competitor']
    const confidenceLevels: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low']

    for (let i = 1; i <= 10; i++) {
      const insight = insightRepo.create(project.id, {
        type: insightTypes[i % 3],
        title: `测试洞察 ${i}`,
        summary: `洞察内容 ${i}：基于市场分析得出的关键发现`,
        evidence: [`测试证据 ${i}A`, `测试证据 ${i}B`],
        confidence: confidenceLevels[i % 3],
        actionable: true
      })
      insights.push(insight)
    }
    console.log(`✅ 洞察生成成功 (${insights.length}条)\n`)

    // 3. 生成选题数据（5个）
    console.log('📝 Step 3: 生成选题数据 (5个)')
    const topics = []
    const platforms = ['douyin', 'xiaohongshu']
    const priorities = ['high', 'medium', 'low']

    for (let i = 1; i <= 5; i++) {
      const topic = topicRepo.create(project.id, {
        title: `测试选题 ${i}`,
        angle: `选题角度 ${i}：测试内容方向`,
        persona: `目标用户画像 ${i}`,
        platform: platforms[i % 2],
        estimatedDuration: 30 + i * 10,
        cta: `行动召唤 ${i}`,
        insightRef: insights.slice(0, 3).map(ins => ins.id),
        priority: priorities[i % 3]
      })
      topics.push(topic)
    }
    console.log(`✅ 选题生成成功 (${topics.length}个)\n`)

    // 4. 生成脚本数据（2个，每个3个版本）
    console.log('🎬 Step 4: 生成脚本数据 (2个脚本，每个3个版本)')

    for (let i = 1; i <= 2; i++) {
      const segments = generateTestSegments(5)
      const fullText = segments.map(s => s.voiceover || s.content).join('\n')

      // 创建脚本
      const script = scriptRepo.create(
        project.id,
        topics[i - 1].id,
        i === 1 ? 'A' : 'B',
        {
          segments,
          fullVoiceover: fullText,
          fullText: fullText,
          wordCount: fullText.length
        }
      )

      console.log(`  📄 脚本 ${i} 创建成功 (ID: ${script.id}, 变体: ${i === 1 ? 'A' : 'B'})`)

      // 为每个脚本保存3个历史版本
      for (let v = 1; v <= 3; v++) {
        // 延迟确保时间戳不同
        await new Promise(resolve => setTimeout(resolve, 100))

        const versionSegments = generateTestSegments(5 + v)
        const versionFullText = versionSegments.map(s => s.voiceover || s.content).join('\n')

        scriptHistoryRepo.create({
          script_id: script.id,
          version: v,
          segments: JSON.stringify(versionSegments),
          full_text: versionFullText,
          word_count: versionFullText.length
        })

        console.log(`    ↳ 版本 v${v} 已保存`)
      }
    }
    console.log(`✅ 脚本生成成功 (2个脚本，每个3个版本)\n`)

    // 5. 完成总结
    console.log('=' .repeat(60))
    console.log('✅ 测试数据生成完成！')
    console.log('=' .repeat(60))
    console.log(`📊 数据统计:`)
    console.log(`   项目ID:     ${project.id}`)
    console.log(`   项目名称:   ${project.name}`)
    console.log(`   洞察数量:   ${insights.length}条`)
    console.log(`   选题数量:   ${topics.length}个`)
    console.log(`   脚本数量:   2个 (A/B变体)`)
    console.log(`   版本历史:   6条 (每个脚本3个版本)`)
    console.log('=' .repeat(60))
    console.log('\n💡 使用方式:')
    console.log('   1. 在超级洞察应用中打开项目列表')
    console.log('   2. 找到"测试项目-多芬洗发水"')
    console.log('   3. 开始测试各项功能\n')

  } catch (error) {
    console.error('❌ 测试数据生成失败:', error)
    throw error
  }
}

// 执行
seedTestData()
  .then(() => {
    console.log('🎉 测试数据生成脚本执行完毕')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 脚本执行失败:', error)
    process.exit(1)
  })
