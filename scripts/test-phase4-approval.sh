#!/bin/bash

# Phase 4: 审批流程功能 E2E测试
# 测试审批流程的完整工作流程

set -e

BASE_URL="http://localhost:3001"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试结果函数
pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED_TESTS++))
  ((TOTAL_TESTS++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED_TESTS++))
  ((TOTAL_TESTS++))
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 清理函数
cleanup() {
  if [ -n "$USER1_ID" ]; then
    echo "清理测试数据..."
    # 删除测试用户和项目会通过CASCADE自动清理相关数据
  fi
}

trap cleanup EXIT

echo "========================================="
echo "Phase 4: 审批流程功能 E2E测试"
echo "========================================="
echo ""

# ==================== 1. 准备测试环境 ====================
echo "1. 准备测试环境..."

# 注册用户1（项目owner）
USER1_EMAIL="approval_test_owner_$(date +%s)@test.com"
USER1_PASS="Test123456"
REGISTER1_RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER1_EMAIL\",\"password\":\"$USER1_PASS\",\"name\":\"测试Owner\"}")

USER1_TOKEN=$(echo "$REGISTER1_RESP" | jq -r '.token // empty')
USER1_ID=$(echo "$REGISTER1_RESP" | jq -r '.user.id // empty')

if [ -n "$USER1_TOKEN" ] && [ "$USER1_TOKEN" != "null" ]; then
  pass "用户1注册成功 (Owner)"
else
  fail "用户1注册失败"
  exit 1
fi

# 注册用户2（reviewer）
USER2_EMAIL="approval_test_reviewer_$(date +%s)@test.com"
USER2_PASS="Test123456"
REGISTER2_RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER2_EMAIL\",\"password\":\"$USER2_PASS\",\"name\":\"测试Reviewer\"}")

USER2_TOKEN=$(echo "$REGISTER2_RESP" | jq -r '.token // empty')
USER2_ID=$(echo "$REGISTER2_RESP" | jq -r '.user.id // empty')

if [ -n "$USER2_TOKEN" ] && [ "$USER2_TOKEN" != "null" ]; then
  pass "用户2注册成功 (Reviewer)"
else
  fail "用户2注册失败"
  exit 1
fi

# 创建项目
PROJECT_NAME="审批测试项目-$(date +%s)"
CREATE_PROJECT_RESP=$(curl -s -X POST "$BASE_URL/api/project" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -d "{\"name\":\"$PROJECT_NAME\",\"description\":\"审批流程测试\",\"templateId\":\"fmcg\"}")

PROJECT_ID=$(echo "$CREATE_PROJECT_RESP" | jq -r '.project.id // empty')

