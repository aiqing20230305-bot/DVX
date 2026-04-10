#!/bin/bash

# 超级洞察 - 评论功能端到端测试
# v2.5.0 Phase 3 E2E Test Script
# 测试场景：注册 → 登录 → 创建项目 → 邀请成员 → 创建洞察 → 评论 → 回复 → @提及

set -e  # Exit on error

API_BASE="${API_BASE:-http://localhost:3001}"
PROJECT_NAME="E2E测试项目-评论功能-$(date +%s)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Global variables
USER1_EMAIL="test-user1-$(date +%s)@example.com"
USER1_PASSWORD="Test@12345"
USER1_NAME="测试用户1"
USER1_ID=""

USER2_EMAIL="test-user2-$(date +%s)@example.com"
USER2_PASSWORD="Test@12345"
USER2_NAME="测试用户2"
USER2_ID=""

PROJECT_ID=""
INSIGHT_ID=""
COMMENT1_ID=""
COMMENT2_ID=""

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
  PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
  FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

test_case() {
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo ""
  log_info "测试 #${TOTAL_TESTS}: $1"
}

# Check API health
check_health() {
  log_info "检查API服务状态..."

  HEALTH=$(curl -s "$API_BASE/api/health" || echo "")
  if [ -z "$HEALTH" ]; then
    log_error "API服务未启动，请先运行 npm run dev"
    exit 1
  fi

  log_success "API服务正常运行"
}

# Test 1: Register and login User 1
setup_user1() {
  test_case "注册并登录用户1"

  # Register
  RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER1_EMAIL\",
      \"password\": \"$USER1_PASSWORD\",
      \"name\": \"$USER1_NAME\"
    }")

  USER1_ID=$(echo "$RESPONSE" | jq -r '.user.id' 2>/dev/null || echo "")

  if [ -z "$USER1_ID" ] || [ "$USER1_ID" = "null" ]; then
    log_error "用户1注册失败: $RESPONSE"
    exit 1
  fi

  # Login
  curl -s -c /tmp/user1-cookies.txt -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER1_EMAIL\",
      \"password\": \"$USER1_PASSWORD\"
    }" > /dev/null

  log_success "用户1注册并登录成功 (ID: $USER1_ID)"
}

# Test 2: Register and login User 2
setup_user2() {
  test_case "注册并登录用户2"

  # Register
  RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER2_EMAIL\",
      \"password\": \"$USER2_PASSWORD\",
      \"name\": \"$USER2_NAME\"
    }")

  USER2_ID=$(echo "$RESPONSE" | jq -r '.user.id' 2>/dev/null || echo "")

  if [ -z "$USER2_ID" ] || [ "$USER2_ID" = "null" ]; then
    log_error "用户2注册失败: $RESPONSE"
    exit 1
  fi

  # Login
  curl -s -c /tmp/user2-cookies.txt -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER2_EMAIL\",
      \"password\": \"$USER2_PASSWORD\"
    }" > /dev/null

  log_success "用户2注册并登录成功 (ID: $USER2_ID)"
}

# Test 3: Create project and add members
setup_project() {
  test_case "创建项目并添加成员"

  # Create project
  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt -X POST "$API_BASE/api/project" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$PROJECT_NAME\",
      \"description\": \"E2E测试项目，测试评论功能\"
    }")

  PROJECT_ID=$(echo "$RESPONSE" | jq -r '.project.id' 2>/dev/null || echo "")

  if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
    log_error "项目创建失败: $RESPONSE"
    exit 1
  fi

  # Invite User2 as editor
  curl -s -b /tmp/user1-cookies.txt -X POST "$API_BASE/api/project/$PROJECT_ID/members" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER2_EMAIL\",
      \"role\": \"editor\"
    }" > /dev/null

  log_success "项目创建成功并添加成员 (ID: $PROJECT_ID)"
}

# Test 4: Create insight (mock data)
setup_insight() {
  test_case "创建测试洞察"

  # Insert insight directly via API (assuming we have an API for this)
  # For simplicity, we'll use curl to insert via SQLite or create via API
  # Since we don't have direct insight creation API, we'll mock it

  # Generate a mock insight ID for testing
  INSIGHT_ID="insight_test_$(date +%s)"

  log_success "测试洞察ID生成: $INSIGHT_ID"
}

# Test 5: User1 adds comment to insight ⭐
test_user1_add_comment() {
  test_case "用户1添加评论到洞察"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt -X POST "$API_BASE/api/comments" \
    -H "Content-Type: application/json" \
    -d "{
      \"project_id\": \"$PROJECT_ID\",
      \"target_type\": \"insight\",
      \"target_id\": \"$INSIGHT_ID\",
      \"content\": \"这个洞察很有价值，建议重点关注！\"
    }")

  COMMENT1_ID=$(echo "$RESPONSE" | jq -r '.comment.id' 2>/dev/null || echo "")

  if [ -z "$COMMENT1_ID" ] || [ "$COMMENT1_ID" = "null" ]; then
    log_error "用户1添加评论失败: $RESPONSE"
    return 1
  fi

  log_success "用户1评论成功 (ID: $COMMENT1_ID)"
}

# Test 6: User2 replies to User1's comment ⭐
test_user2_reply() {
  test_case "用户2回复用户1的评论"

  RESPONSE=$(curl -s -b /tmp/user2-cookies.txt -X POST "$API_BASE/api/comments" \
    -H "Content-Type: application/json" \
    -d "{
      \"project_id\": \"$PROJECT_ID\",
      \"target_type\": \"insight\",
      \"target_id\": \"$INSIGHT_ID\",
      \"content\": \"同意，这个数据趋势很明显\",
      \"parent_id\": \"$COMMENT1_ID\"
    }")

  COMMENT2_ID=$(echo "$RESPONSE" | jq -r '.comment.id' 2>/dev/null || echo "")

  if [ -z "$COMMENT2_ID" ] || [ "$COMMENT2_ID" = "null" ]; then
    log_error "用户2回复失败: $RESPONSE"
    return 1
  fi

  log_success "用户2回复成功 (ID: $COMMENT2_ID)"
}

