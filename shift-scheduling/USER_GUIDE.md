# 排班系统使用指南

## 快速开始

### 1. 安装依赖

```bash
cd shift-scheduling
pip install -r requirements.txt
```

### 2. 准备员工数据

**方式一：使用模板**

```bash
python -c "from src.excel_handler import ExcelHandler; ExcelHandler().export_employees_template('data/employees_template.xlsx')"
```

打开 `data/employees_template.xlsx`，填写员工信息：

| 员工 ID | 姓名 | 组别 | 固定休息天数 | 优先休息日期 |
|--------|------|------|------------|-------------|
| EMP001 | 张三 | 组 01 | 8 | 2024-01-01,2024-01-15 |
| EMP002 | 李四 | 组 01 | 8 | |

**方式二：自动生成示例数据**

```bash
python -c "from src.scheduler import create_sample_employees; from src.excel_handler import ExcelHandler; import pandas as pd; employees = create_sample_employees(200, 10); df = pd.DataFrame([{'员工 ID': e.id, '姓名': e.name, '组别': e.group, '固定休息天数': e.fixed_off_days, '优先休息日期': ','.join(map(str, e.preferred_off_dates))} for e in employees]); df.to_excel('data/employees.xlsx', index=False)"
```

### 3. 配置排班参数

编辑 `config.json`：

```json
{
  "shift_ratio": {
    "G": 0.4,
    "T": 0.35,
    "Y": 0.25
  },
  "off_days_per_month": 8,
  "max_consecutive_work_days": 6,
  "consecutive_work_threshold": 3,
  "min_shift_types_after_threshold": 2,
  "total_employees": 200
}
```

### 4. 运行排班

```bash
python main.py
```

输出文件：
- `output/schedule_YYYYMM.xlsx` - 排班结果
- `output/config.json` - 使用的配置

## 功能说明

### 班次类型

| 班次 | 代码 | 约束规则 |
|------|------|---------|
| G 班 | G | 前一天只能是休息或 G |
| T 班 | T | 前一天不能是 Y，后一天不能是 G |
| Y 班 | Y | 后一天只能是 Y 或休息 |
| 休息 | OFF | 无约束 |

### 上班规则

1. **连续上班限制**：最多连续 6 天，第 7 天必须休息
2. **班次多样性**：连续上班超过 3 天时，必须包含至少 2 种班次
3. **固定休息**：每人每月固定休息 X 天（默认 8 天）
4. **人力比例**：每日 G/T/Y 按配置比例排班

### 组别管理

- 同组别员工尽量安排相同班次和休息日
- 支持多组别并行排班
- 输出可按组别分 sheet 或合并

### 优先休息

员工可指定优先休息日期，系统会尽量满足：

```python
employee.preferred_off_dates = {
    date(2024, 1, 1),
    date(2024, 1, 15),
    date(2024, 2, 1)
}
```

## API 使用

### Python 编程接口

```python
from src.models import Employee, ShiftCycle, SchedulingConfig, ShiftType
from src.scheduler import ShiftScheduler
from src.excel_handler import ExcelHandler

# 配置
config = SchedulingConfig(
    shift_ratio={ShiftType.G: 0.4, ShiftType.T: 0.35, ShiftType.Y: 0.25},
    off_days_per_month=8,
    max_consecutive_work_days=6
)

# 创建员工
employees = [
    Employee(id="EMP001", name="张三", group="组 01"),
    Employee(id="EMP002", name="李四", group="组 01"),
]

# 创建排班周期
cycle = ShiftCycle(
    start_date=date(2024, 1, 26),
    end_date=date(2024, 2, 25)
)

# 生成排班
scheduler = ShiftScheduler(config)
schedule = scheduler.generate_schedule(employees, cycle)

# 验证
from src.constraints import ConstraintChecker
checker = ConstraintChecker(config)
errors = checker.validate_schedule(schedule)

if errors:
    print("排班问题:", errors)
else:
    print("排班成功!")

# 导出
handler = ExcelHandler()
handler.export_schedule(schedule, employees, "output/schedule.xlsx")
```

### 导入现有排班

```python
handler = ExcelHandler()
employees = handler.import_employees("data/employees.xlsx")
```

## 运行测试

```bash
python -m pytest tests/
# 或
python tests/test_scheduler.py
```

## 高级配置

### 自定义每日人力需求

```python
from src.models import DailyRequirement

daily_requirements = {
    date(2024, 1, 26): DailyRequirement(
        date=date(2024, 1, 26),
        g_count=80,
        t_count=70,
        y_count=50
    ),
    # ... 其他日期
}

schedule = scheduler.generate_schedule(
    employees, cycle, daily_requirements
)
```

### 循环排班

```python
# 生成多个月份的排班
for month in range(1, 13):
    cycle = ShiftCycle.from_month(2024, month)
    schedule = scheduler.generate_schedule(employees, cycle)
    handler.export_schedule(
        schedule, employees,
        f"output/schedule_2024{month:02d}.xlsx"
    )
```

## 故障排查

### 常见问题

**Q: 排班无法满足所有约束**
- 检查员工数量是否足够
- 调整班次比例
- 增加休息天数

**Q: 连续上班天数超限**
- 系统会自动插入休息日
- 检查 `max_consecutive_work_days` 配置

**Q: 班次顺序违反**
- 系统会尝试自动调整
- 查看错误日志定位问题员工

### 查看日志

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 性能优化

对于 200 人规模：
- 排班时间：约 10-30 秒
- 内存占用：约 50-100MB

优化建议：
1. 减少排班周期天数
2. 降低优化迭代次数
3. 使用多进程处理多月份

## 扩展开发

### 添加新约束

```python
from src.constraints import ConstraintChecker

class CustomConstraintChecker(ConstraintChecker):
    def validate_schedule(self, schedule):
        errors = super().validate_schedule(schedule)
        # 添加自定义检查
        return errors
```

### 自定义排班算法

```python
from src.scheduler import ShiftScheduler

class CustomScheduler(ShiftScheduler):
    def _assign_shifts(self, *args, **kwargs):
        # 自定义分配逻辑
        pass
```

## 技术支持

遇到问题请提供：
1. 错误日志
2. 员工数据样本
3. 配置文件
4. 期望的排班结果
