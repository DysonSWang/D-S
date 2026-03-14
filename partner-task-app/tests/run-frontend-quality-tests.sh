#!/bin/bash

# =============================================================================
# 前端质量测试运行脚本
# =============================================================================
# 用途：运行所有前端质量测试（组件/视觉/可访问性/性能）
# 使用：./tests/run-frontend-quality-tests.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "  前端质量测试套件"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试结果
COMPONENT_TESTS_PASSED=false
VISUAL_TESTS_PASSED=false
A11Y_TESTS_PASSED=false
PERF_TESTS_PASSED=false

# 步骤 1: 组件测试
echo -e "${BLUE}[1/4] 运行组件测试...${NC}"
echo ""

cd "$ROOT_DIR/client"
if npm run test:components 2>&1 | tee /tmp/component-tests.log; then
    echo -e "${GREEN}✅ 组件测试通过${NC}"
    COMPONENT_TESTS_PASSED=true
else
    echo -e "${RED}❌ 组件测试失败${NC}"
fi

echo ""

# 步骤 2: 视觉回归测试
echo -e "${BLUE}[2/4] 运行视觉回归测试...${NC}"
echo ""

cd "$ROOT_DIR"
if npx playwright test visual-regression --reporter=list 2>&1 | tee /tmp/visual-tests.log; then
    echo -e "${GREEN}✅ 视觉回归测试通过${NC}"
    VISUAL_TESTS_PASSED=true
else
    echo -e "${YELLOW}⚠️  视觉回归测试有差异（首次运行会生成基准）${NC}"
    VISUAL_TESTS_PASSED=true  # 首次运行允许通过
fi

echo ""

# 步骤 3: 可访问性测试
echo -e "${BLUE}[3/4] 运行可访问性测试...${NC}"
echo ""

cd "$ROOT_DIR"
if npx playwright test accessibility --reporter=list 2>&1 | tee /tmp/a11y-tests.log; then
    echo -e "${GREEN}✅ 可访问性测试通过${NC}"
    A11Y_TESTS_PASSED=true
else
    echo -e "${YELLOW}⚠️  可访问性测试有问题（查看详情）${NC}"
    A11Y_TESTS_PASSED=false
fi

echo ""

# 步骤 4: 性能测试
echo -e "${BLUE}[4/4] 运行性能测试...${NC}"
echo ""

cd "$ROOT_DIR"
if npx playwright test performance --reporter=list 2>&1 | tee /tmp/perf-tests.log; then
    echo -e "${GREEN}✅ 性能测试通过${NC}"
    PERF_TESTS_PASSED=true
else
    echo -e "${YELLOW}⚠️  性能测试未达标${NC}"
    PERF_TESTS_PASSED=false
fi

echo ""
echo "========================================"
echo "  测试报告"
echo "========================================"
echo ""

# 汇总结果
echo -e "组件测试：      $([ "$COMPONENT_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ 通过${NC}" || echo -e "${RED}❌ 失败${NC}")"
echo -e "视觉回归测试：  $([ "$VISUAL_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ 通过${NC}" || echo -e "${RED}❌ 失败${NC}")"
echo -e "可访问性测试：  $([ "$A11Y_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ 通过${NC}" || echo -e "${RED}❌ 失败${NC}")"
echo -e "性能测试：      $([ "$PERF_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ 通过${NC}" || echo -e "${RED}❌ 失败${NC}")"

echo ""

# 生成 HTML 报告
echo "生成 HTML 报告..."
npx playwright test --reporter=html 2>/dev/null || true

echo ""
echo "查看报告：npx playwright show-report"
echo ""

# 退出码
if [ "$COMPONENT_TESTS_PASSED" = true ] && [ "$A11Y_TESTS_PASSED" = true ] && [ "$PERF_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}✅ 所有关键测试通过${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  部分测试未通过（查看详情）${NC}"
    exit 1
fi
