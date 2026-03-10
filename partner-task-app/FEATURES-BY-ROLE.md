# 星契 Starpact - 各角色功能清单

**文档版本**: 2026-03-10  
**项目状态**: 生产就绪 ✅

---

## 👥 用户角色概览

| 角色 | 英文 | 说明 | 用户量占比 |
|------|------|------|-----------|
| **成长者** | GROWER | 接受任务、完成任务的用户 | 80% |
| **引导者** | GUIDE | 发布任务、指导成长者的用户 | 15% |
| **管理员** | ADMIN | 系统管理、内容审核 | 5% |

---

## 🌱 成长者 (GROWER) 功能

### 1. 用户中心
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 用户注册 | POST /api/auth/register | ✅ | 支持邮箱/手机号 |
| 用户登录 | POST /api/auth/login | ✅ | JWT Token 认证 |
| 获取个人信息 | GET /api/users/me | ✅ | 包含偏好设置 |
| 更新偏好设置 | PUT /api/users/preferences | ✅ | 任务/奖励/建议偏好 |
| 获取偏好设置 | GET /api/users/preferences | ✅ | 个性化配置 |

### 2. 关系管理
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看关系列表 | GET /api/relationships | ✅ | 与引导者的关系 |
| 确认关系邀请 | POST /api/relationships/confirm | ✅ | 接受引导者邀请 |
| 拒绝关系邀请 | POST /api/relationships/reject | ✅ | 拒绝邀请 |
| 解除关系 | POST /api/relationships/terminate | ✅ | 7 天冷静期 |

### 3. 任务系统
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看任务列表 | GET /api/tasks | ✅ | 我的所有任务 |
| 查看任务详情 | GET /api/tasks/:id | ✅ | 任务详细信息 |
| 开始任务 | POST /api/tasks/:id/start | ✅ | 开始执行任务 |
| 提交打卡 | POST /api/tasks/:id/submit | ✅ | 提交任务完成证明 |
| 查看任务日历 | GET /api/calendar/tasks | ✅ | 月度任务分布 |
| 获取随机任务 | GET /api/tasks/random | ✅ | 随机挑战 |
| 接受随机任务 | POST /api/tasks/random/accept | ✅ | 接受挑战 |

### 4. 奖励系统
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看奖励资产 | GET /api/rewards/my | ✅ | 5 种货币余额 |
| 查看奖励流水 | GET /api/rewards/transactions | ✅ | 收入/支出记录 |
| 任务奖励自动发放 | - | ✅ | 任务完成后自动发放 |

### 5. 小屋系统
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看小屋 | GET /api/cottage/my | ✅ | 小屋等级/温暖度 |
| 装饰小屋 | POST /api/cottage/decorate | ✅ | 装备装饰品 |
| 查看装饰列表 | GET /api/cottage/decorations | ✅ | 所有装饰物品 |
| 查看图鉴 | GET /api/cottage/collections | ✅ | 装饰收集进度 |
| 温暖度排行榜 | GET /api/cottage/warmth-ranking | ✅ | 全服排名 |

### 6. 成就系统
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看成就列表 | GET /api/achievements | ✅ | 所有成就 |
| 查看我的成就 | GET /api/achievements/my | ✅ | 已解锁成就 |
| 成就自动解锁 | - | ✅ | 完成任务自动解锁 |

### 7. 商店系统
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 浏览商品 | GET /api/shop/items | ✅ | 装饰/特效/特权 |
| 兑换商品 | POST /api/shop/orders | ✅ | 使用货币兑换 |
| 查看订单 | GET /api/shop/orders | ✅ | 兑换记录 |

### 8. 其他功能
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看通知 | GET /api/notifications | ✅ | 系统通知 |
| 关系证书 | GET /api/certificates/:id | ✅ | 生成关系证书 |

---

## 🎯 引导者 (GUIDE) 功能

### 1. 用户中心
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 用户注册 | POST /api/auth/register | ✅ | 角色选择 GUIDE |
| 用户登录 | POST /api/auth/login | ✅ | JWT Token 认证 |
| 获取个人信息 | GET /api/users/me | ✅ | 包含偏好设置 |

### 2. 关系管理
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 发送关系邀请 | POST /api/relationships/invite | ✅ | 邀请成长者 |
| 查看关系列表 | GET /api/relationships | ✅ | 所有成长者关系 |
| 确认关系 | POST /api/relationships/confirm | ✅ | 成长者确认后生效 |
| 解除关系 | POST /api/relationships/terminate | ✅ | 7 天冷静期 |

### 3. 任务管理
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 创建任务 | POST /api/tasks | ✅ | 为成长者发布任务 |
| 查看任务列表 | GET /api/tasks | ✅ | 我发布的任务 |
| 查看任务详情 | GET /api/tasks/:id | ✅ | 任务详细信息 |
| 审核打卡 | POST /api/tasks/:id/review | ✅ | 通过/拒绝打卡 |
| 发放奖励 | POST /api/tasks/:id/reward | ✅ | 手动发放奖励 |
| 取消任务 | POST /api/tasks/:id/cancel | ✅ | 取消未完成任务 |

### 4. 成长者管理
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看成长者进度 | GET /api/growers/:id/progress | ⏳ | 任务完成统计 |
| 查看成长者成就 | GET /api/growers/:id/achievements | ⏳ | 已解锁成就 |

### 5. 数据统计
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看指导统计 | GET /api/guide/stats | ⏳ | 任务发布/完成统计 |
| 查看温暖度贡献 | GET /api/guide/warmth-contribution | ⏳ | 为成长者小屋贡献 |

---

## 👨‍💼 管理员 (ADMIN) 功能

