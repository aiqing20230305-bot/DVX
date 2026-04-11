#!/bin/bash

# 批量创建API测试脚本
# 测试 POST /api/insight/batch 和 POST /api/topic/batch

# set -e 暂时禁用，以便看到所有测试结果
# set -e

BASE_URL="http://localhost:3001/api"
TEST_PROJECT_ID=""
AUTH_TOKEN=""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
PASSED=0
FAILED=0

# 打印测试结果
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC}: $2"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC}: $2"
    ((FAILED++))
  fi
}

echo "========================================"
echo "批量创建API测试"
echo "========================================"
echo ""

# ========================================
# 前置准备：创建测试项目
# ========================================
echo ">>> 前置准备：创建测试项目..."

# Cookie jar文件
COOKIE_JAR="/tmp/batch-test-cookies.txt"
rm -f $COOKIE_JAR

# 生成唯一邮箱
TEST_EMAIL="batch-test-$(date +%s)@test.com"
TEST_PASSWORD="test123456"

# 创建用户
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "name": "批量测试用户"
  }')

USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
  echo -e "${RED}✗ 用户注册失败: $REGISTER_RESPONSE${NC}"
  exit 1
fi

echo "✓ 用户创建成功: $USER_ID"

# 登录获取Cookie
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/login \
  -c $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
  }')

LOGIN_USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

if [ -z "$LOGIN_USER_ID" ] || [ "$LOGIN_USER_ID" == "null" ]; then
  echo -e "${RED}✗ 登录失败: $LOGIN_RESPONSE${NC}"
  exit 1
fi

echo "✓ 登录成功: $LOGIN_USER_ID"

# 创建测试项目
PROJECT_RESPONSE=$(curl -s -X POST ${BASE_URL}/project \
  -b $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -d '{
    "name": "批量创建测试项目",
    "description": "用于测试批量创建API",
    "template_id": "fmcg"
  }')

TEST_PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.project.id')

if [ -z "$TEST_PROJECT_ID" ] || [ "$TEST_PROJECT_ID" == "null" ]; then
  echo -e "${RED}✗ 测试项目创建失败${NC}"
  exit 1
fi

echo "✓ 测试项目创建成功: $TEST_PROJECT_ID"
echo ""

# ========================================
# 测试1: 批量创建洞察 - 正常流程
# ========================================
echo ">>> 测试1: POST /api/insight/batch - 正常流程"

RESPONSE=$(curl -s -X POST ${BASE_URL}/insight/batch \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'",
    "insights": [
      {
        "category": "pain_point",
        "content": "用户反馈产品使用复杂，需要简化操作流程",
        "source": "用户调研"
      },
      {
        "category": "trend",
        "content": "短视频平台用户更偏好15秒以内的内容",
        "source": "平台数据"
      },
      {
        "category": "opportunity",
        "content": "竞品在下沉市场覆盖不足，存在机会",
        "source": "市场分析"
      }
    ]
  }')

SUCCESS=$(echo $RESPONSE | jq -r '.success')
COUNT=$(echo $RESPONSE | jq -r '.count')
INSIGHTS_LENGTH=$(echo $RESPONSE | jq -r '.insights | length')

if [ "$SUCCESS" == "true" ] && [ "$COUNT" == "3" ] && [ "$INSIGHTS_LENGTH" == "3" ]; then
  print_result 0 "批量创建3个洞察成功"
else
  print_result 1 "批量创建洞察失败: $RESPONSE"
fi

echo ""

# ========================================
# 测试2: 批量创建洞察 - 缺少projectId
# ========================================
echo ">>> 测试2: POST /api/insight/batch - 缺少projectId"

RESPONSE=$(curl -s -X POST ${BASE_URL}/insight/batch \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR \
  -d '{
    "insights": [
      {
        "category": "pain_point",
        "content": "测试内容"
      }
    ]
  }')

ERROR=$(echo $RESPONSE | jq -r '.error')

if [[ "$ERROR" == *"projectId"* ]]; then
  print_result 0 "正确返回projectId缺失错误"
else
  print_result 1 "未正确处理projectId缺失: $RESPONSE"
fi

echo ""

# ========================================
# 测试3: 批量创建洞察 - 缺少insights数组
# ========================================
echo ">>> 测试3: POST /api/insight/batch - 缺少insights数组"

RESPONSE=$(curl -s -X POST ${BASE_URL}/insight/batch \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'"
  }')

ERROR=$(echo $RESPONSE | jq -r '.error')

if [[ "$ERROR" == *"insights"* ]]; then
  print_result 0 "正确返回insights数组缺失错误"
else
  print_result 1 "未正确处理insights数组缺失: $RESPONSE"
fi

echo ""

# ========================================
# 测试4: 批量创建洞察 - 单个项目缺少必填字段
# ========================================
echo ">>> 测试4: POST /api/insight/batch - 单个项目缺少必填字段"

RESPONSE=$(curl -s -X POST ${BASE_URL}/insight/batch \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'",
    "insights": [
      {
        "category": "pain_point",
        "content": "第一个洞察"
      },
      {
        "category": "trend"
      },
      {
        "category": "opportunity",
        "content": "第三个洞察"
      }
    ]
  }')