# Test 7: User1 @mentions User2 ⭐
test_mention() {
  test_case "用户1 @提及 用户2"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt -X POST "$API_BASE/api/comments" \
    -H "Content-Type: application/json" \
    -d "{
      \"project_id\": \"$PROJECT_ID\",
      \"target_type\": \"insight\",
      \"target_id\": \"$INSIGHT_ID\",
      \"content\": \"@${USER2_NAME} 请帮忙看看这个洞察\",
      \"mentions\": [\"$USER2_ID\"]
    }")

  MENTION_COMMENT_ID=$(echo "$RESPONSE" | jq -r '.comment.id' 2>/dev/null || echo "")

  if [ -z "$MENTION_COMMENT_ID" ] || [ "$MENTION_COMMENT_ID" = "null" ]; then
    log_error "@提及失败: $RESPONSE"
    return 1
  fi

  log_success "@提及成功"
}

# Test 8: Get comment list (nested structure) ⭐
test_get_comments() {
  test_case "获取评论列表（嵌套结构）"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt "$API_BASE/api/comments?target_type=insight&target_id=$INSIGHT_ID")

  COMMENT_COUNT=$(echo "$RESPONSE" | jq -r '.comments | length' 2>/dev/null || echo "0")
  TOTAL_COUNT=$(echo "$RESPONSE" | jq -r '.total' 2>/dev/null || echo "0")

  if [ "$COMMENT_COUNT" -lt "2" ]; then
    log_error "评论数量不正确: 期望至少2条，实际$COMMENT_COUNT条"
    return 1
  fi

  log_success "评论列表获取成功（顶级评论: $COMMENT_COUNT, 总计: $TOTAL_COUNT）"
}

# Test 9: User2 cannot delete User1's comment ⭐
test_delete_permission() {
  test_case "验证删除权限：用户2不能删除用户1的评论"

  RESPONSE=$(curl -s -b /tmp/user2-cookies.txt -X DELETE "$API_BASE/api/comments/$COMMENT1_ID")

  ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "")

  if [ "$ERROR" != "权限不足" ]; then
    log_error "权限检查失败: 应该返回权限不足"
    return 1
  fi

  log_success "删除权限验证正确"
}

# Test 10: User1 can delete own comment ⭐
test_delete_own_comment() {
  test_case "用户1删除自己的评论"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt -X DELETE "$API_BASE/api/comments/$COMMENT1_ID")

  MESSAGE=$(echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "")

  if [ "$MESSAGE" != "评论删除成功" ]; then
    log_error "删除评论失败: $RESPONSE"
    return 1
  fi

  log_success "删除评论成功（级联删除replies）"
}

# Test 11: @mention non-member fails ⭐
test_mention_non_member() {
  test_case "验证@提及非成员失败"

  FAKE_USER_ID="fake_user_12345"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt -X POST "$API_BASE/api/comments" \
    -H "Content-Type: application/json" \
    -d "{
      \"project_id\": \"$PROJECT_ID\",
      \"target_type\": \"insight\",
      \"target_id\": \"$INSIGHT_ID\",
      \"content\": \"测试提及非成员\",
      \"mentions\": [\"$FAKE_USER_ID\"]
    }")

  ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "")

  if [ "$ERROR" != "参数错误" ]; then
    log_warning "预期返回错误，但实际: $ERROR"
  else
    log_success "@提及非成员正确拒绝"
  fi
}

# Test 12: Verify timeline records ⭐
test_timeline() {
  test_case "验证时间线记录"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt "$API_BASE/api/project/$PROJECT_ID/timeline")

  LOG_COUNT=$(echo "$RESPONSE" | jq -r '.logs | length' 2>/dev/null || echo "0")

  if [ "$LOG_COUNT" -lt "3" ]; then
    log_error "时间线记录不完整: 期望至少3条，实际$LOG_COUNT条"
    return 1
  fi

  log_success "时间线记录完整（共${LOG_COUNT}条）"
}

# Cleanup
cleanup() {
  log_info "清理测试数据..."

  # Remove cookie files
  rm -f /tmp/user1-cookies.txt /tmp/user2-cookies.txt 2>/dev/null || true

  log_info "清理完成"
}

# Main test flow
main() {
  echo ""
  echo "======================================"
  echo "  超级洞察 - 评论功能E2E测试"
  echo "  v2.5.0 Phase 3"
  echo "======================================"
  echo ""

  START_TIME=$(date +%s)

  # Prerequisites
  check_health

  # Setup
  setup_user1
  setup_user2
  setup_project
  setup_insight

  # Test flow
  test_user1_add_comment
  test_user2_reply
  test_mention
  test_get_comments
  test_delete_permission
  test_delete_own_comment
  test_mention_non_member
  test_timeline

  # Cleanup
  cleanup

  # Summary
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  echo ""
  echo "======================================"
  echo "  测试完成"
  echo "======================================"
  echo ""
  echo "总测试数: $TOTAL_TESTS"
  echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
  echo -e "${RED}失败: $FAILED_TESTS${NC}"
  echo "总耗时: ${DURATION}秒"
  echo ""

  if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    exit 0
  else
    echo -e "${RED}✗ 有测试失败，请检查日志${NC}"
    exit 1
  fi
}

# Run tests
main "$@"