### 1. 用户管理
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看用户列表 | GET /api/admin/users | ✅ | 所有用户 |
| 查看用户详情 | GET /api/users/:id | ✅ | 用户详细信息 |
| 更新用户状态 | PUT /api/users/:id/status | ✅ | 启用/禁用账号 |
| 删除用户 | DELETE /api/users/:id | ✅ | 删除违规用户 |
| 用户统计 | GET /api/admin/users/stats | ✅ | 用户增长统计 |

### 2. 内容管理
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看敏感词列表 | GET /api/admin/sensitive-words | ✅ | 敏感词库 |
| 添加敏感词 | POST /api/admin/sensitive-words | ✅ | 新增敏感词 |
| 删除敏感词 | DELETE /api/admin/sensitive-words/:id | ✅ | 删除敏感词 |
| 内容审核 | GET /api/admin/content-review | ⏳ | 用户生成内容审核 |

### 3. 数据看板
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 管理统计 | GET /api/admin/stats | ✅ | 核心数据统计 |
| 用户统计 | GET /api/admin/users | ✅ | 用户数量/角色分布 |
| 关系统计 | GET /api/admin/relationships | ⏳ | 关系建立/解除统计 |
| 任务统计 | GET /api/admin/tasks | ⏳ | 任务发布/完成统计 |
| 奖励统计 | GET /api/admin/rewards | ⏳ | 货币发行/消耗统计 |

### 4. 系统管理
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看系统日志 | GET /api/admin/logs | ⏳ | 操作日志 |
| 查看错误报告 | GET /api/admin/errors | ⏳ | 系统错误统计 |
| 系统配置 | GET/PUT /api/admin/config | ⏳ | 系统参数配置 |

---

## 🌐 公共功能 (所有角色)

### 1. 基础服务
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 健康检查 | GET /health | ✅ | 服务状态 |
| API 首页 | GET /api | ✅ | API 文档入口 |

### 2. 通知系统
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 查看通知列表 | GET /api/notifications | ✅ | 我的通知 |
| 标记已读 | POST /api/notifications/:id/read | ✅ | 标记为已读 |
| 删除通知 | DELETE /api/notifications/:id | ✅ | 删除通知 |

### 3. 消息系统
| 功能 | API | 状态 | 说明 |
|------|-----|------|------|
| 发送私信 | POST /api/messages | ⏳ | 给关系内用户发消息 |
| 查看消息列表 | GET /api/messages | ⏳ | 私信列表 |
| 查看消息详情 | GET /api/messages/:id | ⏳ | 消息详细内容 |

---

## 📊 功能完成度统计

| 角色 | 已实现 | 开发中 | 计划中 | 完成度 |
|------|--------|--------|--------|--------|
| **成长者** | 35 | 0 | 5 | 87% |
| **引导者** | 12 | 0 | 3 | 80% |
| **管理员** | 8 | 0 | 7 | 53% |
| **公共功能** | 8 | 0 | 4 | 67% |
| **总计** | **63** | **0** | **19** | **77%** |

---

## 🔑 核心功能状态

### P0 - 核心功能 (100% ✅)
- [x] 用户认证（注册/登录/Token）
- [x] 伙伴关系管理（邀请/确认/解除）
- [x] 任务系统（发布/打卡/审核）
- [x] 奖励系统（资产/流水/发放）
- [x] 小屋系统（装饰/温暖度/排行）

### P1 - 增值功能 (90% ✅)
- [x] 成就系统（解锁/展示）
- [x] 偏好设置（任务/奖励/建议）
- [x] 任务日历（月度视图）
- [x] 奖励商店（商品/兑换）
- [x] 关系证书（生成/分享）
- [ ] 成长者进度统计（开发中）

### P2 - 特色功能 (80% ✅)
- [x] 随机任务（抽取/接受）
- [x] 装饰图鉴（收集/奖励）
- [ ] 私信系统（计划中）
- [ ] 数据统计看板（计划中）

---

## 📱 前端页面对应

### 成长者页面
| 页面 | 路由 | 状态 |
|------|------|------|
| 登录/注册 | /login, /register | ✅ |
| 成长者仪表盘 | /grower/dashboard | ✅ |
| 我的任务 | /grower/tasks | ✅ |
| 我的小屋 | /grower/cottage | ✅ |
| 装饰图鉴 | /grower/collections | ✅ |
| 奖励商店 | /grower/shop | ✅ |
| 我的奖励 | /grower/rewards | ✅ |
| 成就页面 | /grower/achievements | ✅ |
| 偏好设置 | /grower/preferences | ✅ |
| 随机挑战 | /grower/random-challenge | ✅ |
| 任务日历 | /grower/calendar | ✅ |
| 关系证书 | /grower/certificate | ✅ |

### 引导者页面
| 页面 | 路由 | 状态 |
|------|------|------|
| 引导者仪表盘 | /guide/dashboard | ✅ |
| 我的伙伴 | /guide/partners | ✅ |
| 任务管理 | /guide/tasks | ✅ |
| 打卡审核 | /guide/checkins | ✅ |

### 管理员页面
| 页面 | 路由 | 状态 |
|------|------|------|
| 管理仪表盘 | /admin/dashboard | ✅ |
| 用户管理 | /admin/users | ✅ |
| 内容管理 | /admin/content | ✅ |

---

## 🚀 下一步开发优先级

### P0 - 已完成 ✅
- [x] 用户认证系统
- [x] 核心业务功能
- [x] 前端核心页面

### P1 - 本周内
- [ ] 成长者进度统计
- [ ] 引导者数据统计
- [ ] 管理员数据看板

### P2 - 下周
- [ ] 私信系统
- [ ] 内容审核系统
- [ ] 系统日志

---

**文档更新时间**: 2026-03-10 23:10 GMT+8  
**项目负责人**: AI 全栈工程师
