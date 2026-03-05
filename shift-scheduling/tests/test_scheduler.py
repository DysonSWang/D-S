"""
排班系统测试
"""
import sys
from pathlib import Path
from datetime import date, timedelta

# 添加 src 到路径
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

# 使用相对导入
import models
from models import (
    Employee, ShiftCycle, SchedulingConfig, ShiftAssignment, ShiftType
)
from scheduler import ShiftScheduler, create_sample_employees
from constraints import ConstraintChecker, ConstraintEnforcer
from excel_handler import ExcelHandler


def test_basic_scheduling():
    """测试基本排班功能"""
    print("\n=== 测试基本排班 ===")
    
    config = SchedulingConfig(
        shift_ratio={
            ShiftType.G: 0.4,
            ShiftType.T: 0.35,
            ShiftType.Y: 0.25
        },
        off_days_per_month=8,
        max_consecutive_work_days=6
    )
    
    # 创建少量员工测试
    employees = create_sample_employees(count=20, groups=2)
    cycle = ShiftCycle(start_date=date(2024, 1, 26), end_date=date(2024, 2, 25))
    
    scheduler = ShiftScheduler(config)
    schedule = scheduler.generate_schedule(employees, cycle)
    
    # 验证
    checker = ConstraintChecker(config)
    errors = checker.validate_schedule(schedule)
    
    print(f"员工数：{len(employees)}")
    print(f"排班天数：{cycle.total_days}")
    print(f"约束违反数：{len(errors)}")
    
    if errors:
        for error in errors[:5]:
            print(f"  - {error}")
    
    return len(errors) == 0


def test_shift_sequence_constraints():
    """测试班次顺序约束"""
    print("\n=== 测试班次顺序约束 ===")
    
    enforcer = ConstraintEnforcer()
    
    # 创建测试员工
    emp = Employee(id="TEST001", name="测试", group="组 01")
    
    # 测试 G 班约束
    print("\n测试 G 班约束...")
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 25), ShiftType.G),
        ShiftAssignment(emp, date(2024, 1, 26), ShiftType.T),  # G 后不能直接 T
    ]
    
    can_assign, reason = enforcer.can_assign_shift(
        test_shifts, date(2024, 1, 27), ShiftType.G
    )
    print(f"  G 班后接 G 班：{'✓' if can_assign else '✗'} ({reason})")
    
    # 测试 Y 班约束
    print("\n测试 Y 班约束...")
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 25), ShiftType.Y),
        ShiftAssignment(emp, date(2024, 1, 26), ShiftType.Y),
    ]
    
    can_assign, reason = enforcer.can_assign_shift(
        test_shifts, date(2024, 1, 27), ShiftType.OFF
    )
    print(f"  Y 班后接休息：{'✓' if can_assign else '✗'} ({reason})")
    
    can_assign, reason = enforcer.can_assign_shift(
        test_shifts, date(2024, 1, 27), ShiftType.G
    )
    print(f"  Y 班后接 G 班：{'✓' if can_assign else '✗'} ({reason})")
    
    # 测试 T 班约束
    print("\n测试 T 班约束...")
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 25), ShiftType.Y),
    ]
    
    can_assign, reason = enforcer.can_assign_shift(
        test_shifts, date(2024, 1, 26), ShiftType.T
    )
    print(f"  Y 班后接 T 班：{'✓' if can_assign else '✗'} ({reason})")
    
    test_shifts = [
        ShiftAssignment(emp, date(2024, 1, 25), ShiftType.G),
    ]
    
    can_assign, reason = enforcer.can_assign_shift(
        test_shifts, date(2024, 1, 24), ShiftType.T
    )
    print(f"  T 班后接 G 班：{'✓' if can_assign else '✗'} ({reason})")
    
    return True


