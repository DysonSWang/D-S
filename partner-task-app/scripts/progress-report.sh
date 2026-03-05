#!/bin/bash

# 星契 Starpact - 定时进度汇报脚本
# 每 10 分钟执行一次

REPORT_NUM=$1
if [ -z "$REPORT_NUM" ]; then
    REPORT_NUM=1
fi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
REPORT_FILE="STATUS_REPORT_${REPORT_NUM}.md"

# 检查服务状态
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/me 2>/dev/null || echo "000")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")

# 生成报告
cat > "$REPORT_FILE" << EOF
# 星契 Starpact - 进度汇报 (第 ${REPORT_NUM} 次)

**时间**: ${TIMESTAMP}

---

## 📊 服务状态

| 服务 | 状态 | 端口 |
|------|------|------|
| 后端 API | $([ "$BACKEND_STATUS" = "200" ] && echo "✅ 运行中" || echo "❌ 未运行") | 3001 |
| 前端 Web | $([ "$FRONTEND_STATUS" = "200" ] && echo "✅ 运行中" || echo "❌ 未运行") | 5173 |

---

## ✅ 本次完成

[待填写具体完成的工作]

---

## 📋 下次计划

[待填写下一步计划]

---

## 🔧 遇到的问题

[待填写遇到的问题]

---

**以星为契，以心为诺** ⭐
EOF

echo "进度汇报已生成：$REPORT_FILE"
cat "$REPORT_FILE"
