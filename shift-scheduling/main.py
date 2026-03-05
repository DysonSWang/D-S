"""
排班系统主入口
"""
import sys
from pathlib import Path
from datetime import date

# 添加 src 到路径
sys.path.insert(0, str(Path(__file__).parent / "src"))

from models import Employee, ShiftCycle, SchedulingConfig
from scheduler import ShiftScheduler, create_sample_employees
from excel_handler import ExcelHandler
from constraints import ConstraintChecker


def main():
    """主函数"""
    print("=" * 60)
    print("排班系统 v1.0")
    print("=" * 60)
    
    # 配置
    config = SchedulingConfig(
        shift_ratio={
            # 需要在导入时修复
        },
        off_days_per_month=8,
        max_consecutive_work_days=6,
        consecutive_work_threshold=3,
        min_shift_types_after_threshold=2,
        total_employees=200
    )
    
    # 修正 shift_ratio
    from models import ShiftType
    config.shift_ratio = {
        ShiftType.G: 0.4,
        ShiftType.T: 0.35,
        ShiftType.Y: 0.25
    }
    
    # 初始化
    excel_handler = ExcelHandler()
    scheduler = ShiftScheduler(config)
    
    # 项目根目录
    base_dir = Path(__file__).parent
    data_dir = base_dir / "data"
    output_dir = base_dir / "output"
    
    data_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. 如果员工数据不存在，创建示例数据
    employees_file = data_dir / "employees.xlsx"
    if not employees_file.exists():
        print("\n创建员工模板...")
        excel_handler.export_employees_template(str(employees_file))
        print(f"模板已创建：{employees_file}")
        
        # 创建示例员工数据
        print("\n生成示例员工数据 (200 人)...")
        employees = create_sample_employees(count=200, groups=10)
        
        # 保存示例数据
        temp_wb = excel_handler.export_employees_template(str(employees_file))
        # 重新导入以使用实际数据
        employees = create_sample_employees(count=200, groups=10)
    else:
        print(f"\n导入员工数据：{employees_file}")
        employees = excel_handler.import_employees(str(employees_file))
    
    print(f"员工总数：{len(employees)}")
    
    # 2. 创建排班周期 (示例：2024 年 1 月 26 日 - 2 月 25 日)
    cycle = ShiftCycle.from_month(2024, 1)
    print(f"\n排班周期：{cycle.start_date} 至 {cycle.end_date}")
    print(f"周期天数：{cycle.total_days}")
    
    # 3. 生成排班
    print("\n正在生成排班...")
    schedule = scheduler.generate_schedule(employees, cycle)
    
    # 4. 验证排班
    print("\n验证排班结果...")
    checker = ConstraintChecker(config)
    errors = checker.validate_schedule(schedule)
    
    if errors:
        print(f"\n⚠️  发现 {len(errors)} 个问题:")
        for i, error in enumerate(errors[:10], 1):  # 只显示前 10 个
            print(f"  {i}. {error}")
        if len(errors) > 10:
            print(f"  ... 还有 {len(errors) - 10} 个问题")
    else:
        print("✓ 排班满足所有约束!")
    
    # 5. 导出结果
    output_file = output_dir / f"schedule_{cycle.start_date.strftime('%Y%m')}.xlsx"
    print(f"\n导出排班结果：{output_file}")
    excel_handler.export_schedule(schedule, employees, str(output_file))
    
    # 6. 导出配置
    config_file = output_dir / "config.json"
    excel_handler.export_config(config, str(config_file))
    print(f"配置文件：{config_file}")
    
    # 7. 统计信息
    print("\n" + "=" * 60)
    print("排班统计")
    print("=" * 60)
    
    # 按班次统计
    shift_counts = {ShiftType.G: 0, ShiftType.T: 0, ShiftType.Y: 0, ShiftType.OFF: 0}
    for emp_id, assignments in schedule.assignments.items():
        for a in assignments:
            shift_counts[a.shift] = shift_counts.get(a.shift, 0) + 1
    
    total = sum(shift_counts.values())
    print(f"\n总班次数：{total}")
    for shift, count in shift_counts.items():
        pct = count / total * 100 if total > 0 else 0
        print(f"  {shift.value}班：{count} ({pct:.1f}%)")
    
    # 人均休息天数
    avg_off = sum(
        sum(1 for a in assignments if a.shift == ShiftType.OFF)
        for assignments in schedule.assignments.values()
    ) / len(schedule.assignments) if schedule.assignments else 0
    print(f"\n人均休息天数：{avg_off:.1f}天")
    
    print("\n" + "=" * 60)
    print("排班完成!")
    print("=" * 60)
    
    return schedule


if __name__ == "__main__":
    main()
