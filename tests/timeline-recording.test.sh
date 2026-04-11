#!/bin/bash

# 时间线记录功能测试脚本
# 验证手动创建和批量创建是否正确记录到时间线

BASE_URL="http://localhost:3001/api"
COOKIE_JAR="/tmp/timeline-test-cookies.txt"
rm -f $COOKIE_JAR

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASSED=0
FAILED=0

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
echo "时间线记录功能测试"
echo "========================================"
echo ""

# ========================================
# 前置准备
# ========================================
echo ">>> 前置准备：创建测试用户和项目..."

TEST_EMAIL="timeline-test-$(date +%s)@test.com"
TEST_PASSWORD="test123456"

# 注册用户
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "name": "时间线测试用户"
  }')

USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')
echo "✓ 用户创建成功: $USER_ID"

# 登录
curl -s -X POST ${BASE_URL}/auth/login \
  -c $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
  }' > /dev/null

echo "✓ 登录成功"

# 创建项目
PROJECT_RESPONSE=$(curl -s -X POST ${BASE_URL}/project \
  -b $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -d '{
    "name": "时间线测试项目",
    "description": "用于测试时间线记录功能",
    "template_id": "fmcg"
  }')

TEST_PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.project.id')
echo "✓ 项目创建成功: $TEST_PROJECT_ID"
echo ""

# 获取初始时间线记录数（应该只有1条：project_created）
INITIAL_TIMELINE=$(curl -s ${BASE_URL}/timeline/${TEST_PROJECT_ID} -b $COOKIE_JAR)
INITIAL_COUNT=$(echo $INITIAL_TIMELINE | jq -r '.timeline | length')
echo "初始时间线记录数: $INITIAL_COUNT"
echo ""

# ========================================
# 测试1: 手动创建洞察 - 验证时间线记录
# ========================================
echo ">>> 测试1: 手动创建洞察 - 验证时间线记录"

curl -s -X POST ${BASE_URL}/insight \
  -b $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'",
    "category": "pain_point",
    "content": "测试洞察：用户反馈产品复杂",
    "source": "测试数据"
  }' > /dev/null

# 查询时间线
TIMELINE=$(curl -s ${BASE_URL}/timeline/${TEST_PROJECT_ID} -b $COOKIE_JAR)
NEW_COUNT=$(echo $TIMELINE | jq -r '.timeline | length')

# 查找insights_generated类型的记录
INSIGHT_EVENTS=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "insights_generated")] | length')

if [ "$INSIGHT_EVENTS" -ge "1" ]; then
  # 检查最新的insight事件的details
  LATEST_INSIGHT=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "insights_generated")] | .[0].details')
  SOURCE=$(echo $LATEST_INSIGHT | jq -r '.source')
  METHOD=$(echo $LATEST_INSIGHT | jq -r '.method')
  COUNT=$(echo $LATEST_INSIGHT | jq -r '.count')

  if [ "$SOURCE" == "manual" ] && [ "$METHOD" == "single" ] && [ "$COUNT" == "1" ]; then
    print_result 0 "手动创建洞察正确记录到时间线（source=manual, method=single, count=1）"
  else
    print_result 1 "时间线记录元数据不正确: source=$SOURCE, method=$METHOD, count=$COUNT"
  fi
else
  print_result 1 "未找到insights_generated事件"
fi

echo ""

# ========================================
# 测试2: 批量创建洞察 - 验证时间线记录
# ========================================
echo ">>> 测试2: 批量创建洞察 - 验证时间线记录"

curl -s -X POST ${BASE_URL}/insight/batch \
  -b $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'",
    "insights": [
      {
        "category": "trend",
        "content": "批量洞察1：短视频趋势"
      },
      {
        "category": "opportunity",
        "content": "批量洞察2：市场机会"
      }
    ]
  }' > /dev/null

# 查询时间线
TIMELINE=$(curl -s ${BASE_URL}/timeline/${TEST_PROJECT_ID} -b $COOKIE_JAR)
INSIGHT_EVENTS=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "insights_generated")] | length')

if [ "$INSIGHT_EVENTS" -ge "2" ]; then
  # 检查最新的insight事件（应该是批量创建）
  LATEST_INSIGHT=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "insights_generated")] | .[0].details')
  SOURCE=$(echo $LATEST_INSIGHT | jq -r '.source')
  METHOD=$(echo $LATEST_INSIGHT | jq -r '.method')
  COUNT=$(echo $LATEST_INSIGHT | jq -r '.count')

  if [ "$SOURCE" == "batch" ] && [ "$METHOD" == "batch_create" ] && [ "$COUNT" == "2" ]; then
    print_result 0 "批量创建洞察正确记录到时间线（source=batch, method=batch_create, count=2）"
  else
    print_result 1 "批量创建时间线记录元数据不正确: source=$SOURCE, method=$METHOD, count=$COUNT"
  fi