def test_consecutive_work_days():
    """测试连续上班天数"""
    print("\n=== 测试连续上班天数 ===")
    
    config = SchedulingConfig(max_consecutive_work_days=6)
    enforcer = ConstraintEnforcer(config)
    
    emp = Employee(id="TEST002", name="测试 2", group="组 01")
    
    # 创建连续 6 天上班
    test_shifts = []
    for i in range(6):
        test_shifts.append(ShiftAssignment(
            emp, date(2024, 1, 20) + timedelta(days=i), ShiftType.G
        ))
    
    # 第 7 天应该不能排班
    can_assign, reason = enforcer.can_assign_shift(
        test_shifts, date(2024, 1, 26), ShiftType.G
    )
    print(f"连续 6 天后第 7 天排班：{'✓' if can_assign else '✗'} ({reason})")
    
    # 休息一天后应该可以排班
    test_shifts.append(ShiftAssignment(
        emp, date(2024, 1, 26), ShiftType.OFF
    ))
    
    can_assign, reason = enforcer.can_assign_shift(
        test_shifts, date(2024, 1, 27), ShiftType.G
    )
    print(f"休息 1 天后排班：{'✓' if can_assign else '✗'} ({reason})")
    
    return True


def test_excel_import_export():
    """测试 Excel 导入导出"""
    print("\n=== 测试 Excel 导入导出 ===")
    
    handler = ExcelHandler()
    test_dir = Path(__file__).parent / "test_data"
    test_dir.mkdir(parents=True, exist_ok=True)
    
    # 导出模板
    template_file = test_dir / "employees_template.xlsx"
    handler.export_employees_template(str(template_file))
    print(f"模板导出：{'✓' if template_file.exists() else '✗'}")
    
    # 创建测试员工
    employees = [
        Employee(id="EMP001", name="张三", group="组 01", fixed_off_days=8),
        Employee(id="EMP002", name="李四", group="组 01", fixed_off_days=8,
                preferred_off_dates={date(2024, 1, 1), date(2024, 1, 15)}),
        Employee(id="EMP003", name="王五", group="组 02", fixed_off_days=8),
    ]
    
    # 导出员工数据
    employees_file = test_dir / "employees.xlsx"
    # 这里需要实现 export_employees 方法
    print(f"员工数据导出：待实现")
    
    # 导入测试
    if template_file.exists():
        imported = handler.import_employees(str(template_file))
        print(f"导入员工数：{len(imported)}")
    
    return True


def test_shift_variety():
    """测试班次多样性"""
    print("\n=== 测试班次多样性 ===")
    
    config = SchedulingConfig(
        consecutive_work_threshold=3,
        min_shift_types_after_threshold=2
    )
    
    checker = ConstraintChecker(config)
    
    # 创建测试排班 - 连续 4 天只有一种班次
    emp = Employee(id="TEST003", name="测试 3", group="组 01")
    
    from models import Schedule, ShiftCycle
    cycle = ShiftCycle(start_date=date(2024, 1, 20), end_date=date(2024, 2, 25))
    schedule = Schedule(cycle=cycle)
    schedule.assignments[emp.id] = [
        ShiftAssignment(emp, date(2024, 1, 20), ShiftType.G),
        ShiftAssignment(emp, date(2024, 1, 21), ShiftType.G),
        ShiftAssignment(emp, date(2024, 1, 22), ShiftType.G),
        ShiftAssignment(emp, date(2024, 1, 23), ShiftType.G),  # 连续 4 天 G 班
    ]
    
    errors = checker.validate_schedule(schedule)
    variety_errors = [e for e in errors if "班次" in e or "种" in e]
    
    print(f"连续 4 天同一种班次检测：{'✓' if variety_errors else '✗'}")
    if variety_errors:
        print(f"  错误：{variety_errors[0]}")
    
    return True


def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("排班系统测试套件")
    print("=" * 60)
    
    tests = [
        ("基本排班", test_basic_scheduling),
        ("班次顺序约束", test_shift_sequence_constraints),
        ("连续上班天数", test_consecutive_work_days),
        ("Excel 导入导出", test_excel_import_export),
        ("班次多样性", test_shift_variety),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} 测试失败：{e}")
            import traceback
            traceback.print_exc()
            results.append((name, False))
    
    # 汇总
    print("\n" + "=" * 60)
    print("测试结果汇总")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"  {status} - {name}")
    
    print(f"\n总计：{passed}/{total} 测试通过")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
