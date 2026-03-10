# 单点登录（SSO）配置说明

**实现时间**: 2026-03-11  
**方案**: 方案一 - 统一登录 + 角色切换

---

## 🎯 功能说明

### 什么是单点登录（SSO）？

**一次登录，访问所有授权角色**

用户只需登录一次，系统会显示该用户所有可访问的角色，选择后即可进入对应角色的工作台。

---

## 📋 实现内容

### 后端 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/sso/login` | POST | 统一登录，返回所有可访问角色 |
| `/api/sso/switch-role` | POST | 切换当前角色 |
| `/api/sso/me` | GET | 获取用户信息（包含所有角色） |

### 前端页面

| 页面 | 路由 | 说明 |
|------|------|------|
| SSO 登录页 | `/sso-login` | 统一登录页面 |
| 角色切换器 | 组件 | 右上角角色切换菜单 |

---

## 🔐 角色权限

### 管理员 (ADMIN)
可访问角色：
- ✅ 管理员
- ✅ 引导者
- ✅ 成长者

### 引导者 (GUIDE)
可访问角色：
- ✅ 引导者

### 成长者 (GROWER)
可访问角色：
- ✅ 成长者

---

## 🚀 使用流程

### 1. 访问 SSO 登录页

```
http://118.25.94.81:5173/sso-login
```

### 2. 输入账号密码

```
用户名：admin
密码：admin123
```

### 3. 选择角色

系统显示该账号可访问的所有角色：
- 管理员
- 引导者
- 成长者

### 4. 进入工作台

选择角色后，自动跳转到对应角色的仪表盘。

### 5. 切换角色（可选）

在页面右上角点击角色切换器，可以随时切换到其他角色。

---

## 📱 访问地址

| 页面 | URL |
|------|-----|
| **SSO 登录** | http://118.25.94.81:5173/sso-login |
| 普通登录 | http://118.25.94.81:5173/login |
| 管理后台 | http://118.25.94.81:5173/admin/dashboard |
| 引导者后台 | http://118.25.94.81:5173/guide/dashboard |
| 成长者后台 | http://118.25.94.81:5173/grower/dashboard |

---

## 🧪 测试账号

| 账号 | 密码 | 角色 | 可访问角色 |
|------|------|------|-----------|
| admin | admin123 | ADMIN | 管理员 + 引导者 + 成长者 |
| testguide | test123 | GUIDE | 引导者 |
| testgrower | test123 | GROWER | 成长者 |

---

## 🔧 技术实现

### Token 结构

```json
{
  "userId": 1,
  "username": "admin",
  "roles": ["ADMIN", "GUIDE", "GROWER"],
  "currentRole": "ADMIN"
}
```

### 角色切换流程

1. 用户点击角色切换器
2. 调用 `/api/sso/switch-role`
3. 后端验证权限并生成新 Token
4. 前端更新 Token 并跳转

### 权限验证

```typescript
// 中间件验证
const decoded = jwt.verify(token, JWT_SECRET) as {
  userId: number;
  username: string;
  roles: string[];
  currentRole: string;
};

// 检查当前角色是否有权限
if (!decoded.roles.includes(requiredRole)) {
  throw new ForbiddenError('Insufficient permissions');
}
```

---

## ⚠️ 注意事项

### 1. 服务重启

如果 SSO API 报错，需要重启服务：

```bash
# 停止所有服务
pkill -9 -f "tsx|vite"

# 启动后端
cd server && npx tsx src/index.ts &

# 启动前端
cd client && npm run dev -- --host 0.0.0.0 &
```

### 2. 数据库字段

确保 `user.status` 字段使用字符串类型：
- ✅ `'ACTIVE'`
- ❌ `1` (数字类型会导致验证失败)

### 3. 密码验证

当前使用简单密码比较，生产环境应使用 bcrypt：

```typescript
// 当前实现（简单比较）
if (user.password !== password) {
  return error;
}

// 生产环境（bcrypt）
const valid = await bcrypt.compare(password, user.password);
```

---

## 📊 优势

### vs 传统多账号登录

| 特性 | 传统方式 | SSO 方式 |
|------|---------|---------|
| 登录次数 | 多次 | 一次 |
| 账号管理 | 多个账号 | 一个账号 |
| 角色切换 | 重新登录 | 一键切换 |
| 用户体验 | 繁琐 | 流畅 |

---

## 🎯 下一步优化

### 短期
- [ ] 修复服务重启问题
- [ ] 添加密码 bcrypt 加密
- [ ] 完善错误处理

### 中期
- [ ] 支持自定义角色分配
- [ ] 添加角色权限配置页面
- [ ] 支持更多认证方式（短信/邮箱）

### 长期
- [ ] OAuth2 集成（微信/钉钉）
- [ ] 多因素认证（2FA）
- [ ] 会话管理（设备管理）

---

**文档维护**: AI 全栈工程师  
**最后更新**: 2026-03-11 01:55 GMT+8
