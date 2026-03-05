# 排班系统 (Shift Scheduling System)

## 功能概述

每月 26 日～次月 25 日排班周期，支持约 200 人排班管理。

## 班次类型

- **G 班**：前一天只能是休息或 G
- **T 班**：前一天不能是 Y，后一天不能是 G
- **Y 班**：后一天只能是 Y 或休息

## 上班规则

1. 不可连续上班 7 天，最多连续 6 天
2. 连续上班>3 天，必须包含至少 2 种班次
3. 每人每月固定休息 X 天
4. 每日 G/T/Y 按固定人数比例排班
5. 同组别员工尽量班次、休息一致
6. 支持员工指定日期优先休息

## 项目结构

```
shift-scheduling/
├── src/                    # 源代码
│   ├── __init__.py
│   ├── models.py          # 数据模型
│   ├── constraints.py     # 约束规则
│   ├── scheduler.py       # 排班核心算法
│   ├── excel_handler.py   # Excel 导入导出
│   └── utils.py           # 工具函数
├── data/                   # 输入数据
│   └── employees.xlsx     # 员工信息
├── output/                 # 输出结果
│   └── schedule.xlsx      # 排班结果
├── tests/                  # 测试文件
├── requirements.txt       # 依赖
└── main.py                # 主入口
```

## 使用方法

```bash
# 安装依赖
pip install -r requirements.txt

# 运行排班
python main.py

# 运行测试
python -m pytest tests/
```

## 配置文件

在 `config.json` 中配置：
- 排班周期
- 班次比例
- 休息天数
- 约束参数
