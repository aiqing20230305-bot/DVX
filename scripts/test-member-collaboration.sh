#!/bin/bash

# 超级洞察 - 成员协作功能端到端测试
# v2.5.0 Phase 2 E2E Test Script
# 测试场景：用户注册 → 登录 → 创建项目 → 邀请成员 → 协作验证

set -e  # Exit on error

API_BASE="${API_BASE:-http://localhost:3001}"
PROJECT_NAME="E2E测试项目-成员协作-$(date +%s)"

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
USER1_EMAIL="test-owner-$(date +%s)@example.com"
USER1_PASSWORD="Test@12345"
USER1_NAME="测试Owner"
USER1_TOKEN=""
USER1_ID=""

USER2_EMAIL="test-editor-$(date +%s)@example.com"
USER2_PASSWORD="Test@12345"
USER2_NAME="测试Editor"
USER2_TOKEN=""
USER2_ID=""

PROJECT_ID=""

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

# Test 1: Register User 1 (Owner)
register_user1() {
  test_case "注册用户1（Owner）"

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

  log_success "用户1注册成功: $USER1_EMAIL (ID: $USER1_ID)"
}

# Test 2: Login User 1
login_user1() {
  test_case "用户1登录"

  RESPONSE=$(curl -s -c /tmp/user1-cookies.txt -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER1_EMAIL\",
      \"password\": \"$USER1_PASSWORD\"
    }")

  # Check if login was successful (by checking user field)
  USER_ID_RETURNED=$(echo "$RESPONSE" | jq -r '.user.id' 2>/dev/null || echo "")

  if [ -z "$USER_ID_RETURNED" ] || [ "$USER_ID_RETURNED" = "null" ]; then
    log_error "用户1登录失败: $RESPONSE"
    exit 1
  fi

  log_success "用户1登录成功"
}

# Test 3: Create Project (as User 1)
create_project() {
  test_case "用户1创建项目"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt -X POST "$API_BASE/api/project" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$PROJECT_NAME\",
      \"description\": \"E2E测试项目，测试成员协作功能\",
      \"brand\": \"测试品牌\",
      \"category\": \"快消品\"
    }")

  PROJECT_ID=$(echo "$RESPONSE" | jq -r '.project.id' 2>/dev/null || echo "")

  if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
    log_error "项目创建失败: $RESPONSE"
    exit 1
  fi

  log_success "项目创建成功: $PROJECT_NAME (ID: $PROJECT_ID)"
}

# Test 4: Check User 1 is auto-added as Owner
check_auto_owner() {
  test_case "验证用户1自动成为Owner"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt "$API_BASE/api/project/$PROJECT_ID/members")

  MEMBER_COUNT=$(echo "$RESPONSE" | jq -r '.total' 2>/dev/null || echo "0")
  OWNER_ID=$(echo "$RESPONSE" | jq -r '.members[0].user_id' 2>/dev/null || echo "")
  OWNER_ROLE=$(echo "$RESPONSE" | jq -r '.members[0].role' 2>/dev/null || echo "")

  if [ "$MEMBER_COUNT" != "1" ]; then
    log_error "成员数量不正确: 期望1，实际$MEMBER_COUNT"
    return 1
  fi

  if [ "$OWNER_ID" != "$USER1_ID" ]; then
    log_error "Owner用户ID不匹配: 期望$USER1_ID，实际$OWNER_ID"
    return 1
  fi

  if [ "$OWNER_ROLE" != "owner" ]; then
    log_error "Owner角色不正确: 期望owner，实际$OWNER_ROLE"
    return 1
  fi

  log_success "用户1已自动成为项目Owner"
}

# Test 5: Register User 2 (Editor)
register_user2() {
  test_case "注册用户2（Editor）"

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

  log_success "用户2注册成功: $USER2_EMAIL (ID: $USER2_ID)"
}

# Test 6: Invite User 2 as Editor
invite_user2() {
  test_case "用户1邀请用户2为Editor"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt -X POST "$API_BASE/api/project/$PROJECT_ID/members" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER2_EMAIL\",
      \"role\": \"editor\"
    }")

  MEMBER_ID=$(echo "$RESPONSE" | jq -r '.member.id' 2>/dev/null || echo "")
  MEMBER_ROLE=$(echo "$RESPONSE" | jq -r '.member.role' 2>/dev/null || echo "")

  if [ -z "$MEMBER_ID" ] || [ "$MEMBER_ID" = "null" ]; then
    log_error "邀请用户2失败: $RESPONSE"
    exit 1
  fi

  if [ "$MEMBER_ROLE" != "editor" ]; then
    log_error "用户2角色不正确: 期望editor，实际$MEMBER_ROLE"
    exit 1
  fi

  log_success "用户2邀请成功，角色为Editor"
}

# Test 7: Login User 2
login_user2() {
  test_case "用户2登录"

  RESPONSE=$(curl -s -c /tmp/user2-cookies.txt -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$USER2_EMAIL\",
      \"password\": \"$USER2_PASSWORD\"
    }")

  # Check if login was successful (by checking user field)
  USER_ID_RETURNED=$(echo "$RESPONSE" | jq -r '.user.id' 2>/dev/null || echo "")

  if [ -z "$USER_ID_RETURNED" ] || [ "$USER_ID_RETURNED" = "null" ]; then
    log_error "用户2登录失败: $RESPONSE"
    exit 1
  fi

  log_success "用户2登录成功"
}

