#!/bin/bash
# SSO 后端重启脚本
# 用法：bash /root/.openclaw/workspace/partner-task-app-go/partner-task-app/RESTART-BACKEND.sh

echo "🔧 开始重启后端服务..."

# 1. 查找所有相关进程
echo "📋 查找 Node.js 进程..."
ps aux | grep -E "tsx|node.*server" | grep -v grep | awk '{print $2}'

# 2. 强制杀死
echo "💀 强制停止进程..."
pkill -9 -f "tsx"
pkill -9 -f "node.*server"
sleep 3

# 3. 释放端口
echo "🔓 释放端口 3001..."
fuser -k 3001/tcp 2>/dev/null
sleep 5

# 4. 验证
echo "✅ 验证端口状态..."
PORT_USAGE=$(lsof -ti:3001 | wc -l)
if [ "$PORT_USAGE" -eq 0 ]; then
    echo "✅ 端口 3001 已释放"
else
    echo "⚠️  端口 3001 仍被占用，尝试继续..."
fi

# 5. 启动新后端
echo "🚀 启动新后端..."
cd /root/.openclaw/workspace/partner-task-app-go/partner-task-app/server
nohup npx tsx src/index.ts > /tmp/backend-sso-restart.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端启动成功，PID: $BACKEND_PID"

# 6. 等待启动
echo "⏳ 等待后端启动..."
sleep 15

# 7. 测试
echo "🧪 测试后端..."
HEALTH=$(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null)
if [ "$HEALTH" = "ok" ]; then
    echo "✅ 后端健康检查通过"
else
    echo "⚠️  后端健康检查失败，请查看日志：/tmp/backend-sso-restart.log"
fi

echo "🧪 测试 SSO API..."
SSO_TEST=$(curl -s -X POST http://localhost:3001/api/sso/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.user.roles // .error' 2>/dev/null)

if [ "$SSO_TEST" != "null" ] && [ "$SSO_TEST" != "" ]; then
    echo "✅ SSO API 测试成功！角色：$SSO_TEST"
else
    echo "⚠️  SSO API 测试失败，请检查日志"
    tail -20 /tmp/backend-sso-restart.log | grep -i error
fi

echo ""
echo "========================================"
echo "✅ 后端重启完成！"
echo "========================================"
echo "测试 SSO 登录：http://118.25.94.81:5173/sso-login"
echo "账号：admin / admin123"
echo "========================================"
