#!/bin/bash
# 伙伴任务系统 - 自动开发脚本
# 每 15 分钟执行一次，检查进度并继续开发

WORKSPACE="/root/.openclaw/workspace/partner-task-app"
LOG_FILE="$WORKSPACE/dev-progress.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== 自动开发任务启动 =========="

cd "$WORKSPACE" || exit 1

# 检查 Git 状态
log "检查 Git 状态..."
git status --short >> "$LOG_FILE" 2>&1

# 检查后端文件数量
BACKEND_ROUTES=$(find server/src/routes -name "*.ts" 2>/dev/null | wc -l)
BACKEND_HANDLERS=$(find server/src/handlers -name "*.ts" 2>/dev/null | wc -l)
log "后端路由文件数：$BACKEND_ROUTES"
log "后端处理器文件数：$BACKEND_HANDLERS"

# 检查前端文件数量
FRONTEND_PAGES=$(find client/src/pages -name "*.tsx" 2>/dev/null | wc -l)
FRONTEND_LAYOUTS=$(find client/src/layouts -name "*.tsx" 2>/dev/null | wc -l)
log "前端页面文件数：$FRONTEND_PAGES"
log "前端布局文件数：$FRONTEND_LAYOUTS"

# 提交当前更改
log "提交当前更改..."
git add -A >> "$LOG_FILE" 2>&1
git diff --cached --quiet || {
    git commit -m "Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE" 2>&1
    git push >> "$LOG_FILE" 2>&1
    log "代码已提交并推送"
} || log "无更改需要提交"

log "========== 自动开发任务完成 =========="