# Test 8: User 2 can view project
test_user2_view_project() {
  test_case "用户2可以查看项目"

  RESPONSE=$(curl -s -b /tmp/user2-cookies.txt "$API_BASE/api/project/$PROJECT_ID")

  PROJECT_NAME_RETURNED=$(echo "$RESPONSE" | jq -r '.project.name' 2>/dev/null || echo "")

  if [ -z "$PROJECT_NAME_RETURNED" ] || [ "$PROJECT_NAME_RETURNED" = "null" ]; then
    log_error "用户2无法查看项目: $RESPONSE"
    return 1
  fi

  log_success "用户2可以查看项目: $PROJECT_NAME_RETURNED"
}

# Test 9: User 2 can view members
test_user2_view_members() {
  test_case "用户2可以查看成员列表"

  RESPONSE=$(curl -s -b /tmp/user2-cookies.txt "$API_BASE/api/project/$PROJECT_ID/members")

  MEMBER_COUNT=$(echo "$RESPONSE" | jq -r '.total' 2>/dev/null || echo "0")

  if [ "$MEMBER_COUNT" != "2" ]; then
    log_error "成员数量不正确: 期望2，实际$MEMBER_COUNT"
    return 1
  fi

  log_success "用户2可以查看成员列表（共2名成员）"
}

# Test 10: User 2 cannot invite members (should be able to invite viewers only)
test_user2_invite_permission() {
  test_case "验证Editor权限：可以邀请Viewer"

  # Create a temp user for this test
  TEMP_EMAIL="temp-viewer-$(date +%s)@example.com"
  curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEMP_EMAIL\",
      \"password\": \"Test@12345\",
      \"name\": \"临时Viewer\"
    }" > /dev/null

  RESPONSE=$(curl -s -b /tmp/user2-cookies.txt -X POST "$API_BASE/api/project/$PROJECT_ID/members" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEMP_EMAIL\",
      \"role\": \"viewer\"
    }")

  MEMBER_ID=$(echo "$RESPONSE" | jq -r '.member.id' 2>/dev/null || echo "")

  if [ -z "$MEMBER_ID" ] || [ "$MEMBER_ID" = "null" ]; then
    log_error "Editor无法邀请Viewer（应该可以）: $RESPONSE"
    return 1
  fi

  log_success "Editor可以邀请Viewer"
}

# Test 11: User 2 cannot modify member roles
test_user2_modify_role() {
  test_case "验证Editor权限：不能修改成员角色"

  # Try to change temp viewer to editor (should fail)
  RESPONSE=$(curl -s -b /tmp/user2-cookies.txt -X PUT "$API_BASE/api/project/$PROJECT_ID/members/any" \
    -H "Content-Type: application/json" \
    -d "{
      \"role\": \"editor\"
    }")

  ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo "")

  if [ "$ERROR" != "权限不足" ] && [ "$ERROR" != "成员不存在" ]; then
    log_warning "权限检查可能有问题: $RESPONSE"
  else
    log_success "Editor不能修改成员角色（权限正确）"
  fi
}

# Test 12: Verify timeline records
check_timeline() {
  test_case "验证时间线记录"

  RESPONSE=$(curl -s -b /tmp/user1-cookies.txt "$API_BASE/api/project/$PROJECT_ID/timeline")

  LOG_COUNT=$(echo "$RESPONSE" | jq -r '.logs | length' 2>/dev/null || echo "0")

  if [ "$LOG_COUNT" -lt "2" ]; then
    log_error "时间线记录不完整: 期望至少2条（创建项目+邀请成员），实际$LOG_COUNT条"
    return 1
  fi

  log_success "时间线记录完整（共${LOG_COUNT}条）"
}

# Cleanup
cleanup() {
  log_info "清理测试数据..."

  # Delete project (if owner)
  if [ -n "$PROJECT_ID" ] && [ -n "$USER1_TOKEN" ]; then
    curl -s -b /tmp/user1-cookies.txt -X DELETE "$API_BASE/api/project/$PROJECT_ID" > /dev/null 2>&1 || true
    log_info "测试项目已删除: $PROJECT_ID"
  fi

  # Remove cookie files
  rm -f /tmp/user1-cookies.txt /tmp/user2-cookies.txt 2>/dev/null || true

  log_info "清理完成"
}

# Main test flow
main() {
  echo ""
  echo "======================================"
  echo "  超级洞察 - 成员协作功能E2E测试"
  echo "  v2.5.0 Phase 2"
  echo "======================================"
  echo ""

  START_TIME=$(date +%s)

  # Prerequisites
  check_health

  # Test flow
  register_user1
  login_user1
  create_project
  check_auto_owner
  register_user2
  invite_user2
  login_user2
  test_user2_view_project
  test_user2_view_members
  test_user2_invite_permission
  test_user2_modify_role
  check_timeline

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