else
  print_result 1 "insights_generated事件数量不正确（预期>=2，实际=$INSIGHT_EVENTS）"
fi

echo ""

# ========================================
# 测试3: 手动创建选题 - 验证时间线记录
# ========================================
echo ">>> 测试3: 手动创建选题 - 验证时间线记录"

curl -s -X POST ${BASE_URL}/topic \
  -b $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'",
    "title": "测试选题：产品功能演示"
  }' > /dev/null

# 查询时间线
TIMELINE=$(curl -s ${BASE_URL}/timeline/${TEST_PROJECT_ID} -b $COOKIE_JAR)
TOPIC_EVENTS=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "topics_generated")] | length')

if [ "$TOPIC_EVENTS" -ge "1" ]; then
  # 检查最新的topic事件
  LATEST_TOPIC=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "topics_generated")] | .[0].details')
  SOURCE=$(echo $LATEST_TOPIC | jq -r '.source')
  METHOD=$(echo $LATEST_TOPIC | jq -r '.method')
  COUNT=$(echo $LATEST_TOPIC | jq -r '.count')

  if [ "$SOURCE" == "manual" ] && [ "$METHOD" == "single" ] && [ "$COUNT" == "1" ]; then
    print_result 0 "手动创建选题正确记录到时间线（source=manual, method=single, count=1）"
  else
    print_result 1 "选题时间线记录元数据不正确: source=$SOURCE, method=$METHOD, count=$COUNT"
  fi
else
  print_result 1 "未找到topics_generated事件"
fi

echo ""

# ========================================
# 测试4: 批量创建选题 - 验证时间线记录
# ========================================
echo ">>> 测试4: 批量创建选题 - 验证时间线记录"

curl -s -X POST ${BASE_URL}/topic/batch \
  -b $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "'$TEST_PROJECT_ID'",
    "topics": [
      {"title": "批量选题1：产品卖点型"},
      {"title": "批量选题2：痛点共鸣型"}
    ]
  }' > /dev/null

# 查询时间线
TIMELINE=$(curl -s ${BASE_URL}/timeline/${TEST_PROJECT_ID} -b $COOKIE_JAR)
TOPIC_EVENTS=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "topics_generated")] | length')

if [ "$TOPIC_EVENTS" -ge "2" ]; then
  # 检查最新的topic事件（应该是批量创建）
  LATEST_TOPIC=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "topics_generated")] | .[0].details')
  SOURCE=$(echo $LATEST_TOPIC | jq -r '.source')
  METHOD=$(echo $LATEST_TOPIC | jq -r '.method')
  COUNT=$(echo $LATEST_TOPIC | jq -r '.count')

  if [ "$SOURCE" == "batch" ] && [ "$METHOD" == "batch_create" ] && [ "$COUNT" == "2" ]; then
    print_result 0 "批量创建选题正确记录到时间线（source=batch, method=batch_create, count=2）"
  else
    print_result 1 "批量创建选题时间线记录元数据不正确: source=$SOURCE, method=$METHOD, count=$COUNT"
  fi
else
  print_result 1 "topics_generated事件数量不正确（预期>=2，实际=$TOPIC_EVENTS）"
fi

echo ""

# ========================================
# 测试5: 验证时间线事件类型映射
# ========================================
echo ">>> 测试5: 验证时间线事件类型映射"

# 检查是否有project_created, insights_generated, topics_generated
PROJECT_CREATED=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "project_created")] | length')
INSIGHTS_GEN=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "insights_generated")] | length')
TOPICS_GEN=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "topics_generated")] | length')

if [ "$PROJECT_CREATED" -ge "1" ]; then
  print_result 0 "包含project_created事件"
else
  print_result 1 "缺少project_created事件"
fi

if [ "$INSIGHTS_GEN" -ge "2" ]; then
  print_result 0 "包含insights_generated事件（共 $INSIGHTS_GEN 条）"
else
  print_result 1 "insights_generated事件数量不足（共 $INSIGHTS_GEN 条，预期>=2）"
fi

if [ "$TOPICS_GEN" -ge "2" ]; then
  print_result 0 "包含topics_generated事件（共 $TOPICS_GEN 条）"
else
  print_result 1 "topics_generated事件数量不足（共 $TOPICS_GEN 条，预期>=2）"
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
