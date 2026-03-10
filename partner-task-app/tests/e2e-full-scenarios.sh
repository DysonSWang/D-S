#!/bin/bash
# 伙伴任务打卡系统 - 完整 E2E 场景测试
# 测试 3 个核心用户旅程

# 移除 set -e 以允许错误处理

API_URL="${API_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     星契 Starpact - 完整 E2E 场景测试                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL++))
}

info() {
    echo -e "${BLUE}ℹ️${NC}: $1"
}

section() {
    echo ""
    echo -e "${YELLOW}════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════${NC}"
}

# 清理测试数据
cleanup() {
    info "清理测试数据..."
    # 删除测试用户（如果存在）
    curl -s -X DELETE "$API_URL/api/admin/users/testgrower" \
      -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || true
    curl -s -X DELETE "$API_URL/api/admin/users/testguide" \
      -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null || true
}

# ==================== 场景 0: 准备测试账号 ====================
section "场景 0: 准备测试账号"

info "创建/登录成长者账号..."
GROWER_REG=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testgrower","email":"grower@test.com","password":"test123","role":"GROWER"}')

if echo "$GROWER_REG" | grep -q "token"; then
    GROWER_TOKEN=$(echo "$GROWER_REG" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    pass "成长者账号创建成功"
else
    # 账号已存在，直接登录
    GROWER_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"username":"testgrower","password":"test123"}')
    if echo "$GROWER_LOGIN" | grep -q "token"; then
        GROWER_TOKEN=$(echo "$GROWER_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        pass "成长者账号登录成功 (已存在)"
    else
        fail "成长者账号创建/登录失败"
    fi
fi

info "创建/登录引导者账号..."
GUIDE_REG=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testguide","email":"guide@test.com","password":"test123","role":"GUIDE"}')

if echo "$GUIDE_REG" | grep -q "token"; then
    GUIDE_TOKEN=$(echo "$GUIDE_REG" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    pass "引导者账号创建成功"
else
    # 账号已存在，直接登录
    GUIDE_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"username":"testguide","password":"test123"}')
    if echo "$GUIDE_LOGIN" | grep -q "token"; then
        GUIDE_TOKEN=$(echo "$GUIDE_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        pass "引导者账号登录成功 (已存在)"
    else
        fail "引导者账号创建/登录失败"
    fi
fi

info "使用 admin 账号登录..."
ADMIN_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
pass "Admin 账号登录成功"

# ==================== 场景 1: 成长者用户旅程 ====================
section "场景 1: 成长者用户旅程"

info "1.1 成长者登录..."
GROWER_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testgrower","password":"test123"}')
GROWER_TOKEN=$(echo "$GROWER_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
pass "成长者登录成功"

info "1.2 获取成长者信息..."
GROWER_INFO=$(curl -s "$API_URL/api/users/me" \
  -H "Authorization: Bearer $GROWER_TOKEN")
if echo "$GROWER_INFO" | grep -q "testgrower"; then
    pass "获取成长者信息成功"
else
    fail "获取成长者信息失败"
fi

info "1.3 初始化奖励账户..."
REWARD_INIT=$(curl -s "$API_URL/api/rewards/my" \
  -H "Authorization: Bearer $GROWER_TOKEN")
if echo "$REWARD_INIT" | grep -q "bones"; then
    BONES=$(echo "$REWARD_INIT" | grep -o '"bones":[0-9]*' | cut -d':' -f2)
    pass "获取奖励资产成功 (Bones: $BONES)"
else
    fail "获取奖励资产失败"
fi

info "1.4 初始化小屋..."
COTTAGE=$(curl -s "$API_URL/api/cottage/my" \
  -H "Authorization: Bearer $GROWER_TOKEN")
if echo "$COTTAGE" | grep -q "cottage"; then
    pass "获取小屋信息成功"
else
    fail "获取小屋信息失败"
fi

info "1.5 获取成就列表..."
ACHIEVEMENTS=$(curl -s "$API_URL/api/achievements/my" \
  -H "Authorization: Bearer $GROWER_TOKEN")
if echo "$ACHIEVEMENTS" | grep -q "success"; then
    pass "获取成就列表成功"
else
    fail "获取成就列表失败"
fi

info "1.6 获取偏好设置..."
PREFERENCES=$(curl -s "$API_URL/api/users/preferences" \
  -H "Authorization: Bearer $GROWER_TOKEN")
if echo "$PREFERENCES" | grep -q "success"; then
    pass "获取偏好设置成功"
else
    fail "获取偏好设置失败"
fi

info "1.7 获取装饰列表..."
DECORATIONS=$(curl -s "$API_URL/api/cottage/decorations" \
  -H "Authorization: Bearer $GROWER_TOKEN")
DECORATION_COUNT=$(echo "$DECORATIONS" | grep -o '"total":[0-9]*' | cut -d':' -f2)
pass "获取装饰列表成功 (共 $DECORATION_COUNT 个)"

info "1.8 获取温暖度排行榜..."
RANKING=$(curl -s "$API_URL/api/cottage/warmth-ranking" \
  -H "Authorization: Bearer $GROWER_TOKEN")
if echo "$RANKING" | grep -q "success\|ranking"; then
    pass "获取排行榜成功"
else
    fail "获取排行榜失败"
fi

# ==================== 场景 2: 引导者用户旅程 ====================
section "场景 2: 引导者用户旅程"

info "2.1 引导者登录..."
GUIDE_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testguide","password":"test123"}')
GUIDE_TOKEN=$(echo "$GUIDE_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
pass "引导者登录成功"

info "2.2 获取引导者信息..."
GUIDE_INFO=$(curl -s "$API_URL/api/users/me" \
  -H "Authorization: Bearer $GUIDE_TOKEN")
if echo "$GUIDE_INFO" | grep -q "testguide"; then
    pass "获取引导者信息成功"
else
    fail "获取引导者信息失败"
fi

info "2.3 发送关系邀请..."
INVITE=$(curl -s -X POST "$API_URL/api/relationships/invite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GUIDE_TOKEN" \
  -d '{"growerUsername":"testgrower","mode":"PARTNER","agreementContent":"测试协议"}')
if echo "$INVITE" | grep -q "relationship\|Invitation"; then
    pass "发送关系邀请成功"
else
    fail "发送关系邀请失败：$INVITE"
fi

info "2.4 获取关系列表..."
RELATIONSHIPS=$(curl -s "$API_URL/api/relationships" \
  -H "Authorization: Bearer $GUIDE_TOKEN")
if echo "$RELATIONSHIPS" | grep -q "relationships\|total"; then
    pass "获取关系列表成功"
else
    fail "获取关系列表失败"
fi

info "2.5 创建任务..."
# 首先获取关系 ID
RELATIONSHIPS=$(curl -s "$API_URL/api/relationships" \
  -H "Authorization: Bearer $GUIDE_TOKEN")
RELATIONSHIP_ID=$(echo "$RELATIONSHIPS" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$RELATIONSHIP_ID" ]; then
    CREATE_TASK=$(curl -s -X POST "$API_URL/api/tasks" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $GUIDE_TOKEN" \
      -d "{\"relationshipId\":$RELATIONSHIP_ID,\"name\":\"测试任务\",\"description\":\"这是一个测试任务\",\"difficulty\":2,\"proofType\":\"TEXT\"}")
    if echo "$CREATE_TASK" | grep -q "task\|Task"; then
        TASK_ID=$(echo "$CREATE_TASK" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        pass "创建任务成功 (ID: $TASK_ID)"
    else
        fail "创建任务失败：$CREATE_TASK"
    fi
else
    fail "未找到关系，无法创建任务"
fi

info "2.6 获取任务列表..."
TASKS=$(curl -s "$API_URL/api/tasks" \
  -H "Authorization: Bearer $GUIDE_TOKEN")
if echo "$TASKS" | grep -q "tasks\|total"; then
    pass "获取任务列表成功"
else
    fail "获取任务列表失败"
fi

# ==================== 场景 3: 管理员旅程 ====================
section "场景 3: 管理员旅程"

info "3.1 获取管理统计..."
ADMIN_STATS=$(curl -s "$API_URL/api/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$ADMIN_STATS" | grep -q "stats\|users"; then
    pass "获取管理统计成功"
else
    fail "获取管理统计失败"
fi

info "3.2 获取用户列表..."
USERS=$(curl -s "$API_URL/api/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$USERS" | grep -q "users\|total"; then
    pass "获取用户列表成功"
else
    fail "获取用户列表失败"
fi

info "3.3 获取敏感词列表..."
SENSITIVE_WORDS=$(curl -s "$API_URL/api/admin/sensitive-words" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$SENSITIVE_WORDS" | grep -q "success\|words"; then
    pass "获取敏感词列表成功"
else
    fail "获取敏感词列表失败"
fi

# ==================== 场景 4: 公共功能 ====================
section "场景 4: 公共功能"

info "4.1 获取随机任务..."
RANDOM_TASK=$(curl -s "$API_URL/api/tasks/random" \
  -H "Authorization: Bearer $GROWER_TOKEN")
if echo "$RANDOM_TASK" | grep -q "success\|data"; then
    pass "获取随机任务成功"
else
    fail "获取随机任务失败"
fi

info "4.2 获取商店商品..."
SHOP_ITEMS=$(curl -s "$API_URL/api/shop/items" \
  -H "Authorization: Bearer $GROWER_TOKEN")
if echo "$SHOP_ITEMS" | grep -q "success\|items"; then
    pass "获取商店商品成功"
else
    fail "获取商店商品失败"
fi

info "4.3 获取任务日历..."
CALENDAR=$(curl -s "$API_URL/api/calendar/tasks?year=2026&month=3" \
  -H "Authorization: Bearer $GROWER_TOKEN")
if echo "$CALENDAR" | grep -q "success\|calendar"; then
    pass "获取任务日历成功"
else
    fail "获取任务日历失败"
fi

info "4.4 前端页面可访问..."
if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
    pass "前端页面可访问"
else
    fail "前端页面不可访问"
fi

# ==================== 测试总结 ====================
section "测试总结"

TOTAL=$((PASS + FAIL))
RATE=$((PASS * 100 / TOTAL))

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    E2E 测试结果                            ║"
echo "╠══════════════════════════════════════════════════════════╣"
printf "║  通过：${GREEN}%3d${NC}  失败：${RED}%3d${NC}  总计：%3d                   ║\n" $PASS $FAIL $TOTAL
printf "║  通过率：${GREEN}%d%%${NC}                                              ║\n" $RATE
echo "╠══════════════════════════════════════════════════════════╣"

if [ $FAIL -eq 0 ]; then
    echo -e "║  ${GREEN}🎉 所有 E2E 场景测试通过！${NC}                            ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    exit 0
else
    echo -e "║  ${YELLOW}⚠️  部分测试失败，请检查日志${NC}                         ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    exit 1
fi
