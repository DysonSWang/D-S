#!/bin/bash

# =============================================================================
# 星契 (Starpact) E2E 持续集成测试脚本
# =============================================================================
# 用途：本地运行完整的 E2E 测试流程，模拟 CI 环境
# 使用：./tests/ci-e2e-test.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "  星契 E2E 持续集成测试"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 错误处理
handle_error() {
    echo -e "${RED}❌ 测试失败：$1${NC}"
    exit 1
}

# 步骤 1: 检查环境
echo "[1/8] 检查环境..."
if ! command -v node &> /dev/null; then
    handle_error "Node.js 未安装"
fi
if ! command -v npm &> /dev/null; then
    handle_error "npm 未安装"
fi
echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"
echo -e "${GREEN}✅ npm: $(npm -v)${NC}"

# 步骤 2: 安装依赖
echo ""
echo "[2/8] 安装依赖..."
cd "$ROOT_DIR/client"
if [ ! -d "node_modules" ]; then
    npm ci || npm install
fi
cd "$ROOT_DIR/server"
if [ ! -d "node_modules" ]; then
    npm ci || npm install
fi
echo -e "${GREEN}✅ 依赖安装完成${NC}"

# 步骤 3: 安装 Playwright
echo ""
echo "[3/8] 检查 Playwright..."
cd "$ROOT_DIR"
if [ ! -d "node_modules/@playwright" ]; then
    npm install -D @playwright/test
    npx playwright install chromium
fi
echo -e "${GREEN}✅ Playwright 已就绪${NC}"

# 步骤 4: 准备数据库
echo ""
echo "[4/8] 准备数据库..."
cd "$ROOT_DIR/server"
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
npx prisma generate
npx prisma db push
echo -e "${GREEN}✅ 数据库就绪${NC}"

# 步骤 5: 启动后端服务
echo ""
echo "[5/8] 启动后端服务..."
cd "$ROOT_DIR/server"
pkill -f "node.*server.js" || true
sleep 2
npm run dev > /tmp/ci-backend.log 2>&1 &
BACKEND_PID=$!
sleep 10

# 检查后端健康
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务运行中 (PID: $BACKEND_PID)${NC}"
else
    handle_error "后端服务启动失败"
fi

# 步骤 6: 启动前端服务
echo ""
echo "[6/8] 启动前端服务..."
cd "$ROOT_DIR/client"
pkill -f "vite" || true
sleep 2
npm run dev > /tmp/ci-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 10

# 检查前端健康
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端服务运行中 (PID: $FRONTEND_PID)${NC}"
else
    handle_error "前端服务启动失败"
fi

# 步骤 7: 运行 E2E 测试
echo ""
echo "[7/8] 运行 E2E 测试..."
cd "$ROOT_DIR"
echo ""
echo "运行 Playwright 测试..."
echo ""

# 运行测试
if npx playwright test --project="Desktop Chrome" --reporter=list; then
    echo ""
    echo -e "${GREEN}✅ E2E 测试通过${NC}"
    TEST_PASSED=true
else
    echo ""
    echo -e "${RED}❌ E2E 测试失败${NC}"
    TEST_PASSED=false
fi

# 步骤 8: 清理服务
echo ""
echo "[8/8] 清理服务..."
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true
echo -e "${GREEN}✅ 服务已停止${NC}"

# 生成报告
echo ""
echo "========================================"
echo "  测试报告"
echo "========================================"
echo ""

if [ "$TEST_PASSED" = true ]; then
    echo -e "${GREEN}✅ 所有测试通过${NC}"
    echo ""
    echo "查看 HTML 报告:"
    echo "  npx playwright show-report"
    echo ""
    exit 0
else
    echo -e "${RED}❌ 部分测试失败${NC}"
    echo ""
    echo "查看失败详情:"
    echo "  npx playwright show-report"
    echo ""
    echo "查看截图:"
    echo "  ls test-results/"
    echo ""
    exit 1
fi