ERROR=$(echo $RESPONSE | jq -r '.error')

if [[ "$ERROR" == *"第2个"* ]] && [[ "$ERROR" == *"content"* ]]; then
  print_result 0 "正确识别第2个洞察缺少content字段"
else
  print_result 1 "未正确识别单个项目字段缺失: $RESPONSE"
fi

echo ""

# ========================================
# 测试5: 批量创建选题 - 正常流程
# ========================================
echo ">>> 测试5: POST /api/topic/batch - 正常流程"

RESPONSE=$(curl -s -X POST ${BASE_URL}/topic/batch \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'",
    "topics": [
      {
        "title": "产品功能演示-短平快",
        "angle": "产品卖点型",
        "persona": "年轻白领",
        "platform": "douyin",
        "estimated_duration": 15
      },
      {
        "title": "用户痛点共鸣-情感型",
        "angle": "痛点共鸣型",
        "persona": "宝妈群体",
        "platform": "xiaohongshu",
        "estimated_duration": 30
      }
    ]
  }')

SUCCESS=$(echo $RESPONSE | jq -r '.success')
COUNT=$(echo $RESPONSE | jq -r '.count')
TOPICS_LENGTH=$(echo $RESPONSE | jq -r '.topics | length')

if [ "$SUCCESS" == "true" ] && [ "$COUNT" == "2" ] && [ "$TOPICS_LENGTH" == "2" ]; then
  print_result 0 "批量创建2个选题成功"
else
  print_result 1 "批量创建选题失败: $RESPONSE"
fi

echo ""

# ========================================
# 测试6: 批量创建选题 - 缺少title
# ========================================
echo ">>> 测试6: POST /api/topic/batch - 单个选题缺少title"

RESPONSE=$(curl -s -X POST ${BASE_URL}/topic/batch \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'",
    "topics": [
      {
        "title": "第一个选题"
      },
      {
        "angle": "产品卖点型"
      }
    ]
  }')

ERROR=$(echo $RESPONSE | jq -r '.error')

if [[ "$ERROR" == *"第2个"* ]] && [[ "$ERROR" == *"title"* ]]; then
  print_result 0 "正确识别第2个选题缺少title字段"
else
  print_result 1 "未正确识别单个选题字段缺失: $RESPONSE"
fi

echo ""

# ========================================
# 测试7: 批量创建选题 - 使用默认值
# ========================================
echo ">>> 测试7: POST /api/topic/batch - 验证默认值填充"

RESPONSE=$(curl -s -X POST ${BASE_URL}/topic/batch \
  -H "Content-Type: application/json" \
  -b $COOKIE_JAR \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'",
    "topics": [
      {
        "title": "只有标题的选题"
      }
    ]
  }')

SUCCESS=$(echo $RESPONSE | jq -r '.success')
FIRST_TOPIC=$(echo $RESPONSE | jq -r '.topics[0]')
PLATFORM=$(echo $FIRST_TOPIC | jq -r '.platform')
DURATION=$(echo $FIRST_TOPIC | jq -r '.estimated_duration')

if [ "$SUCCESS" == "true" ] && [ "$PLATFORM" == "douyin" ] && [ "$DURATION" == "30" ]; then
  print_result 0 "默认值正确填充（platform=douyin, duration=30）"
else
  print_result 1 "默认值填充异常: $RESPONSE"
fi

echo ""

# ========================================
# 测试8: 验证数据持久化
# ========================================
echo ">>> 测试8: 验证数据持久化"

# 查询洞察
INSIGHTS_RESPONSE=$(curl -s ${BASE_URL}/insight/${TEST_PROJECT_ID} \
  -b $COOKIE_JAR)

INSIGHTS_COUNT=$(echo $INSIGHTS_RESPONSE | jq -r '.insights | length')

# 查询选题
TOPICS_RESPONSE=$(curl -s ${BASE_URL}/topic/${TEST_PROJECT_ID} \
  -b $COOKIE_JAR)

TOPICS_COUNT=$(echo $TOPICS_RESPONSE | jq -r '.topics | length')

# 应该有3个洞察（测试1）和3个选题（测试5 + 测试7）
if [ "$INSIGHTS_COUNT" -ge "3" ]; then
  print_result 0 "洞察数据持久化成功（共 $INSIGHTS_COUNT 条）"
else
  print_result 1 "洞察数据持久化异常（预期>=3，实际 $INSIGHTS_COUNT）"
fi

if [ "$TOPICS_COUNT" -ge "3" ]; then
  print_result 0 "选题数据持久化成功（共 $TOPICS_COUNT 条）"
else
  print_result 1 "选题数据持久化异常（预期>=3，实际 $TOPICS_COUNT）"
fi

echo ""

# ========================================
# 测试结果汇总
# ========================================
echo "========================================"
echo "测试结果汇总"
echo "========================================"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo -e "总计: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ 所有测试通过！${NC}"
  exit 0
else
  echo -e "\n${RED}✗ 部分测试失败${NC}"
  exit 1
fi