if [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
  pass "项目创建成功: $PROJECT_ID"
else
  fail "项目创建失败"
  exit 1
fi

# 添加用户2为项目成员（editor角色）
INVITE_RESP=$(curl -s -X POST "$BASE_URL/api/project/$PROJECT_ID/member" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -d "{\"email\":\"$USER2_EMAIL\",\"role\":\"editor\"}")

if echo "$INVITE_RESP" | jq -e '.member' > /dev/null; then
  pass "用户2添加为项目成员"
else
  fail "添加项目成员失败"
fi

echo ""

# ==================== 2. 创建审批流程 ====================
echo "2. 创建审批流程..."

WORKFLOW_RESP=$(curl -s -X POST "$BASE_URL/api/approval/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -d "{
    \"project_id\": \"$PROJECT_ID\",
    \"name\": \"脚本审批流程\",
    \"description\": \"单步审批\",
    \"target_type\": \"script\",
    \"steps\": [
      {
        \"step\": 1,
        \"reviewers\": [\"$USER2_ID\"],
        \"rule\": \"any\"
      }
    ]
  }")

WORKFLOW_ID=$(echo "$WORKFLOW_RESP" | jq -r '.workflow.id // empty')

if [ -n "$WORKFLOW_ID" ] && [ "$WORKFLOW_ID" != "null" ]; then
  pass "审批流程创建成功: $WORKFLOW_ID"
else
  fail "审批流程创建失败"
  echo "$WORKFLOW_RESP" | jq .
fi

# 获取审批流程列表
WORKFLOWS_RESP=$(curl -s -X GET "$BASE_URL/api/approval/workflows?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $USER1_TOKEN")

WORKFLOW_COUNT=$(echo "$WORKFLOWS_RESP" | jq -r '.total // 0')

if [ "$WORKFLOW_COUNT" -ge 1 ]; then
  pass "获取审批流程列表成功 (共$WORKFLOW_COUNT个)"
else
  fail "获取审批流程列表失败"
fi

echo ""

# ==================== 3. 提交审批请求 ====================
echo "3. 提交审批请求..."

# 创建mock脚本ID（实际应该先创建脚本，这里简化测试）
MOCK_SCRIPT_ID="script_test_$(date +%s)"

REQUEST_RESP=$(curl -s -X POST "$BASE_URL/api/approval/requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -d "{
    \"workflow_id\": \"$WORKFLOW_ID\",
    \"target_type\": \"script\",
    \"target_id\": \"$MOCK_SCRIPT_ID\"
  }")

REQUEST_ID=$(echo "$REQUEST_RESP" | jq -r '.request.id // empty')

if [ -n "$REQUEST_ID" ] && [ "$REQUEST_ID" != "null" ]; then
  pass "审批请求提交成功: $REQUEST_ID"
else
  fail "审批请求提交失败"
  echo "$REQUEST_RESP" | jq .
fi

# 获取项目的审批请求列表
REQUESTS_RESP=$(curl -s -X GET "$BASE_URL/api/approval/requests?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $USER1_TOKEN")

REQUEST_COUNT=$(echo "$REQUESTS_RESP" | jq -r '.total // 0')

if [ "$REQUEST_COUNT" -ge 1 ]; then
  pass "获取审批请求列表成功 (共$REQUEST_COUNT个)"
else
  fail "获取审批请求列表失败"
fi

echo ""

# ==================== 4. 获取待审批列表 ====================
echo "4. 获取待审批列表..."

PENDING_RESP=$(curl -s -X GET "$BASE_URL/api/approval/requests/pending" \
  -H "Authorization: Bearer $USER2_TOKEN")

PENDING_COUNT=$(echo "$PENDING_RESP" | jq -r '.total // 0')

if [ "$PENDING_COUNT" -ge 1 ]; then
  pass "用户2获取待审批列表成功 (共$PENDING_COUNT个)"
else
  fail "用户2获取待审批列表失败"
  echo "$PENDING_RESP" | jq .
fi

echo ""

# ==================== 5. 提交审批意见（通过） ====================
echo "5. 提交审批意见（通过）..."

REVIEW_RESP=$(curl -s -X POST "$BASE_URL/api/approval/requests/$REQUEST_ID/review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -d "{
    \"status\": \"approved\",
    \"comment\": \"脚本内容符合要求，通过审批\"
  }")

REVIEW_STATUS=$(echo "$REVIEW_RESP" | jq -r '.request_status // empty')

if [ "$REVIEW_STATUS" = "approved" ]; then
  pass "审批通过成功，请求状态: $REVIEW_STATUS"
else
  fail "审批通过失败，当前状态: $REVIEW_STATUS"
  echo "$REVIEW_RESP" | jq .
fi

echo ""

# ==================== 6. 获取审批历史 ====================
echo "6. 获取审批历史..."

REVIEWS_RESP=$(curl -s -X GET "$BASE_URL/api/approval/requests/$REQUEST_ID/reviews" \
  -H "Authorization: Bearer $USER1_TOKEN")

REVIEW_COUNT=$(echo "$REVIEWS_RESP" | jq -r '.total // 0')

if [ "$REVIEW_COUNT" -ge 1 ]; then
  pass "获取审批历史成功 (共$REVIEW_COUNT条)"
else
  fail "获取审批历史失败"
fi

echo ""

# ==================== 7. 测试拒绝流程 ====================
echo "7. 测试拒绝流程..."

# 提交第二个审批请求
MOCK_SCRIPT_ID_2="script_test_2_$(date +%s)"

REQUEST2_RESP=$(curl -s -X POST "$BASE_URL/api/approval/requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -d "{
    \"workflow_id\": \"$WORKFLOW_ID\",
    \"target_type\": \"script\",
    \"target_id\": \"$MOCK_SCRIPT_ID_2\"
  }")

REQUEST2_ID=$(echo "$REQUEST2_RESP" | jq -r '.request.id // empty')

if [ -n "$REQUEST2_ID" ] && [ "$REQUEST2_ID" != "null" ]; then
  pass "第二个审批请求提交成功"
else
  fail "第二个审批请求提交失败"
fi

# 拒绝审批
REJECT_RESP=$(curl -s -X POST "$BASE_URL/api/approval/requests/$REQUEST2_ID/review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -d "{
    \"status\": \"rejected\",
    \"comment\": \"脚本内容需要修改\"
  }")

REJECT_STATUS=$(echo "$REJECT_RESP" | jq -r '.request_status // empty')

if [ "$REJECT_STATUS" = "rejected" ]; then
  pass "审批拒绝成功，请求状态: $REJECT_STATUS"
else
  fail "审批拒绝失败，当前状态: $REJECT_STATUS"
fi

echo ""

# ==================== 8. 测试撤销请求 ====================
echo "8. 测试撤销请求..."

# 提交第三个请求用于测试撤销
MOCK_SCRIPT_ID_3="script_test_3_$(date +%s)"

REQUEST3_RESP=$(curl -s -X POST "$BASE_URL/api/approval/requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -d "{
    \"workflow_id\": \"$WORKFLOW_ID\",
    \"target_type\": \"script\",
    \"target_id\": \"$MOCK_SCRIPT_ID_3\"
  }")

REQUEST3_ID=$(echo "$REQUEST3_RESP" | jq -r '.request.id // empty')

if [ -n "$REQUEST3_ID" ] && [ "$REQUEST3_ID" != "null" ]; then
  pass "第三个审批请求提交成功"
else
  fail "第三个审批请求提交失败"
fi

# 撤销请求
CANCEL_RESP=$(curl -s -X PUT "$BASE_URL/api/approval/requests/$REQUEST3_ID/cancel" \
  -H "Authorization: Bearer $USER1_TOKEN")

if echo "$CANCEL_RESP" | jq -e '.message' > /dev/null; then
  pass "审批请求撤销成功"
else
  fail "审批请求撤销失败"
  echo "$CANCEL_RESP" | jq .
fi

echo ""

# ==================== 9. 验证时间线记录 ====================
echo "9. 验证时间线记录..."

TIMELINE_RESP=$(curl -s -X GET "$BASE_URL/api/project/$PROJECT_ID/timeline" \
  -H "Authorization: Bearer $USER1_TOKEN")

TIMELINE_COUNT=$(echo "$TIMELINE_RESP" | jq -r '.logs | length')

if [ "$TIMELINE_COUNT" -ge 5 ]; then
  pass "时间线记录完整 (共$TIMELINE_COUNT条)"
else
  warn "时间线记录较少 (共$TIMELINE_COUNT条)，可能有记录缺失"
fi

echo ""

# ==================== 10. 测试权限控制 ====================
echo "10. 测试权限控制..."

# 用户2（editor）尝试创建审批流程（应该失败）
FORBIDDEN_RESP=$(curl -s -X POST "$BASE_URL/api/approval/workflows" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER2_TOKEN" \
  -d "{
    \"project_id\": \"$PROJECT_ID\",
    \"name\": \"非法流程\",
    \"target_type\": \"script\",
    \"steps\": []
  }")

if echo "$FORBIDDEN_RESP" | jq -e '.error' > /dev/null; then
  pass "权限控制正常：非owner用户无法创建审批流程"
else
  fail "权限控制异常：非owner用户可以创建审批流程"
fi

echo ""

# ==================== 测试结果汇总 ====================
echo "========================================="
echo "测试结果汇总"
echo "========================================="
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}🎉 所有测试通过！Phase 4审批流程功能正常！${NC}"
  exit 0
else
  echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败${NC}"
  exit 1
fi
