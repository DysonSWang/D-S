# 🚨 SSO 单点登录 - 紧急重启说明

**状态**: 代码已完成，需要重启服务  
**时间**: 2026-03-11 02:05

---

## ⚠️ 当前问题

服务器端口被旧进程占用，新代码未生效。

**表现**:
- SSO API 返回 INTERNAL_ERROR
- 前端编译错误已修复
- 后端代码已提交但未加载

---

## 🔧 解决方案

### 方法 1: 手动重启（推荐）

```bash
# 1. 停止所有 Node.js 进程
pkill -9 node
sleep 5

# 2. 确认进程已停止
ps aux | grep node | grep -v grep
# 应该没有输出

# 3. 启动后端
cd /root/.openclaw/workspace/partner-task-app-go/partner-task-app/server
nohup npx tsx src/index.ts > /tmp/backend.log 2>&1 &

# 4. 等待后端启动
sleep 10

# 5. 检查后端
curl http://localhost:3001/health

# 6. 启动前端
cd /root/.openclaw/workspace/partner-task-app-go/partner-task-app/client
nohup npm run dev -- --host 0.0.0.0 > /tmp/frontend.log 2>&1 &

# 7. 等待前端启动
sleep 10

# 8. 检查前端
curl http://localhost:5173/
```

### 方法 2: 使用系统服务

如果配置了 systemd 服务：

```bash
systemctl restart openclaw
```

---

## ✅ 验证 SSO 功能

### 1. 测试 SSO 登录 API

```bash
curl -X POST http://localhost:3001/api/sso/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**期望响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": {
      "id": 1,
      "username": "admin",
      "roles": ["ADMIN", "GUIDE", "GROWER"],
      "currentRole": "ADMIN"
    }
  }
}
```

### 2. 访问 SSO 登录页

```
http://118.25.94.81:5173/sso-login
```

**期望**:
- 页面正常显示
- 输入 admin/admin123
- 显示角色选择（管理员/引导者/成长者）
- 选择后进入对应后台

---

## 📝 已修复问题

### 前端
- ✅ Chakra UI 依赖安装
- ✅ api 导入错误修复
- ✅ 所有组件使用 default import

### 后端
- ✅ SSO 路由实现
- ✅ Token 支持多角色
- ✅ 角色切换逻辑

---

## 🎯 功能清单

### 已完成
- [x] SSO 登录 API
- [x] 角色切换 API
- [x] 用户信息 API
- [x] SSO 登录页面
- [x] 角色切换组件
- [x] 前端依赖修复
- [x] 导入错误修复

### 待完成
- [ ] 服务重启
- [ ] SSO 功能验证
- [ ] 角色切换测试

---

## 📱 访问地址

| 页面 | URL |
|------|-----|
| SSO 登录 | http://118.25.94.81:5173/sso-login |
| 普通登录 | http://118.25.94.81:5173/login |

---

## 🔑 测试账号

| 账号 | 密码 | 可访问角色 |
|------|------|-----------|
| admin | admin123 | 管理员 + 引导者 + 成长者 |

---

**紧急联系人**: AI 全栈工程师  
**创建时间**: 2026-03-11 02:05 GMT+8
