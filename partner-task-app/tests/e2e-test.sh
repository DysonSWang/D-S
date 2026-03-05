#!/bin/bash
# 伙伴任务打卡系统 - E2E 测试脚本

set -e

API_URL="${API_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

echo "🧪 开始 E2E 测试..."
echo "API: $API_URL"
echo "Frontend: $FRONTEND_URL"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    exit 1
}

info() {
    echo -e "${YELLOW}ℹ️${NC}: $1"
}

# 测试 1: 健康检查
info "测试 1: API 健康检查..."
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
    pass "API 健康检查通过"
else
    fail "API 健康检查失败"
fi

# 测试 2: 注册新用户
info "测试 2: 用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123","role":"GROWER"}')

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    pass "用户注册成功"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    fail "用户注册失败: $REGISTER_RESPONSE"
fi

# 测试 3: 登录
info "测试 3: 用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    pass "用户登录成功"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    fail "用户登录失败: $LOGIN_RESPONSE"
fi

# 测试 4: 获取当前用户
info "测试 4: 获取当前用户信息..."
USER_RESPONSE=$(curl -s "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USER_RESPONSE" | grep -q "username"; then
    pass "获取用户信息成功"
else
    fail "获取用户信息失败: $USER_RESPONSE"
fi

# 测试 5: 获取奖励资产
info "测试 5: 获取奖励资产..."
REWARD_RESPONSE=$(curl -s "$API_URL/api/rewards/my" \
  -H "Authorization: Bearer $TOKEN")

if echo "$REWARD_RESPONSE" | grep -q "bones\|fish\|gems"; then
    pass "获取奖励资产成功"
else
    fail "获取奖励资产失败: $REWARD_RESPONSE"
fi

# 测试 6: 获取小屋信息
info "测试 6: 获取小屋信息..."
COTTAGE_RESPONSE=$(curl -s "$API_URL/api/cottage/my" \
  -H "Authorization: Bearer $TOKEN")

if echo "$COTTAGE_RESPONSE" | grep -q "cottage"; then
    pass "获取小屋信息成功"
else
    fail "获取小屋信息失败: $COTTAGE_RESPONSE"
fi

# 测试 7: 获取装饰物品列表
info "测试 7: 获取装饰物品列表..."
DECORATIONS_RESPONSE=$(curl -s "$API_URL/api/rewards/decorations" \
  -H "Content-Type: application/json")

DECORATION_COUNT=$(echo "$DECORATIONS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
if [ "$DECORATION_COUNT" -gt 0 ] 2>/dev/null; then
    pass "获取装饰物品列表成功 (共 $DECORATION_COUNT 个)"
else
    fail "获取装饰物品列表失败: $DECORATIONS_RESPONSE"
fi

# 测试 8: 前端页面可访问
info "测试 8: 前端页面可访问性..."
if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
    pass "前端页面可访问"
else
    info "前端可能未启动，跳过此测试"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 所有测试通过！${NC}"
echo "================================"
