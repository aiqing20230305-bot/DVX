#!/bin/bash

# Excel/CSV导入功能测试脚本
# 测试 POST /api/insight/import, POST /api/topic/import, GET /api/insight/template, GET /api/topic/template

BASE_URL="http://localhost:3001/api"
COOKIE_JAR="/tmp/excel-import-test-cookies.txt"
rm -f $COOKIE_JAR

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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
echo "Excel/CSV导入功能测试"
echo "========================================"
echo ""

# ========================================
# 前置准备
# ========================================
echo ">>> 前置准备：创建测试用户和项目..."

TEST_EMAIL="excel-import-test-$(date +%s)@test.com"
TEST_PASSWORD="test123456"

# 注册用户
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "name": "Excel导入测试用户"
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
    "name": "Excel导入测试项目",
    "description": "用于测试Excel/CSV导入功能",
    "template_id": "fmcg"
  }')

TEST_PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.project.id')
echo "✓ 项目创建成功: $TEST_PROJECT_ID"
echo ""

# ========================================
# 测试1: 下载洞察导入模板
# ========================================
echo ">>> 测试1: GET /api/insight/template - 下载洞察导入模板"

INSIGHT_TEMPLATE="/tmp/insight-template-test.xlsx"
HTTP_CODE=$(curl -s -o $INSIGHT_TEMPLATE -w "%{http_code}" ${BASE_URL}/insight/template)

if [ "$HTTP_CODE" == "200" ] && [ -f "$INSIGHT_TEMPLATE" ] && [ -s "$INSIGHT_TEMPLATE" ]; then
  FILE_SIZE=$(stat -f%z "$INSIGHT_TEMPLATE" 2>/dev/null || stat -c%s "$INSIGHT_TEMPLATE" 2>/dev/null)
  if [ "$FILE_SIZE" -gt "1000" ]; then
    print_result 0 "洞察模板下载成功（文件大小：$FILE_SIZE 字节）"
  else
    print_result 1 "洞察模板文件大小异常：$FILE_SIZE 字节"
  fi
else
  print_result 1 "洞察模板下载失败（HTTP $HTTP_CODE）"
fi

echo ""

# ========================================
# 测试2: 下载选题导入模板
# ========================================
echo ">>> 测试2: GET /api/topic/template - 下载选题导入模板"

TOPIC_TEMPLATE="/tmp/topic-template-test.xlsx"
HTTP_CODE=$(curl -s -o $TOPIC_TEMPLATE -w "%{http_code}" ${BASE_URL}/topic/template)

if [ "$HTTP_CODE" == "200" ] && [ -f "$TOPIC_TEMPLATE" ] && [ -s "$TOPIC_TEMPLATE" ]; then
  FILE_SIZE=$(stat -f%z "$TOPIC_TEMPLATE" 2>/dev/null || stat -c%s "$TOPIC_TEMPLATE" 2>/dev/null)
  if [ "$FILE_SIZE" -gt "1000" ]; then
    print_result 0 "选题模板下载成功（文件大小：$FILE_SIZE 字节）"
  else
    print_result 1 "选题模板文件大小异常：$FILE_SIZE 字节"
  fi
else
  print_result 1 "选题模板下载失败（HTTP $HTTP_CODE）"
fi

echo ""

# ========================================
# 测试3: 导入洞察 - 使用模板文件
# ========================================
echo ">>> 测试3: POST /api/insight/import - 导入洞察（使用下载的模板）"

# 使用下载的模板文件直接导入（模板包含示例数据）
IMPORT_RESPONSE=$(curl -s -X POST ${BASE_URL}/insight/import \
  -b $COOKIE_JAR \
  -F "projectId=$TEST_PROJECT_ID" \
  -F "file=@$INSIGHT_TEMPLATE")

SUCCESS=$(echo $IMPORT_RESPONSE | jq -r '.success')
IMPORTED=$(echo $IMPORT_RESPONSE | jq -r '.imported')
FAILED=$(echo $IMPORT_RESPONSE | jq -r '.failed')

if [ "$SUCCESS" == "true" ] && [ "$IMPORTED" -ge "1" ]; then
  print_result 0 "洞察导入成功（导入 $IMPORTED 条，失败 $FAILED 条）"
else
  print_result 1 "洞察导入失败: $IMPORT_RESPONSE"
fi

echo ""

# ========================================
# 测试4: 导入选题 - 使用模板文件
# ========================================
echo ">>> 测试4: POST /api/topic/import - 导入选题（使用下载的模板）"

# 使用下载的模板文件直接导入（模板包含示例数据）
IMPORT_RESPONSE=$(curl -s -X POST ${BASE_URL}/topic/import \
  -b $COOKIE_JAR \
  -F "projectId=$TEST_PROJECT_ID" \
  -F "file=@$TOPIC_TEMPLATE")

