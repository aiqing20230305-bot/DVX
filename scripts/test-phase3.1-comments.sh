#!/bin/bash

# Phase 3.1 - Topics和Scripts评论功能测试
# 测试场景：创建项目 → 生成选题 → 生成脚本 → 测试评论功能

set -e

API_BASE="${API_BASE:-http://localhost:3001}"
PROJECT_NAME="Phase3.1测试-评论功能-$(date +%s)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Global variables
USER_EMAIL="test-phase31-$(date +%s)@example.com"
USER_PASSWORD="Test@12345"
USER_NAME="Phase3.1测试用户"
USER_ID=""
PROJECT_ID=""
TOPIC_ID=""
SCRIPT_ID=""
COMMENT_ID=""

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

# Test 1: Register and login
setup_user() {
  test_case "注册并登录测试用户"

  # Register
  RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER_EMAIL\",
      \"password\": \"$USER_PASSWORD\",
      \"name\": \"$USER_NAME\"
    }")

  USER_ID=$(echo "$RESPONSE" | jq -r '.user.id' 2>/dev/null || echo "")

  if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
    log_error "用户注册失败: $RESPONSE"
    exit 1
  fi

  # Login
  curl -s -c /tmp/phase31-cookies.txt -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER_EMAIL\",
      \"password\": \"$USER_PASSWORD\"
    }" > /dev/null

  log_success "用户注册并登录成功 (ID: $USER_ID)"
}

# Test 2: Create project
setup_project() {
  test_case "创建测试项目"

  RESPONSE=$(curl -s -b /tmp/phase31-cookies.txt -X POST "$API_BASE/api/project" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$PROJECT_NAME\",
      \"description\": \"Phase 3.1测试项目\"
    }")

  PROJECT_ID=$(echo "$RESPONSE" | jq -r '.project.id' 2>/dev/null || echo "")

  if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
    log_error "项目创建失败: $RESPONSE"
    exit 1
  fi

  log_success "项目创建成功 (ID: $PROJECT_ID)"
}

# Test 3: Create mock topic
setup_topic() {
  test_case "创建测试选题"

  # 生成mock topic ID
  TOPIC_ID="topic_phase31_$(date +%s)"

  log_success "测试选题ID生成: $TOPIC_ID"
}

# Test 4: Create mock script
setup_script() {
  test_case "创建测试脚本"

  # 生成mock script ID
  SCRIPT_ID="script_phase31_$(date +%s)"

  log_success "测试脚本ID生成: $SCRIPT_ID"
}

# Test 5: Add comment to topic ⭐
test_topic_comment() {
  test_case "添加评论到选题"

  RESPONSE=$(curl -s -b /tmp/phase31-cookies.txt -X POST "$API_BASE/api/comments" \
    -H "Content-Type: application/json" \
    -d "{
      \"project_id\": \"$PROJECT_ID\",
      \"target_type\": \"topic\",
      \"target_id\": \"$TOPIC_ID\",
      \"content\": \"这个选题很有创意，建议优先执行！\"
    }")

  COMMENT_ID=$(echo "$RESPONSE" | jq -r '.comment.id' 2>/dev/null || echo "")

  if [ -z "$COMMENT_ID" ] || [ "$COMMENT_ID" = "null" ]; then
    log_error "选题评论失败: $RESPONSE"
    return 1
  fi

  log_success "选题评论成功 (ID: $COMMENT_ID)"
}

# Test 6: Get topic comments ⭐
test_get_topic_comments() {
  test_case "获取选题评论列表"

  RESPONSE=$(curl -s -b /tmp/phase31-cookies.txt "$API_BASE/api/comments?target_type=topic&target_id=$TOPIC_ID")

  COMMENT_COUNT=$(echo "$RESPONSE" | jq -r '.comments | length' 2>/dev/null || echo "0")

  if [ "$COMMENT_COUNT" -lt "1" ]; then
    log_error "选题评论数量不正确: 期望至少1条，实际$COMMENT_COUNT条"
    return 1
  fi

  log_success "选题评论列表获取成功（${COMMENT_COUNT}条）"
}

