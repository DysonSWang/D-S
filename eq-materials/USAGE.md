# 情商培养物料体系 - 使用说明

## ✅ 已搭建完成

### 目录结构
```
eq-materials/
├── README.md                 # 体系说明
├── library/                  # 案例库
│   ├── literature/           # 文学案例 (3 个初始案例)
│   ├── movies/               # 影视案例 (3 个初始案例)
│   └── hot-topics/           # 热点案例
├── templates/                # 模板
│   └── daily-report.md       # 日报模板
├── scripts/                  # 脚本
│   └── generate.sh           # 生成脚本
├── output/                   # 输出目录
│   └── daily-2026-01-15.md   # 示例输出
└── config/                   # 配置
    ├── prompt-template.md    # LLM 提示词
    └── cron-setup.md         # 定时任务配置
```

## 🚀 使用方式

### 手动生成
```bash
cd /root/.openclaw/workspace/eq-materials
./scripts/generate.sh daily
```

### 自动生成（需配置 cron）
参考 `config/cron-setup.md` 配置每日 8:00 自动任务

### 内容来源
1. **文学案例** - `library/literature/classic-cases.md`
2. **影视案例** - `library/movies/classic-cases.md`
3. **热点事件** - 通过 `web_search` 抓取后分析

## 📋 情商维度
- 自我认知
- 情绪管理
- 自我激励
- 同理心
- 社交技能

## 🔄 后续扩展
1. 增加图片生成 (`image-generate` skill)
2. 增加视频生成 (`video-generate` skill)
3. 增加音频故事 (`tts`)
4. 多平台分发配置

## 📝 案例积累
- 验证通过的案例存入对应库文件
- 标注来源和验证状态
- 按情商维度打标签

---

*体系已就绪，可开始使用*
