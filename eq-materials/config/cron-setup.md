# 情商物料生成 cron 配置

## 任务说明
每日 8:00 自动生成情商日报并推送到钉钉

## 配置方法

### 方式 1：手动添加 cron 任务
```bash
openclaw cron add --job '{
  "name": "情商日报自动生成",
  "schedule": {"kind": "cron", "expr": "0 8 * * *", "tz": "Asia/Shanghai"},
  "payload": {"kind": "agentTurn", "message": "生成今日情商日报"},
  "sessionTarget": "isolated",
  "enabled": true
}'
```

### 方式 2：Gateway 配置文件中添加
在 `openclaw.json` 的 cron 部分添加上述任务

## 任务流程
1. 从 library 中选取案例
2. 按照 template 生成内容
3. 输出到 output 目录
4. 通过 message 工具推送到钉钉

## 备注
- 需确保 gateway 设备 token 正常
- 推送前可配置人工审核环节