SUCCESS=$(echo $IMPORT_RESPONSE | jq -r '.success')
IMPORTED=$(echo $IMPORT_RESPONSE | jq -r '.imported')
FAILED=$(echo $IMPORT_RESPONSE | jq -r '.failed')

if [ "$SUCCESS" == "true" ] && [ "$IMPORTED" -ge "1" ]; then
  print_result 0 "选题导入成功（导入 $IMPORTED 个，失败 $FAILED 条）"
else
  print_result 1 "选题导入失败: $IMPORT_RESPONSE"
fi

echo ""

# ========================================
# 测试5: 验证导入的数据持久化
# ========================================
echo ">>> 测试5: 验证导入的数据持久化"

# 查询洞察
INSIGHTS_RESPONSE=$(curl -s ${BASE_URL}/insight/${TEST_PROJECT_ID} -b $COOKIE_JAR)
INSIGHTS_COUNT=$(echo $INSIGHTS_RESPONSE | jq -r '.insights | length')

# 查询选题
TOPICS_RESPONSE=$(curl -s ${BASE_URL}/topic/${TEST_PROJECT_ID} -b $COOKIE_JAR)
TOPICS_COUNT=$(echo $TOPICS_RESPONSE | jq -r '.topics | length')

if [ "$INSIGHTS_COUNT" -ge "$IMPORTED" ]; then
  print_result 0 "洞察数据持久化成功（共 $INSIGHTS_COUNT 条）"
else
  print_result 1 "洞察数据持久化异常（预期>=$IMPORTED，实际 $INSIGHTS_COUNT）"
fi

if [ "$TOPICS_COUNT" -ge "1" ]; then
  print_result 0 "选题数据持久化成功（共 $TOPICS_COUNT 个）"
else
  print_result 1 "选题数据持久化异常（实际 $TOPICS_COUNT）"
fi

echo ""

# ========================================
# 测试6: 验证时间线记录
# ========================================
echo ">>> 测试6: 验证导入操作记录到时间线"

TIMELINE=$(curl -s ${BASE_URL}/timeline/${TEST_PROJECT_ID} -b $COOKIE_JAR)

# 查找import类型的记录
INSIGHT_IMPORT_COUNT=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "insights_generated" and (.details.source == "import" or .details.method == "excel_import"))] | length')
TOPIC_IMPORT_COUNT=$(echo $TIMELINE | jq -r '[.timeline[] | select(.type == "topics_generated" and (.details.source == "import" or .details.method == "excel_import"))] | length')

if [ "$INSIGHT_IMPORT_COUNT" -ge "1" ]; then
  print_result 0 "洞察导入操作已记录到时间线"
else
  print_result 1 "洞察导入操作未记录到时间线"
fi

if [ "$TOPIC_IMPORT_COUNT" -ge "1" ]; then
  print_result 0 "选题导入操作已记录到时间线"
else
  print_result 1 "选题导入操作未记录到时间线"
fi

echo ""

# ========================================
# 测试7: 导入缺少projectId - 验证错误处理
# ========================================
echo ">>> 测试7: POST /api/insight/import - 缺少projectId"

IMPORT_RESPONSE=$(curl -s -X POST ${BASE_URL}/insight/import \
  -b $COOKIE_JAR \
  -F "file=@$INSIGHT_TEMPLATE")

ERROR=$(echo $IMPORT_RESPONSE | jq -r '.error')

if [[ "$ERROR" == *"projectId"* ]]; then
  print_result 0 "正确返回projectId缺失错误"
else
  print_result 1 "未正确处理projectId缺失: $IMPORT_RESPONSE"
fi

echo ""

# ========================================
# 测试8: 导入缺少文件 - 验证错误处理
# ========================================
echo ">>> 测试8: POST /api/insight/import - 缺少文件"

IMPORT_RESPONSE=$(curl -s -X POST ${BASE_URL}/insight/import \
  -b $COOKIE_JAR \
  -F "projectId=$TEST_PROJECT_ID")

ERROR=$(echo $IMPORT_RESPONSE | jq -r '.error')

if [[ "$ERROR" == *"文件"* ]]; then
  print_result 0 "正确返回缺少文件错误"
else
  print_result 1 "未正确处理文件缺失: $IMPORT_RESPONSE"
fi

echo ""

# ========================================
# 清理
# ========================================
echo ">>> 清理测试文件..."
rm -f $INSIGHT_TEMPLATE $TOPIC_TEMPLATE $COOKIE_JAR
echo "✓ 测试文件已清理"
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
