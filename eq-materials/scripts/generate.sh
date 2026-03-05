#!/bin/bash
# 情商物料生成脚本
# 用法：./generate.sh [daily|weekly|custom]

WORKSPACE="/root/.openclaw/workspace/eq-materials"
OUTPUT_DIR="$WORKSPACE/output"
TEMPLATE="$WORKSPACE/templates/daily-report.md"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 获取日期
DATE=$(date +%Y-%m-%d)
PERIOD=$(date +%V)

echo "📝 开始生成情商物料..."
echo "日期：$DATE"
echo "输出目录：$OUTPUT_DIR"

# 调用 OpenClaw sessions_spawn 生成内容
# 实际生成由 LLM 完成，此脚本负责调度

case "$1" in
    daily)
        echo "生成日报..."
        FILENAME="daily-$DATE.md"
        ;;
    weekly)
        echo "生成周报..."
        FILENAME="weekly-$PERIOD.md"
        ;;
    *)
        echo "生成自定义内容..."
        FILENAME="custom-$DATE.md"
        ;;
esac

echo "✅ 生成任务已提交"
echo "输出文件：$OUTPUT_DIR/$FILENAME"