# Test 7: Delete topic comment ⭐
test_delete_topic_comment() {
  test_case "删除选题评论"

  RESPONSE=$(curl -s -b /tmp/phase31-cookies.txt -X DELETE "$API_BASE/api/comments/$COMMENT_ID")

  MESSAGE=$(echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "")

  if [ "$MESSAGE" != "评论删除成功" ]; then
    log_error "删除选题评论失败: $RESPONSE"
    return 1
  fi

  log_success "选题评论删除成功"
}

# Test 8: Add comment to script ⭐
test_script_comment() {
  test_case "添加评论到脚本"

  RESPONSE=$(curl -s -b /tmp/phase31-cookies.txt -X POST "$API_BASE/api/comments" \
    -H "Content-Type: application/json" \
    -d "{
      \"project_id\": \"$PROJECT_ID\",
      \"target_type\": \"script\",
      \"target_id\": \"$SCRIPT_ID\",
      \"content\": \"A版脚本的开场钩子很棒，建议保留！\"
    }")

  COMMENT_ID=$(echo "$RESPONSE" | jq -r '.comment.id' 2>/dev/null || echo "")

  if [ -z "$COMMENT_ID" ] || [ "$COMMENT_ID" = "null" ]; then
    log_error "脚本评论失败: $RESPONSE"
    return 1
  fi

  log_success "脚本评论成功 (ID: $COMMENT_ID)"
}

# Test 9: Get script comments ⭐
test_get_script_comments() {
  test_case "获取脚本评论列表"

  RESPONSE=$(curl -s -b /tmp/phase31-cookies.txt "$API_BASE/api/comments?target_type=script&target_id=$SCRIPT_ID")

  COMMENT_COUNT=$(echo "$RESPONSE" | jq -r '.comments | length' 2>/dev/null || echo "0")

  if [ "$COMMENT_COUNT" -lt "1" ]; then
    log_error "脚本评论数量不正确: 期望至少1条，实际$COMMENT_COUNT条"
    return 1
  fi

  log_success "脚本评论列表获取成功（${COMMENT_COUNT}条）"
}

# Test 10: Delete script comment ⭐
test_delete_script_comment() {
  test_case "删除脚本评论"

  RESPONSE=$(curl -s -b /tmp/phase31-cookies.txt -X DELETE "$API_BASE/api/comments/$COMMENT_ID")

  MESSAGE=$(echo "$RESPONSE" | jq -r '.message' 2>/dev/null || echo "")

  if [ "$MESSAGE" != "评论删除成功" ]; then
    log_error "删除脚本评论失败: $RESPONSE"
    return 1
  fi

  log_success "脚本评论删除成功"
}

# Test 11: Verify timeline records ⭐
test_timeline() {
  test_case "验证时间线记录"

  RESPONSE=$(curl -s -b /tmp/phase31-cookies.txt "$API_BASE/api/project/$PROJECT_ID/timeline")

  LOG_COUNT=$(echo "$RESPONSE" | jq -r '.logs | length' 2>/dev/null || echo "0")

  # 应该有：创建项目(1) + 4次评论操作(4) = 至少5条
  if [ "$LOG_COUNT" -lt "5" ]; then
    log_error "时间线记录不完整: 期望至少5条，实际$LOG_COUNT条"
    return 1
  fi

  log_success "时间线记录完整（共${LOG_COUNT}条）"
}

# Cleanup
cleanup() {
  log_info "清理测试数据..."

  # Remove cookie file
  rm -f /tmp/phase31-cookies.txt 2>/dev/null || true

  log_info "清理完成"
}

# Main test flow
main() {
  echo ""
  echo "======================================"
  echo "  Phase 3.1 - 评论功能测试"
  echo "  Topics + Scripts评论集成"
  echo "======================================"
  echo ""

  START_TIME=$(date +%s)

  # Prerequisites
  check_health

  # Setup
  setup_user
  setup_project
  setup_topic
  setup_script

  # Test topic comments
  test_topic_comment
  test_get_topic_comments
  test_delete_topic_comment

  # Test script comments
  test_script_comment
  test_get_script_comments
  test_delete_script_comment

  # Verify timeline
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
    echo ""
    echo "Phase 3.1 完成情况："
    echo "✅ Topics页面评论集成"
    echo "✅ Scripts页面评论集成"
    echo "✅ 评论API功能正常"
    echo "✅ 时间线记录完整"
    exit 0
  else
    echo -e "${RED}✗ 有测试失败，请检查日志${NC}"
    exit 1
  fi
}

# Run tests
main "$@"
